from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import AuditedModel


class LineType(models.TextChoices):
    GINNING = "ginning", "Paxta Tozalash / Cotton Ginning"
    SPINNING = "spinning", "Ip Yigiruv / Yarn Spinning"
    BLENDING = "blending", "Aralashtirish / Blending"


class FactoryType(models.TextChoices):
    PAXTA_ZAVODI = "paxta_zavodi", "Paxta Tozalash Zavodi"
    IP_ZAVODI = "ip_zavodi", "Ip Yigiruv Zavodi"


class OrderType(models.TextChoices):
    DIRECT = "direct", "To'g'ridan sotish / Direct Sale"
    TOLLING = "tolling", "Davalliq / Tolling"
    STATE = "state", "Davlat buyurtmasi / State Order"


class OrderStatus(models.TextChoices):
    DRAFT = "draft", "Qoralama / Draft"
    APPROVED = "approved", "Tasdiqlangan / Approved"
    IN_PROGRESS = "in_progress", "Jarayonda / In Progress"
    COMPLETED = "completed", "Yakunlangan / Completed"
    CANCELLED = "cancelled", "Bekor qilingan / Cancelled"


class ShiftChoice(models.TextChoices):
    SHIFT_1 = "shift_1", "1-smena (08:00-20:00)"
    SHIFT_2 = "shift_2", "2-smena (20:00-08:00)"
    SHIFT_3 = "shift_3", "3-smena"
    SHIFT_4 = "shift_4", "4-smena"


class BatchStatus(models.TextChoices):
    IN_PRODUCTION = "in_production", "Ishlab chiqarilmoqda"
    QC_PENDING = "qc_pending", "Sifat nazorati kutilmoqda"
    QC_PASSED = "qc_passed", "Sifat nazoratidan o'tdi"
    QC_FAILED = "qc_failed", "Sifat nazorati rad etdi"
    IN_STOCK = "in_stock", "Omborxonada"
    SHIPPED = "shipped", "Jo'natildi"


class ReportStatus(models.TextChoices):
    DRAFT = "draft", "Qoralama"
    SUBMITTED = "submitted", "Topshirilgan"
    APPROVED = "approved", "Tasdiqlangan"


