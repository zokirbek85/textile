from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from core.models import AuditedModel


class EquipmentType(models.TextChoices):
    SPINNING_FRAME = "spinning_frame", "Ip yigirish mashinasi"
    BLOWROOM = "blowroom", "Ochish mashinasi"
    CARDING = "carding", "Taroq mashina"
    DRAWING = "drawing", "Cho'zish mashina"
    ROVING = "roving", "Roving mashina"
    WINDING = "winding", "O'rash mashina"
    GINNING = "ginning", "Paxta tozalash"
    UTILITY = "utility", "Yordamchi (kompresor, generator)"


class EquipmentStatus(models.TextChoices):
    OPERATIONAL = "operational", "Ishlamoqda"
    MAINTENANCE = "maintenance", "Ta'mirda"
    BREAKDOWN = "breakdown", "Buzilgan"
    IDLE = "idle", "Bo'sh turgan"
    DECOMMISSIONED = "decommissioned", "Foydalanishdan chiqarilgan"


class MaintenanceType(models.TextChoices):
    ROUTINE = "routine", "Muntazam tekshiruv"
    PREVENTIVE = "preventive", "Profilaktika"
    OVERHAUL = "overhaul", "Kapital ta'mir"
    CALIBRATION = "calibration", "Kalibrovka"


class MaintenanceStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Rejalashtirilgan"
    IN_PROGRESS = "in_progress", "Bajarilmoqda"
    COMPLETED = "completed", "Yakunlandi"
    CANCELLED = "cancelled", "Bekor qilindi"


class DowntimeType(models.TextChoices):
    PLANNED_MAINTENANCE = "planned_maintenance", "Rejalashtirilgan ta'mir"
    UNPLANNED_BREAKDOWN = "unplanned_breakdown", "Kutilmagan buzilish"
    CHANGEOVER = "changeover", "Qayta sozlash"
    RAW_MATERIAL_SHORTAGE = "raw_material_shortage", "Xom ashyo yetishmasligi"
    POWER_OUTAGE = "power_outage", "Elektr uzilishi"
    OPERATOR_BREAK = "operator_break", "Operator tanaffusi"
    OTHER = "other", "Boshqa"


class DowntimeStatus(models.TextChoices):
    ONGOING = "ongoing", "Davom etmoqda"
    RESOLVED = "resolved", "Hal qilindi"


class PartCondition(models.TextChoices):
    WORN = "worn", "Eskirgan"
    BROKEN = "broken", "Singan"
    CORRODED = "corroded", "Korroziyaga uchragan"
    PREVENTIVE = "preventive", "Profilaktik almashtirish"


# ─── Equipment ────────────────────────────────────────────────────────────────

class Equipment(AuditedModel):
    """Uskunalar — equipment/machinery."""

    equipment_code = models.CharField(max_length=50, unique=True)
    equipment_name = models.CharField(max_length=200)

    equipment_type = models.CharField(max_length=30, choices=EquipmentType.choices)
    production_line = models.ForeignKey(
        "production.ProductionLine",
        on_delete=models.CASCADE,
        related_name="equipment",
    )

    manufacturer = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, blank=True)
    year_manufactured = models.IntegerField(null=True, blank=True)

    rated_capacity = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    capacity_unit = models.CharField(max_length=20, default="kg/hour")
    spindles_count = models.IntegerField(null=True, blank=True)

    installation_date = models.DateField(null=True, blank=True)
    warranty_expires = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)

    maintenance_frequency_days = models.IntegerField(default=30)
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_due = models.DateField(null=True, blank=True)

    total_operating_hours = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )

    status = models.CharField(
        max_length=20, choices=EquipmentStatus.choices, default=EquipmentStatus.OPERATIONAL
    )

    photo = models.ImageField(upload_to="equipment/photos/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "maintenance_equipment"
        ordering = ["equipment_code"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["next_maintenance_due"]),
        ]
        verbose_name = "Uskuna"
        verbose_name_plural = "Uskunalar"

    def __str__(self):
        return f"{self.equipment_code} | {self.equipment_name}"

    @property
    def is_overdue_for_maintenance(self) -> bool:
        from django.utils import timezone
        if not self.next_maintenance_due:
            return False
        return self.next_maintenance_due < timezone.now().date()


