"""
Async notification tasks. Called by services after completing critical operations.
All tasks are idempotent and safe to retry.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)

LOW_STOCK_THRESHOLD_KG = 1000  # Alert when any product drops below this


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def notify_batch_completed(self, batch_id: str, stage: str) -> None:
    """
    Push a success notification to all directors and production managers when
    a cotton or yarn batch is completed.
    stage: "cotton" | "yarn"
    """
    from apps.users.models import User
    from .signals import push_notification_to_user

    try:
        if stage == "cotton":
            from apps.cotton_production.models import CottonBatch
            batch = CottonBatch.objects.get(id=batch_id)
            title = f"Cotton batch completed: {batch.batch_code}"
            message = (
                f"Fiber output: {batch.fiber_output_kg:.1f} kg | "
                f"Cost/kg: {batch.calculated_fiber_cost_per_kg:.2f} UZS | "
                f"Yield: {batch.fiber_yield_pct:.1f}%"
            )
            ref_type = "cotton_batch"
        else:
            from apps.yarn_production.models import YarnBatch
            batch = YarnBatch.objects.get(id=batch_id)
            title = f"Yarn batch completed: {batch.batch_code}"
            message = (
                f"Yarn output: {batch.yarn_output_kg:.1f} kg | "
                f"Cost/kg: {batch.calculated_yarn_cost_per_kg:.2f} UZS | "
                f"Efficiency: {batch.efficiency_pct:.1f}%"
            )
            ref_type = "yarn_batch"

        recipients = User.objects.filter(
            role__in=["admin", "director", "production_manager"],
            is_active=True,
        )
        for user in recipients:
            push_notification_to_user(
                user_id=str(user.id),
                title=title,
                message=message,
                level="success",
                event_type="batch_completed",
                reference_type=ref_type,
                reference_id=batch_id,
            )
        logger.info("notify_batch_completed: stage=%s batch=%s recipients=%d", stage, batch_id, recipients.count())
    except Exception as exc:
        logger.error("notify_batch_completed failed: %s", exc)
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def check_cost_spike(self, batch_id: str, stage: str) -> None:
    """
    Compare new batch cost/kg against the rolling 30-day average.
    Alert directors and accountants if the spike exceeds 15%.
    """
    from decimal import Decimal
    from apps.users.models import User
    from .signals import push_notification_to_user

    SPIKE_THRESHOLD_PCT = Decimal("0.15")

    try:
        if stage == "cotton":
            from apps.cotton_production.models import CottonBatch, BatchStatus
            batch = CottonBatch.objects.get(id=batch_id)
            new_cost = batch.calculated_fiber_cost_per_kg
            avg_cost = (
                CottonBatch.objects.filter(status=BatchStatus.COMPLETED)
                .exclude(id=batch_id)
                .order_by("-end_date")[:30]
                .values_list("calculated_fiber_cost_per_kg", flat=True)
            )
        else:
            from apps.yarn_production.models import YarnBatch, BatchStatus
            batch = YarnBatch.objects.get(id=batch_id)
            new_cost = batch.calculated_yarn_cost_per_kg
            avg_cost = (
                YarnBatch.objects.filter(status=BatchStatus.COMPLETED)
                .exclude(id=batch_id)
                .order_by("-end_date")[:30]
                .values_list("calculated_yarn_cost_per_kg", flat=True)
            )

        costs = list(avg_cost)
        if not costs or new_cost is None:
            return

        rolling_avg = sum(costs, Decimal("0")) / len(costs)
        if rolling_avg <= 0:
            return

        spike_pct = (new_cost - rolling_avg) / rolling_avg
        if spike_pct <= SPIKE_THRESHOLD_PCT:
            return

        pct_str = f"{float(spike_pct) * 100:.1f}%"
        title = f"Cost spike alert: {batch.batch_code}"
        message = (
            f"{stage.capitalize()} batch cost {new_cost:.2f} UZS/kg is "
            f"{pct_str} above the 30-batch average of {rolling_avg:.2f} UZS/kg."
        )

        recipients = User.objects.filter(
            role__in=["admin", "director", "accountant"],
            is_active=True,
        )
        for user in recipients:
            push_notification_to_user(
                user_id=str(user.id),
                title=title,
                message=message,
                level="warning",
                event_type="cost_spike",
                reference_type=f"{stage}_batch",
                reference_id=batch_id,
            )
        logger.info("check_cost_spike: spike=%s%% batch=%s", pct_str, batch_id)
    except Exception as exc:
        logger.error("check_cost_spike failed: %s", exc)
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def check_low_stock(self) -> None:
    """
    Periodic task (runs every hour via Beat).
    Scans all StockLedger rows and alerts warehouse managers + directors
    for any product whose balance is below LOW_STOCK_THRESHOLD_KG.
    De-duplicated: only fires one notification per (product, warehouse) per 24h.
    """
    from django.utils import timezone
    from datetime import timedelta
    from apps.warehouse.models import StockLedger
    from apps.users.models import User
    from .models import Notification
    from .signals import push_notification_to_user

    low_entries = StockLedger.objects.filter(
        quantity_kg__lt=LOW_STOCK_THRESHOLD_KG,
        quantity_kg__gt=0,
    ).select_related("warehouse", "product")

    cutoff = timezone.now() - timedelta(hours=24)
    recipients = list(
        User.objects.filter(
            role__in=["admin", "director", "warehouse_manager"],
            is_active=True,
        )
    )

    for entry in low_entries:
        already_sent = Notification.objects.filter(
            event_type="low_stock",
            reference_type="stock_ledger",
            reference_id=str(entry.id),
            created_at__gte=cutoff,
        ).exists()
        if already_sent:
            continue

        title = f"Low stock: {entry.product.name}"
        message = (
            f"{entry.warehouse.name} has only {entry.quantity_kg:.1f} kg of "
            f"{entry.product.name} remaining (threshold: {LOW_STOCK_THRESHOLD_KG} kg)."
        )
        for user in recipients:
            push_notification_to_user(
                user_id=str(user.id),
                title=title,
                message=message,
                level="warning",
                event_type="low_stock",
                reference_type="stock_ledger",
                reference_id=str(entry.id),
            )
        logger.info("low_stock alert: %s @ %s (%.1f kg)", entry.product.name, entry.warehouse.name, entry.quantity_kg)
