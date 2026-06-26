"""
Equipment & Maintenance Management business logic.

Key invariants:
- Equipment.next_maintenance_due is always recalculated after a maintenance record completes
- OEE = Availability × Performance × Quality (all as fractions)
- Downtime duration_hours is computed when end_time is set
- Spare part stock is decremented atomically in use_spare_part
"""
import logging
from decimal import Decimal
from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone

from core.exceptions import BusinessLogicError
from .models import (
    Equipment, MaintenanceRecord, EquipmentDowntime, SparePart,
    MaintenancePartUsage, OEEMeasurement,
    EquipmentStatus, MaintenanceStatus, DowntimeStatus,
)

logger = logging.getLogger("apps.maintenance")


# ─── Equipment ────────────────────────────────────────────────────────────────

def update_equipment_status(equipment: Equipment, new_status: str, user) -> Equipment:
    with transaction.atomic():
        equipment.status = new_status
        equipment.updated_by = user
        equipment.save(update_fields=["status", "updated_by", "updated_at"])
    logger.info("Equipment %s status → %s", equipment.equipment_code, new_status)
    return equipment


# ─── Maintenance Records ───────────────────────────────────────────────────────

def create_maintenance_record(equipment: Equipment, maintenance_type: str, scheduled_date: date,
                               scheduled_duration_hours: Decimal, assigned_technician,
                               user, **kwargs) -> MaintenanceRecord:
    with transaction.atomic():
        record = MaintenanceRecord.objects.create(
            record_number=MaintenanceRecord.generate_record_number(),
            equipment=equipment,
            maintenance_type=maintenance_type,
            scheduled_date=scheduled_date,
            scheduled_duration_hours=scheduled_duration_hours,
            assigned_technician=assigned_technician,
            created_by=user,
            **kwargs,
        )
        equipment.status = EquipmentStatus.OPERATIONAL
        equipment.save(update_fields=["status", "updated_at"])
    logger.info("Maintenance record %s created for %s", record.record_number, equipment.equipment_code)
    return record


def start_maintenance(record: MaintenanceRecord, user) -> MaintenanceRecord:
    if record.status != MaintenanceStatus.SCHEDULED:
        raise BusinessLogicError(
            f"Faqat 'Rejalashtirilgan' qaydnomani boshlash mumkin. Joriy holat: {record.get_status_display()}"
        )
    with transaction.atomic():
        record.status = MaintenanceStatus.IN_PROGRESS
        record.actual_start = timezone.now()
        record.updated_by = user
        record.save(update_fields=["status", "actual_start", "updated_by", "updated_at"])
        record.equipment.status = EquipmentStatus.MAINTENANCE
        record.equipment.save(update_fields=["status", "updated_at"])
    logger.info("Maintenance %s started", record.record_number)
    return record


def complete_maintenance(record: MaintenanceRecord, work_description: str,
                          equipment_status_after: str, test_run_successful: bool,
                          labor_cost: Decimal, user) -> MaintenanceRecord:
    if record.status != MaintenanceStatus.IN_PROGRESS:
        raise BusinessLogicError("Ta'mirni yakunlash uchun u bajarilmoqda holatida bo'lishi kerak.")
    with transaction.atomic():
        now = timezone.now()
        duration = None
        if record.actual_start:
            delta = now - record.actual_start
            duration = Decimal(str(round(delta.total_seconds() / 3600, 2)))
        record.status = MaintenanceStatus.COMPLETED
        record.actual_end = now
        record.actual_duration_hours = duration
        record.work_description = work_description
        record.equipment_status_after = equipment_status_after
        record.test_run_successful = test_run_successful
        record.labor_cost_uzs = labor_cost
        record.total_cost_uzs = labor_cost + record.parts_cost_uzs
        record.updated_by = user
        record.save(update_fields=[
            "status", "actual_end", "actual_duration_hours", "work_description",
            "equipment_status_after", "test_run_successful", "labor_cost_uzs",
            "total_cost_uzs", "updated_by", "updated_at",
        ])
        equip = record.equipment
        equip.status = equipment_status_after
        equip.last_maintenance_date = now.date()
        equip.next_maintenance_due = now.date() + timedelta(days=equip.maintenance_frequency_days)
        equip.save(update_fields=["status", "last_maintenance_date", "next_maintenance_due", "updated_at"])
    logger.info("Maintenance %s completed", record.record_number)
    return record