# ─── Spare Parts ───────────────────────────────────────────────────────────────

class SparePart(AuditedModel):
    """Ehtiyot qismlar — spare parts inventory."""

    part_code = models.CharField(max_length=50, unique=True)
    part_name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)

    compatible_equipment = models.ManyToManyField(
        Equipment, related_name="compatible_parts", blank=True
    )
    manufacturer_part_number = models.CharField(max_length=100, blank=True)

    supplier_name = models.CharField(max_length=200, blank=True)
    lead_time_days = models.IntegerField(default=7)

    current_stock = models.IntegerField(default=0)
    unit_of_measure = models.CharField(max_length=20, default="pcs")
    minimum_stock = models.IntegerField(default=1)
    maximum_stock = models.IntegerField(default=10)

    unit_cost_uzs = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    last_purchase_date = models.DateField(null=True, blank=True)

    storage_location = models.CharField(max_length=200, blank=True)

    is_critical = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "maintenance_spare_parts"
        ordering = ["category", "part_code"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["is_critical"]),
        ]
        verbose_name = "Ehtiyot qism"
        verbose_name_plural = "Ehtiyot qismlar"

    def __str__(self):
        return f"{self.part_code} | {self.part_name}"

    @property
    def needs_reorder(self) -> bool:
        return self.current_stock <= self.minimum_stock


# ─── Maintenance Schedule ──────────────────────────────────────────────────────

