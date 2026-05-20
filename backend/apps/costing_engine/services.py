"""
Costing engine — aggregation layer over cotton/yarn batch data.
Provides trend analysis, cross-batch comparisons, and KPI computations.
"""
import logging
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Avg, Sum, Min, Max, Count, Q
from django.db.models.functions import TruncMonth, TruncWeek

from .models import CostSnapshot
from apps.cotton_production.models import CottonBatch, BatchStatus as CottonBatchStatus
from apps.yarn_production.models import YarnBatch, BatchStatus as YarnBatchStatus

logger = logging.getLogger(__name__)


def record_cotton_batch_snapshot(cotton_batch: "CottonBatch") -> CostSnapshot:
    """Call this after a cotton batch is completed to persist a cost snapshot."""
    from apps.warehouse.models import Product
    fiber_product = Product.objects.filter(product_type="fiber", is_active=True).first()

    expenses_breakdown = {}
    for exp in cotton_batch.expenses.all():
        expenses_breakdown[exp.category] = float(
            expenses_breakdown.get(exp.category, 0) + exp.amount
        )

    snapshot = CostSnapshot.objects.create(
        stage=CostSnapshot.ProductionStage.COTTON_TO_FIBER,
        reference_type="cotton_batch",
        reference_id=cotton_batch.id,
        snapshot_date=cotton_batch.end_date or date.today(),
        input_kg=cotton_batch.cotton_input_kg,
        input_cost=cotton_batch.cotton_cost_total,
        output_kg=cotton_batch.fiber_output_kg,
        output_cost_per_kg=cotton_batch.calculated_fiber_cost_per_kg,
        total_output_cost=cotton_batch.net_cost,
        expenses_breakdown=expenses_breakdown,
        yield_pct=cotton_batch.fiber_yield_pct,
        product=fiber_product,
    )
    return snapshot


def record_yarn_batch_snapshot(yarn_batch: "YarnBatch") -> CostSnapshot:
    """Call this after a yarn batch is completed to persist a cost snapshot."""
    expenses_breakdown = {}
    for exp in yarn_batch.expenses.all():
        expenses_breakdown[exp.category] = float(
            expenses_breakdown.get(exp.category, 0) + exp.amount
        )

    snapshot = CostSnapshot.objects.create(
        stage=CostSnapshot.ProductionStage.FIBER_TO_YARN,
        reference_type="yarn_batch",
        reference_id=yarn_batch.id,
        snapshot_date=yarn_batch.end_date or date.today(),
        input_kg=yarn_batch.fiber_input_kg,
        input_cost=yarn_batch.fiber_cost_total,
        output_kg=yarn_batch.yarn_output_kg,
        output_cost_per_kg=yarn_batch.calculated_yarn_cost_per_kg,
        total_output_cost=yarn_batch.net_cost,
        expenses_breakdown=expenses_breakdown,
        waste_pct=yarn_batch.waste_pct,
        product=yarn_batch.yarn_product,
    )
    return snapshot


def get_current_yarn_costs() -> list[dict]:
    """Latest cost per yarn product from the most recent completed batch."""
    from apps.warehouse.models import Product
    yarn_products = Product.objects.filter(product_type="yarn", is_active=True)
    results = []
    for product in yarn_products:
        latest = (
            CostSnapshot.objects
            .filter(stage=CostSnapshot.ProductionStage.FIBER_TO_YARN, product=product)
            .order_by("-snapshot_date")
            .first()
        )
        results.append({
            "product_id": str(product.id),
            "product_name": product.name,
            "yarn_count": product.yarn_count,
            "yarn_type": product.yarn_type,
            "cost_per_kg": latest.output_cost_per_kg if latest else None,
            "snapshot_date": latest.snapshot_date if latest else None,
        })
    return results


def get_cost_trend(
    stage: str,
    days: int = 90,
    product_id: str = None,
) -> list[dict]:
    """Weekly average cost trend for a given stage over the past N days."""
    since = date.today() - timedelta(days=days)
    qs = CostSnapshot.objects.filter(stage=stage, snapshot_date__gte=since)
    if product_id:
        qs = qs.filter(product_id=product_id)

    trend = (
        qs.annotate(week=TruncWeek("snapshot_date"))
        .values("week")
        .annotate(avg_cost=Avg("output_cost_per_kg"), batches=Count("id"))
        .order_by("week")
    )
    return list(trend)


def get_expense_breakdown_aggregate(
    stage: str,
    start_date: date = None,
    end_date: date = None,
) -> dict:
    """Aggregate expense breakdowns across all snapshots in the date range."""
    qs = CostSnapshot.objects.filter(stage=stage)
    if start_date:
        qs = qs.filter(snapshot_date__gte=start_date)
    if end_date:
        qs = qs.filter(snapshot_date__lte=end_date)

    totals: dict[str, Decimal] = {}
    for snapshot in qs:
        for category, amount in snapshot.expenses_breakdown.items():
            totals[category] = totals.get(category, Decimal("0")) + Decimal(str(amount))
    return totals


def get_kpi_summary(as_of: date = None) -> dict:
    """High-level KPI numbers for the dashboard."""
    as_of = as_of or date.today()
    month_start = as_of.replace(day=1)

    cotton_qs = CottonBatch.objects.filter(
        status=CottonBatchStatus.COMPLETED,
        end_date__gte=month_start,
        end_date__lte=as_of,
    )
    yarn_qs = YarnBatch.objects.filter(
        status=YarnBatchStatus.COMPLETED,
        end_date__gte=month_start,
        end_date__lte=as_of,
    )

    fiber_stats = cotton_qs.aggregate(
        total_fiber_kg=Sum("fiber_output_kg"),
        avg_fiber_cost=Avg("calculated_fiber_cost_per_kg"),
        total_cotton_kg=Sum("cotton_input_kg"),
    )
    yarn_stats = yarn_qs.aggregate(
        total_yarn_kg=Sum("yarn_output_kg"),
        avg_yarn_cost=Avg("calculated_yarn_cost_per_kg"),
        total_fiber_consumed=Sum("fiber_input_kg"),
        avg_waste_pct=Avg("waste_pct"),
        avg_efficiency=Avg("efficiency_pct"),
    )

    return {
        "period": {"start": month_start.isoformat(), "end": as_of.isoformat()},
        "fiber": fiber_stats,
        "yarn": yarn_stats,
        "cotton_batches_completed": cotton_qs.count(),
        "yarn_batches_completed": yarn_qs.count(),
    }