class ProductionLine(AuditedModel):
    """Ishlab chiqarish liniyasi — production line (e.g. Rieter spinning line #1)."""

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    line_type = models.CharField(max_length=20, choices=LineType.choices)
    factory = models.CharField(max_length=20, choices=FactoryType.choices)
    equipment_model = models.CharField(max_length=200, blank=True, help_text="e.g. Rieter R60")
    capacity_per_hour = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="kg/hour",
    )
    is_active = models.BooleanField(default=True)
    installation_date = models.DateField(null=True, blank=True)
    maintenance_schedule = models.CharField(
        max_length=50, blank=True, help_text="weekly / monthly"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_lines"
        ordering = ["factory", "name"]
        verbose_name = "Ishlab chiqarish liniyasi"
        verbose_name_plural = "Ishlab chiqarish liniyalari"

    def __str__(self):
        return f"{self.name} ({self.get_factory_display()})"


class ProductionOrder(AuditedModel):
    """Ishlab chiqarish buyurtmasi — production order."""

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    order_type = models.CharField(max_length=20, choices=OrderType.choices)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.DRAFT
    )

    # Optional source references
    tolling_contract = models.ForeignKey(
        "tolling.TollingContract",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="production_orders",
    )
    # Links to existing batch systems
    cotton_batch = models.ForeignKey(
        "cotton_production.CottonBatch",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="production_orders",
    )
    yarn_batch = models.ForeignKey(
        "yarn_production.YarnBatch",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="production_orders",
    )

    # Product specs
    input_product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="production_orders_input",
    )
    output_product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="production_orders_output",
    )

    # Quantities (kg)
    input_quantity_kg = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))]
    )
    planned_output_kg = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))]
    )
    actual_output_kg = models.DecimalField(
        max_digits=12, decimal_places=3, default=Decimal("0")
    )
    waste_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("8.00"),
        validators=[MinValueValidator(0), MaxValueValidator(50)],
    )

    # Yarn specs
    yarn_count = models.CharField(max_length=20, blank=True, help_text="e.g. Ne 30/1")
    twist_per_meter = models.IntegerField(null=True, blank=True)

    # Scheduling
    production_line = models.ForeignKey(
        ProductionLine, on_delete=models.PROTECT, related_name="orders"
    )
    planned_start_date = models.DateTimeField()
    planned_end_date = models.DateTimeField()
    actual_start_date = models.DateTimeField(null=True, blank=True)
    actual_end_date = models.DateTimeField(null=True, blank=True)

    # Assignment
    shift = models.CharField(max_length=20, choices=ShiftChoice.choices)
    brigade = models.IntegerField(choices=[(1, "1-brigada"), (2, "2-brigada"), (3, "3-brigada"), (4, "4-brigada")])
    supervisor = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="supervised_production_orders",
    )

    # Approval
    approved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_production_orders",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_orders"
        ordering = ["-planned_start_date"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["order_type"]),
            models.Index(fields=["planned_start_date"]),
        ]
        verbose_name = "Ishlab chiqarish buyurtmasi"
        verbose_name_plural = "Ishlab chiqarish buyurtmalari"

    def __str__(self):
        return f"{self.order_number} | {self.get_status_display()}"

    @property
    def completion_rate(self) -> Decimal:
        if not self.planned_output_kg:
            return Decimal("0")
        return (self.actual_output_kg / self.planned_output_kg * 100).quantize(Decimal("0.01"))

    @property
    def is_delayed(self) -> bool:
        from django.utils import timezone
        if self.status in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
            return False
        return timezone.now() > self.planned_end_date

    @classmethod
    def generate_order_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        last = (
            cls.all_objects.filter(order_number__startswith=f"PO-{year}-")
            .order_by("-order_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.order_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"PO-{year}-{seq:04d}"


class ProductionBatch(AuditedModel):
    """Ishlab chiqarish partiyasi — production lot with full traceability."""

    batch_number = models.CharField(max_length=50, unique=True, db_index=True)
    production_order = models.ForeignKey(
        ProductionOrder, on_delete=models.CASCADE, related_name="batches"
    )
    status = models.CharField(
        max_length=20, choices=BatchStatus.choices, default=BatchStatus.IN_PRODUCTION
    )

    # Output tracking
    output_product = models.ForeignKey(
        "warehouse.Product", on_delete=models.PROTECT, related_name="production_batches"
    )
    quantity_kg = models.DecimalField(
        max_digits=12, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))]
    )

    # Actual quality parameters
    yarn_count_actual = models.CharField(max_length=20, blank=True)
    twist_actual = models.IntegerField(null=True, blank=True)
    strength_cn = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Strength in centiNewtons",
    )
    evenness_cv = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Evenness CV%",
    )

    # Production details
    production_date = models.DateField()
    shift = models.CharField(max_length=20, choices=ShiftChoice.choices)
    brigade = models.IntegerField(
        choices=[(1, "1-brigada"), (2, "2-brigada"), (3, "3-brigada"), (4, "4-brigada")]
    )
    machine_number = models.CharField(max_length=50, blank=True)

    # Storage
    warehouse_location = models.CharField(max_length=100, blank=True)
    pallet_number = models.CharField(max_length=50, blank=True)

    # QC timestamps
    qc_checked_at = models.DateTimeField(null=True, blank=True)
    qc_checked_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="qc_checked_batches",
    )
    qc_notes = models.TextField(blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_batches"
        ordering = ["-production_date", "-created_at"]
        indexes = [
            models.Index(fields=["batch_number"]),
            models.Index(fields=["production_date", "shift"]),
            models.Index(fields=["status"]),
        ]
        verbose_name = "Ishlab chiqarish partiyasi"
        verbose_name_plural = "Ishlab chiqarish partiyalari"

    def __str__(self):
        return f"Batch {self.batch_number} | {self.quantity_kg} kg | {self.get_status_display()}"

    @classmethod
    def generate_batch_number(cls, production_order: "ProductionOrder") -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"BATCH-{year}"
        last = (
            cls.all_objects.filter(batch_number__startswith=prefix)
            .order_by("-batch_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.batch_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"


class ProductionShiftReport(AuditedModel):
    """Smenali ishlab chiqarish xisoboti — shift production report."""

    report_number = models.CharField(max_length=50, unique=True, db_index=True)
    production_line = models.ForeignKey(
        ProductionLine, on_delete=models.PROTECT, related_name="shift_reports"
    )
    shift_date = models.DateField(db_index=True)
    shift = models.CharField(max_length=20, choices=ShiftChoice.choices)
    brigade = models.IntegerField(
        choices=[(1, "1-brigada"), (2, "2-brigada"), (3, "3-brigada"), (4, "4-brigada")]
    )

    # Personnel
    supervisor = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="shift_reports_supervised",
    )
    workers_count = models.PositiveIntegerField(default=1)

    # Production summary (kg)
    total_input_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    total_output_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    waste_kg = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal("0"))
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))

    # Equipment status
    planned_runtime_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("12")
    )
    actual_runtime_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0")
    )
    downtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    downtime_reason = models.TextField(blank=True)

    # Energy consumption
    electricity_kwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gas_m3 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    water_m3 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Quality
    defect_count = models.PositiveIntegerField(default=0)
    defect_description = models.TextField(blank=True)

    # Status
    status = models.CharField(
        max_length=20, choices=ReportStatus.choices, default=ReportStatus.DRAFT
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="shift_reports_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_shift_reports"
        ordering = ["-shift_date", "shift"]
        unique_together = [("production_line", "shift_date", "shift", "brigade")]
        indexes = [
            models.Index(fields=["shift_date"]),
            models.Index(fields=["status"]),
        ]
        verbose_name = "Smena xisoboti"
        verbose_name_plural = "Smena xisobotlari"

    def __str__(self):
        return f"{self.report_number} | {self.shift_date} {self.get_shift_display()}"

    @property
    def oee_availability(self) -> Decimal:
        if not self.planned_runtime_hours:
            return Decimal("0")
        productive = self.planned_runtime_hours - self.downtime_hours
        return (productive / self.planned_runtime_hours * 100).quantize(Decimal("0.01"))

    @property
    def oee_performance(self) -> Decimal:
        """Actual output vs target output based on line capacity."""
        target = self.production_line.capacity_per_hour * self.actual_runtime_hours
        if not target:
            return Decimal("0")
        return (self.total_output_kg / target * 100).quantize(Decimal("0.01"))

    @classmethod
    def generate_report_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"SR-{year}"
        last = (
            cls.all_objects.filter(report_number__startswith=prefix)
            .order_by("-report_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.report_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"