def approve_maintenance(record: MaintenanceRecord, user) -> MaintenanceRecord:
    if record.status != MaintenanceStatus.COMPLETED:
        raise BusinessLogicError("Faqat yakunlangan ta'mirni tasdiqlash mumkin.")
    with transaction.atomic():
        record.approved_by = user
        record.approved_at = timezone.now()
        record.updated_by = user
        record.save(update_fields=["approved_by", "approved_at", "updated_by", "updated_at"])
    logger.info("Maintenance %s approved by %s", record.record_number, user)
    return record


# ─── Spare Parts ───────────────────────────────────────────────────────────────

def use_spare_part(record: MaintenanceRecord, part: SparePart, quantity: int,
                   condition: str, user) -> MaintenancePartUsage:
    if part.current_stock < quantity:
        raise BusinessLogicError(
            f"Yetarli ehtiyot qism yo'q. Mavjud: {part.current_stock}, kerak: {quantity}"
        )
    with transaction.atomic():
        total_cost = part.unit_cost_uzs * quantity
        usage = MaintenancePartUsage.objects.create(
            maintenance_record=record,
            spare_part=part,
            quantity_used=quantity,
            unit_cost_uzs=part.unit_cost_uzs,
            total_cost_uzs=total_cost,
            removed_part_condition=condition,
        )
        part.current_stock -= quantity
        part.save(update_fields=["current_stock"])
        record.parts_cost_uzs += total_cost
        record.total_cost_uzs = record.labor_cost_uzs + record.parts_cost_uzs
        record.save(update_fields=["parts_cost_uzs", "total_cost_uzs"])
    logger.info("Part %s used ×%d in %s", part.part_code, quantity, record.record_number)
    return usage


def restock_spare_part(part: SparePart, quantity: int, user) -> SparePart:
    with transaction.atomic():
        part.current_stock += quantity
        part.last_purchase_date = timezone.now().date()
        part.updated_by = user
        part.save(update_fields=["current_stock", "last_purchase_date", "updated_by", "updated_at"])
    logger.info("Part %s restocked +%d → %d", part.part_code, quantity, part.current_stock)
    return part


def get_low_stock_parts():
    return SparePart.objects.filter(
        current_stock__lte=models.F("minimum_stock"), is_active=True
    ).order_by("is_critical", "part_code")


# ─── Downtime ─────────────────────────────────────────────────────────────────

def report_downtime(equipment: Equipment, downtime_type: str, reason: str,
                    reported_by, start_time=None) -> EquipmentDowntime:
    with transaction.atomic():
        downtime = EquipmentDowntime.objects.create(
            downtime_number=EquipmentDowntime.generate_downtime_number(),
            equipment=equipment,
            downtime_type=downtime_type,
            reason=reason,
            start_time=start_time or timezone.now(),
            reported_by=reported_by,
            created_by=reported_by,
        )
        equipment.status = EquipmentStatus.BREAKDOWN
        equipment.save(update_fields=["status", "updated_at"])
    logger.info("Downtime %s reported for %s", downtime.downtime_number, equipment.equipment_code)
    return downtime


def resolve_downtime(downtime: EquipmentDowntime, action_taken: str,
                     production_loss_kg: Decimal, user) -> EquipmentDowntime:
    if downtime.status == DowntimeStatus.RESOLVED:
        raise BusinessLogicError("Bu to'xtash vaqti allaqachon hal qilingan.")
    with transaction.atomic():
        now = timezone.now()
        delta = now - downtime.start_time
        duration = Decimal(str(round(delta.total_seconds() / 3600, 2)))
        downtime.end_time = now
        downtime.duration_hours = duration
        downtime.action_taken = action_taken
        downtime.production_loss_kg = production_loss_kg
        downtime.status = DowntimeStatus.RESOLVED
        downtime.resolved_by = user
        downtime.updated_by = user
        downtime.save(update_fields=[
            "end_time", "duration_hours", "action_taken", "production_loss_kg",
            "status", "resolved_by", "updated_by", "updated_at",
        ])
        downtime.equipment.status = EquipmentStatus.OPERATIONAL
        downtime.equipment.save(update_fields=["status", "updated_at"])
    logger.info("Downtime %s resolved by %s, duration %.2fh", downtime.downtime_number, user, duration)
    return downtime


# ─── OEE ──────────────────────────────────────────────────────────────────────