class MaintenanceSchedule(AuditedModel):
    """Ta'mir-texnik xizmat ko'rsatish jadvali."""

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="schedules"
    )
    maintenance_type = models.CharField(max_length=20, choices=MaintenanceType.choices)

    frequency_days = models.IntegerField()
    estimated_duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    maintenance_checklist = models.TextField(blank=True)

    required_technicians = models.IntegerField(default=1)
    required_spare_parts = models.ManyToManyField(SparePart, blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "maintenance_schedules"
        ordering = ["equipment", "maintenance_type"]
        verbose_name = "Ta'mir jadvali"
        verbose_name_plural = "Ta'mir jadvallari"

    def __str__(self):
        return f"{self.equipment.equipment_code} | {self.get_maintenance_type_display()} every {self.frequency_days}d"


# ─── Maintenance Records ───────────────────────────────────────────────────────

class MaintenanceRecord(AuditedModel):
    """Ta'mir-texnik xizmat ko'rsatish qaydnomasi."""

    record_number = models.CharField(max_length=50, unique=True, db_index=True)
    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="maintenance_records"
    )
    maintenance_type = models.CharField(max_length=20, choices=MaintenanceType.choices)

    scheduled_date = models.DateField()
    scheduled_duration_hours = models.DecimalField(max_digits=5, decimal_places=2)

    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    actual_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    assigned_technician = models.ForeignKey(
        "users.User",
        related_name="maintenance_assigned",
        on_delete=models.PROTECT,
    )
    work_description = models.TextField(blank=True)
    checklist_completed = models.TextField(blank=True)
    findings = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)

    labor_cost_uzs = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    parts_cost_uzs = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total_cost_uzs = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    status = models.CharField(
        max_length=20, choices=MaintenanceStatus.choices, default=MaintenanceStatus.SCHEDULED
    )

    approved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        related_name="maintenance_approved",
        on_delete=models.SET_NULL,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    equipment_status_after = models.CharField(
        max_length=20, choices=EquipmentStatus.choices, blank=True
    )
    test_run_successful = models.BooleanField(null=True, blank=True)

    class Meta:
        db_table = "maintenance_records"
        ordering = ["-scheduled_date"]
        indexes = [
            models.Index(fields=["record_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["scheduled_date"]),
        ]
        verbose_name = "Ta'mir qaydnomasi"
        verbose_name_plural = "Ta'mir qaydnomalari"

    def __str__(self):
        return f"{self.record_number} | {self.equipment.equipment_code} | {self.get_status_display()}"

    @classmethod
    def generate_record_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"MAINT-{year}"
        last = (
            cls.all_objects.filter(record_number__startswith=prefix)
            .order_by("-record_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.record_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"


class MaintenancePartUsage(models.Model):
    """Spare parts used in a maintenance record."""

    import uuid as _uuid
    id = models.UUIDField(primary_key=True, default=__import__("uuid").uuid4, editable=False)
    maintenance_record = models.ForeignKey(
        MaintenanceRecord, on_delete=models.CASCADE, related_name="part_usages"
    )
    spare_part = models.ForeignKey(SparePart, on_delete=models.PROTECT)

    quantity_used = models.IntegerField(validators=[MinValueValidator(1)])
    unit_cost_uzs = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost_uzs = models.DecimalField(max_digits=12, decimal_places=2)

    removed_part_condition = models.CharField(max_length=20, choices=PartCondition.choices)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "maintenance_part_usage"
        verbose_name = "Ehtiyot qism sarflanishi"

    def __str__(self):
        return f"{self.maintenance_record.record_number} | {self.spare_part.part_code} × {self.quantity_used}"


# ─── Downtime ─────────────────────────────────────────────────────────────────

class EquipmentDowntime(AuditedModel):
    """Uskunaning to'xtash vaqti — downtime tracking."""

    downtime_number = models.CharField(max_length=50, unique=True, db_index=True)

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="downtimes"
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )

    downtime_type = models.CharField(max_length=30, choices=DowntimeType.choices)
    reason = models.TextField()
    problem_description = models.TextField(blank=True)

    production_loss_kg = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal("0")
    )
    financial_loss_uzs = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal("0")
    )

    action_taken = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        related_name="downtimes_resolved",
        on_delete=models.SET_NULL,
    )

    maintenance_record = models.ForeignKey(
        MaintenanceRecord, null=True, blank=True, on_delete=models.SET_NULL
    )
    shift_report = models.ForeignKey(
        "production.ProductionShiftReport", null=True, blank=True, on_delete=models.SET_NULL
    )

    status = models.CharField(
        max_length=20, choices=DowntimeStatus.choices, default=DowntimeStatus.ONGOING
    )
    reported_by = models.ForeignKey(
        "users.User",
        related_name="downtimes_reported",
        on_delete=models.PROTECT,
    )

    class Meta:
        db_table = "maintenance_downtime"
        ordering = ["-start_time"]
        indexes = [
            models.Index(fields=["downtime_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["start_time"]),
        ]
        verbose_name = "To'xtash vaqti"
        verbose_name_plural = "To'xtash vaqtlari"

    def __str__(self):
        return f"{self.downtime_number} | {self.equipment.equipment_code} | {self.get_status_display()}"

    @classmethod
    def generate_downtime_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"DT-{year}"
        last = (
            cls.all_objects.filter(downtime_number__startswith=prefix)
            .order_by("-downtime_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.downtime_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"


# ─── OEE ──────────────────────────────────────────────────────────────────────

class OEEMeasurement(models.Model):
    """OEE (Overall Equipment Effectiveness) measurement."""

    id = models.UUIDField(primary_key=True, default=__import__("uuid").uuid4, editable=False)
    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="oee_measurements"
    )
    measurement_date = models.DateField(db_index=True)
    shift = models.CharField(max_length=20)

    planned_production_time_hours = models.DecimalField(max_digits=5, decimal_places=2)
    downtime_hours = models.DecimalField(max_digits=5, decimal_places=2)
    availability_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    target_production_kg = models.DecimalField(max_digits=12, decimal_places=3)
    actual_production_kg = models.DecimalField(max_digits=12, decimal_places=3)
    performance_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    total_production_kg = models.DecimalField(max_digits=12, decimal_places=3)
    defect_production_kg = models.DecimalField(max_digits=12, decimal_places=3)
    quality_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    oee_percentage = models.DecimalField(max_digits=5, decimal_places=2)

    shift_report = models.OneToOneField(
        "production.ProductionShiftReport",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="oee_measurement",
    )

    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "maintenance_oee"
        unique_together = [("equipment", "measurement_date", "shift")]
        ordering = ["-measurement_date", "shift"]
        verbose_name = "OEE o'lchovi"
        verbose_name_plural = "OEE o'lchovlari"

    def __str__(self):
        return f"{self.equipment.equipment_code} | {self.measurement_date} {self.shift} | OEE:{self.oee_percentage}%"
