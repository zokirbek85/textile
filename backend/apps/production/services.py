"""
Production management business logic.

Key invariants:
- Tolling (davalliq) orders must reference a TollingContract
- A ProductionOrder moves through: draft → approved → in_progress → completed
- Batch traceability links batches back to their production orders and contracts
- Brigade 4-shift rotation enforced at the serializer/view level
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from core.exceptions import BusinessLogicError
from .models import (
    ProductionOrder, ProductionBatch, ProductionShiftReport,
    OrderStatus, BatchStatus, ReportStatus,
)

logger = logging.getLogger("apps.production")


# ─── Production Order Services ────────────────────────────────────────────────

def approve_production_order(order: ProductionOrder, approved_by) -> ProductionOrder:
    if order.status != OrderStatus.DRAFT:
        raise BusinessLogicError(
            f"Faqat 'Qoralama' holatdagi buyurtmani tasdiqlash mumkin. Hozirgi holat: {order.get_status_display()}"
        )
    with transaction.atomic():
        order.status = OrderStatus.APPROVED
        order.approved_by = approved_by
        order.approved_at = timezone.now()
        order.updated_by = approved_by
        order.save(update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"])
    logger.info("Production order %s approved by %s", order.order_number, approved_by)
    return order


def start_production_order(order: ProductionOrder, user) -> ProductionOrder:
    if order.status != OrderStatus.APPROVED:
        raise BusinessLogicError(
            f"Faqat 'Tasdiqlangan' buyurtmani ishga tushirish mumkin. Hozirgi holat: {order.get_status_display()}"
        )
    with transaction.atomic():
        order.status = OrderStatus.IN_PROGRESS
        order.actual_start_date = timezone.now()
        order.updated_by = user
        order.save(update_fields=["status", "actual_start_date", "updated_by", "updated_at"])
    logger.info("Production order %s started", order.order_number)
    return order


def complete_production_order(order: ProductionOrder, user) -> ProductionOrder:
    if order.status != OrderStatus.IN_PROGRESS:
        raise BusinessLogicError(
            f"Faqat 'Jarayonda' buyurtmani yakunlash mumkin. Hozirgi holat: {order.get_status_display()}"
        )

    # Sum actual output from all non-failed batches
    batches = order.batches.all().exclude(status=BatchStatus.QC_FAILED)
    actual_output = batches.aggregate(
        total=models_Sum("quantity_kg")
    )["total"] or Decimal("0")

    with transaction.atomic():
        order.status = OrderStatus.COMPLETED
        order.actual_output_kg = actual_output
        order.actual_end_date = timezone.now()
        order.updated_by = user
        order.save(update_fields=[
            "status", "actual_output_kg", "actual_end_date", "updated_by", "updated_at"
        ])
    logger.info(
        "Production order %s completed. Planned: %s kg, Actual: %s kg",
        order.order_number, order.planned_output_kg, actual_output,
    )
    return order


def cancel_production_order(order: ProductionOrder, user, reason: str = "") -> ProductionOrder:
    if order.status in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
        raise BusinessLogicError(
            f"Bu buyurtmani bekor qilib bo'lmaydi. Holat: {order.get_status_display()}"
        )
    with transaction.atomic():
        order.status = OrderStatus.CANCELLED
        if reason:
            order.notes = f"[Bekor qilish sababi]: {reason}\n\n{order.notes}".strip()
        order.updated_by = user
        order.save(update_fields=["status", "notes", "updated_by", "updated_at"])
    logger.info("Production order %s cancelled by %s", order.order_number, user)
    return order


def calculate_required_input(output_kg: Decimal, waste_pct: Decimal) -> Decimal:
    """Formula: input = output / (1 - waste_pct / 100)"""
    if waste_pct >= 100:
        raise BusinessLogicError("Chiqindi foizi 100% dan kichik bo'lishi kerak.")
    factor = 1 - waste_pct / 100
    return (output_kg / factor).quantize(Decimal("0.001"))


# ─── Production Batch Services ────────────────────────────────────────────────

def update_batch_qc(
    batch: ProductionBatch,
    status: str,
    user,
    qc_notes: str = "",
    strength_cn: Decimal | None = None,
    evenness_cv: Decimal | None = None,
) -> ProductionBatch:
    if status not in (BatchStatus.QC_PASSED, BatchStatus.QC_FAILED):
        raise BusinessLogicError("Noto'g'ri QC holati.")
    if batch.status not in (BatchStatus.QC_PENDING, BatchStatus.IN_PRODUCTION):
        raise BusinessLogicError(
            f"Sifat nazorati faqat 'QC kutilmoqda' yoki 'Jarayonda' partiyalar uchun. Hozir: {batch.get_status_display()}"
        )

    update_fields = ["status", "qc_checked_at", "qc_checked_by", "qc_notes", "updated_by", "updated_at"]
    batch.status = status
    batch.qc_checked_at = timezone.now()
    batch.qc_checked_by = user
    batch.qc_notes = qc_notes
    batch.updated_by = user

    if strength_cn is not None:
        batch.strength_cn = strength_cn
        update_fields.append("strength_cn")
    if evenness_cv is not None:
        batch.evenness_cv = evenness_cv
        update_fields.append("evenness_cv")

    if status == BatchStatus.QC_PASSED:
        batch.status = BatchStatus.IN_STOCK
        update_fields[0] = "status"

    batch.save(update_fields=update_fields)
    return batch


def get_batch_traceability(batch: ProductionBatch) -> dict:
    order = batch.production_order
    return {
        "batch_number": batch.batch_number,
        "order_number": order.order_number,
        "order_type": order.get_order_type_display(),
        "production_line": str(order.production_line),
        "input_product": str(order.input_product),
        "output_product": str(batch.output_product),
        "quantity_kg": batch.quantity_kg,
        "production_date": batch.production_date,
        "shift": batch.get_shift_display(),
        "brigade": batch.brigade,
        "tolling_contract_number": (
            order.tolling_contract.contract_number
            if order.tolling_contract_id
            else None
        ),
        "status": batch.get_status_display(),
    }


# ─── Shift Report Services ────────────────────────────────────────────────────

def submit_shift_report(report: ProductionShiftReport, user) -> ProductionShiftReport:
    if report.status != ReportStatus.DRAFT:
        raise BusinessLogicError(
            f"Faqat 'Qoralama' holatdagi xisobotni topshirish mumkin. Holat: {report.get_status_display()}"
        )
    report.status = ReportStatus.SUBMITTED
    report.submitted_at = timezone.now()
    report.updated_by = user
    report.save(update_fields=["status", "submitted_at", "updated_by", "updated_at"])
    return report


def approve_shift_report(report: ProductionShiftReport, user) -> ProductionShiftReport:
    if report.status != ReportStatus.SUBMITTED:
        raise BusinessLogicError(
            f"Faqat 'Topshirilgan' holatdagi xisobotni tasdiqlash mumkin. Holat: {report.get_status_display()}"
        )
    report.status = ReportStatus.APPROVED
    report.approved_by = user
    report.approved_at = timezone.now()
    report.updated_by = user
    report.save(update_fields=["status", "approved_by", "approved_at", "updated_by", "updated_at"])
    return report


def get_shift_analytics(start_date, end_date) -> list[dict]:
    """Brigade performance comparison for a date range."""
    from django.db.models import Avg, Sum, Count, Q
    from .models import ProductionShiftReport

    reports = ProductionShiftReport.objects.filter(
        shift_date__range=(start_date, end_date),
        status=ReportStatus.APPROVED,
    )

    result = []
    for brigade in range(1, 5):
        brigade_reports = reports.filter(brigade=brigade)
        agg = brigade_reports.aggregate(
            report_count=Count("id"),
            avg_conversion=Avg("conversion_rate"),
            total_output=Sum("total_output_kg"),
            avg_availability=Avg(
                models_ExpressionWrapper(
                    (models_F("planned_runtime_hours") - models_F("downtime_hours"))
                    / models_F("planned_runtime_hours") * 100,
                    output_field=models_DecimalField(max_digits=5, decimal_places=2),
                )
            ),
        )
        result.append({
            "brigade": brigade,
            "label": f"{brigade}-brigada",
            **agg,
        })

    return sorted(result, key=lambda x: -(x["avg_conversion"] or 0))


# ─── Dashboard ────────────────────────────────────────────────────────────────

def get_production_dashboard() -> dict:
    from django.utils import timezone as tz
    from django.db.models import Sum, Count, Avg, Q
    from .models import ProductionOrder, ProductionBatch, ProductionLine, ProductionShiftReport

    today = tz.localdate()
    now = tz.now()

    orders = ProductionOrder.objects.all()

    in_progress = orders.filter(status=OrderStatus.IN_PROGRESS)
    delayed = [o for o in in_progress if o.is_delayed]

    completed_today = orders.filter(
        status=OrderStatus.COMPLETED,
        actual_end_date__date=today,
    ).count()

    output_today = (
        ProductionBatch.objects.all()
        .filter(production_date=today)
        .exclude(status=BatchStatus.QC_FAILED)
        .aggregate(total=Sum("quantity_kg"))["total"] or Decimal("0")
    )

    avg_conv = (
        ProductionShiftReport.objects.filter(
            shift_date=today, status=ReportStatus.APPROVED
        ).aggregate(avg=Avg("conversion_rate"))["avg"] or Decimal("0")
    )

    return {
        "total_orders": orders.filter(status__in=[
            OrderStatus.APPROVED, OrderStatus.IN_PROGRESS
        ]).count(),
        "orders_in_progress": in_progress.count(),
        "orders_delayed": len(delayed),
        "orders_completed_today": completed_today,
        "total_output_today_kg": output_today,
        "avg_conversion_rate": avg_conv,
        "active_lines": ProductionLine.objects.filter(is_active=True).count(),
        "pending_qc_batches": ProductionBatch.objects.all().filter(
            status=BatchStatus.QC_PENDING
        ).count(),
    }


# Lazy imports to avoid circular import issues at module load time
def models_Sum(field):
    from django.db.models import Sum
    return Sum(field)


def models_F(field):
    from django.db.models import F
    return F(field)


def models_ExpressionWrapper(expr, output_field):
    from django.db.models import ExpressionWrapper
    return ExpressionWrapper(expr, output_field=output_field)


def models_DecimalField(**kwargs):
    from django.db.models import DecimalField
    return DecimalField(**kwargs)