def calculate_oee_for_shift(equipment: Equipment, shift_report, user=None) -> OEEMeasurement:
    """Calculate OEE from a ProductionShiftReport."""
    planned_hours = Decimal(str(shift_report.planned_runtime_hours))
    downtime_h = Decimal(str(shift_report.downtime_hours))
    actual_hours = Decimal(str(shift_report.actual_runtime_hours))
    actual_output = Decimal(str(shift_report.total_output_kg))

    # 1. Availability
    if planned_hours > 0:
        availability = ((planned_hours - downtime_h) / planned_hours * 100).quantize(Decimal("0.01"))
    else:
        availability = Decimal("0")

    # 2. Performance
    target_kg = equipment.rated_capacity * actual_hours
    if target_kg > 0:
        performance = (actual_output / target_kg * 100).quantize(Decimal("0.01"))
        performance = min(performance, Decimal("100"))
    else:
        performance = Decimal("0")

    # 3. Quality (use shift defect data as proxy; default 99% if no data)
    defect_kg = Decimal(str(shift_report.defect_count)) * Decimal("0.5")  # rough proxy
    if actual_output > 0 and actual_output > defect_kg:
        quality = ((actual_output - defect_kg) / actual_output * 100).quantize(Decimal("0.01"))
    else:
        quality = Decimal("99.00")

    # OEE
    oee = (availability / 100 * performance / 100 * quality / 100 * 100).quantize(Decimal("0.01"))

    # Upsert
    existing = OEEMeasurement.objects.filter(
        equipment=equipment,
        measurement_date=shift_report.shift_date,
        shift=shift_report.shift,
    ).first()

    data = dict(
        planned_production_time_hours=planned_hours,
        downtime_hours=downtime_h,
        availability_percentage=availability,
        target_production_kg=target_kg,
        actual_production_kg=actual_output,
        performance_percentage=performance,
        total_production_kg=actual_output,
        defect_production_kg=defect_kg,
        quality_percentage=quality,
        oee_percentage=oee,
        shift_report=shift_report,
    )

    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        existing.save()
        return existing

    return OEEMeasurement.objects.create(
        equipment=equipment,
        measurement_date=shift_report.shift_date,
        shift=shift_report.shift,
        **data,
    )


# ─── Analytics ────────────────────────────────────────────────────────────────

def get_oee_dashboard():
    from django.db.models import Avg, Count
    equipment_qs = Equipment.objects.filter(is_active=True)
    result = []
    for equip in equipment_qs:
        latest = equip.oee_measurements.order_by("-measurement_date").first()
        avg_oee = equip.oee_measurements.aggregate(avg=Avg("oee_percentage"))["avg"]
        result.append({
            "equipment_id": str(equip.id),
            "equipment_code": equip.equipment_code,
            "equipment_name": equip.equipment_name,
            "status": equip.status,
            "status_display": equip.get_status_display(),
            "latest_oee": float(latest.oee_percentage) if latest else None,
            "avg_oee_30d": round(float(avg_oee), 2) if avg_oee else None,
        })
    return result


def get_downtime_analytics(start_date=None, end_date=None) -> dict:
    from django.db.models import Sum, Count, Avg
    qs = EquipmentDowntime.objects.all()
    if start_date:
        qs = qs.filter(start_time__date__gte=start_date)
    if end_date:
        qs = qs.filter(start_time__date__lte=end_date)

    total = qs.count()
    resolved = qs.filter(status=DowntimeStatus.RESOLVED).count()
    total_hours = qs.filter(duration_hours__isnull=False).aggregate(s=Sum("duration_hours"))["s"] or 0
    total_loss_kg = qs.aggregate(s=Sum("production_loss_kg"))["s"] or 0

    by_type = list(
        qs.values("downtime_type")
        .annotate(count=Count("id"), total_hours=Sum("duration_hours"))
        .order_by("-count")
    )
    mttr = qs.filter(
        status=DowntimeStatus.RESOLVED, duration_hours__isnull=False
    ).aggregate(avg=Avg("duration_hours"))["avg"]

    return {
        "total_events": total,
        "resolved_events": resolved,
        "total_downtime_hours": float(total_hours),
        "total_production_loss_kg": float(total_loss_kg),
        "mttr_hours": round(float(mttr), 2) if mttr else None,
        "by_type": by_type,
    }


def get_maintenance_cost_summary(start_date=None, end_date=None) -> dict:
    from django.db.models import Sum, Count
    qs = MaintenanceRecord.objects.filter(status=MaintenanceStatus.COMPLETED)
    if start_date:
        qs = qs.filter(scheduled_date__gte=start_date)
    if end_date:
        qs = qs.filter(scheduled_date__lte=end_date)
    agg = qs.aggregate(
        total_cost=Sum("total_cost_uzs"),
        total_labor=Sum("labor_cost_uzs"),
        total_parts=Sum("parts_cost_uzs"),
        record_count=Count("id"),
    )
    return {k: float(v) if v else 0 for k, v in agg.items()}
