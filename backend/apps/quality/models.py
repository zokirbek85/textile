from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import AuditedModel


class AppliesTo(models.TextChoices):
    RAW_COTTON = "raw_cotton", "Xom paxta / Raw Cotton"
    COTTON_FIBER = "cotton_fiber", "Paxta tolasi / Cotton Fiber"
    YARN = "yarn", "Ip / Yarn"
    SLIVER = "sliver", "Lenta / Sliver"


class DataType(models.TextChoices):
    NUMERIC = "numeric", "Raqamli"
    GRADE = "grade", "Sinf (A/B/C)"
    PASS_FAIL = "pass_fail", "O'tdi/O'tmadi"


class TestType(models.TextChoices):
    INCOMING_RAW = "incoming_raw", "Qabul qilinadigan xom ashyo"
    IN_PROCESS = "in_process", "Jarayon ichida"
    FINAL_PRODUCT = "final_product", "Tayyor mahsulot"
    PERIODIC = "periodic", "Davriy tekshiruv"


class TestResult(models.TextChoices):
    PENDING = "pending", "Kutilmoqda"
    PASSED = "passed", "O'tdi"
    FAILED = "failed", "O'tmadi"
    CONDITIONAL = "conditional", "Shartli"
    RETEST = "retest", "Qayta tekshirish kerak"


class DefectSeverity(models.TextChoices):
    CRITICAL = "critical", "Kritik"
    MAJOR = "major", "Asosiy"
    MINOR = "minor", "Kichik"


class DetectionStage(models.TextChoices):
    PRODUCTION = "production", "Ishlab chiqarishda"
    QC_INSPECTION = "qc_inspection", "Sifat nazoratida"
    PACKAGING = "packaging", "Qadoqlashda"
    CUSTOMER = "customer", "Mijoz tomonidan"


class DefectDisposition(models.TextChoices):
    USE_AS_IS = "use_as_is", "Shundayligicha ishlatish"
    REPROCESS = "reprocess", "Qayta ishlash"
    DOWNGRADE = "downgrade", "Sinfni tushirish"
    SCRAP = "scrap", "Chiqindiga chiqarish"


class DefectStatus(models.TextChoices):
    OPEN = "open", "Ochiq"
    INVESTIGATING = "investigating", "Tekshirilmoqda"
    RESOLVED = "resolved", "Hal qilindi"
    CLOSED = "closed", "Yopildi"


class QualityParameter(AuditedModel):
    """Sifat parametri — quality parameter definition."""

    parameter_code = models.CharField(max_length=50, unique=True)
    parameter_name_uz = models.CharField(max_length=200)
    parameter_name_en = models.CharField(max_length=200)

    applies_to = models.CharField(max_length=20, choices=AppliesTo.choices)
    unit = models.CharField(max_length=30)
    data_type = models.CharField(max_length=20, choices=DataType.choices)

    ozd_standard = models.CharField(max_length=100, blank=True)
    min_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    optimal_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    testing_method = models.TextField(blank=True)
    equipment_required = models.CharField(max_length=200, blank=True)

    is_critical = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "quality_parameters"
        ordering = ["applies_to", "parameter_code"]
        verbose_name = "Sifat parametri"
        verbose_name_plural = "Sifat parametrlari"

    def __str__(self):
        return f"{self.parameter_code} | {self.parameter_name_uz}"


class QualityTest(AuditedModel):
    """Sifat sinovi — quality test record."""

    test_number = models.CharField(max_length=50, unique=True, db_index=True)

    test_type = models.CharField(max_length=20, choices=TestType.choices)

    production_batch = models.ForeignKey(
        "production.ProductionBatch",
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name="quality_tests",
    )
    product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="quality_tests",
    )

    sample_size_kg = models.DecimalField(
        max_digits=10, decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
    )
    sample_location = models.CharField(max_length=200, blank=True)
    sample_taken_date = models.DateTimeField()
    sample_taken_by = models.ForeignKey(
        "users.User",
        related_name="samples_taken",
        on_delete=models.PROTECT,
    )

    test_date = models.DateTimeField()
    tested_by = models.ForeignKey(
        "users.User",
        related_name="tests_performed",
        on_delete=models.PROTECT,
    )
    lab_equipment = models.CharField(max_length=200, blank=True)

    overall_result = models.CharField(
        max_length=20, choices=TestResult.choices, default=TestResult.PENDING
    )
    quality_grade = models.CharField(max_length=10, blank=True)

    approved_for_use = models.BooleanField(default=False)
    rejected = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True)

    notes = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        related_name="tests_reviewed",
        on_delete=models.SET_NULL,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "quality_tests"
        ordering = ["-test_date"]
        indexes = [
            models.Index(fields=["test_number"]),
            models.Index(fields=["test_date", "overall_result"]),
        ]
        verbose_name = "Sifat sinovi"
        verbose_name_plural = "Sifat sinovlari"

    def __str__(self):
        return f"{self.test_number} | {self.get_overall_result_display()}"

    @classmethod
    def generate_test_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"QC-{year}"
        last = (
            cls.all_objects.filter(test_number__startswith=prefix)
            .order_by("-test_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.test_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"


class QualityTestResult(models.Model):
    """Individual parameter result within a quality test."""

    id = models.UUIDField(primary_key=True, default=__import__("uuid").uuid4, editable=False)
    quality_test = models.ForeignKey(
        QualityTest, related_name="test_results", on_delete=models.CASCADE
    )
    parameter = models.ForeignKey(QualityParameter, on_delete=models.PROTECT)

    measured_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    measured_grade = models.CharField(max_length=10, blank=True)

    is_within_spec = models.BooleanField(default=True)
    deviation_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    instrument_id = models.CharField(max_length=50, blank=True)
    calibration_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "quality_test_results"
        unique_together = [("quality_test", "parameter")]
        verbose_name = "Sinov natijasi"
        verbose_name_plural = "Sinov natijalari"

    def __str__(self):
        return f"{self.quality_test.test_number} | {self.parameter.parameter_code}"


class QualityCertificate(AuditedModel):
    """Sifat sertifikati — quality certificate."""

    certificate_number = models.CharField(max_length=50, unique=True, db_index=True)

    production_batch = models.OneToOneField(
        "production.ProductionBatch",
        on_delete=models.PROTECT,
        related_name="quality_certificate",
    )
    product = models.ForeignKey(
        "warehouse.Product",
        on_delete=models.PROTECT,
        related_name="quality_certificates",
    )
    quantity_kg = models.DecimalField(
        max_digits=12, decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
    )

    quality_grade = models.CharField(max_length=10)
    quality_test = models.ForeignKey(
        QualityTest, on_delete=models.PROTECT, related_name="certificates"
    )
    complies_with = models.CharField(max_length=200, blank=True)

    issue_date = models.DateField()
    valid_until = models.DateField()

    issued_by = models.ForeignKey(
        "users.User",
        related_name="certificates_issued",
        on_delete=models.PROTECT,
    )
    approved_by = models.ForeignKey(
        "users.User",
        related_name="certificates_approved",
        on_delete=models.PROTECT,
    )

    is_active = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        db_table = "quality_certificates"
        ordering = ["-issue_date"]
        indexes = [
            models.Index(fields=["certificate_number"]),
            models.Index(fields=["issue_date", "is_active"]),
        ]
        verbose_name = "Sifat sertifikati"
        verbose_name_plural = "Sifat sertifikatlari"

    def __str__(self):
        return f"{self.certificate_number} | {self.quality_grade}"

    @classmethod
    def generate_certificate_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"CERT-{year}"
        last = (
            cls.all_objects.filter(certificate_number__startswith=prefix)
            .order_by("-certificate_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.certificate_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"


class DefectType(AuditedModel):
    """Nuqs turi — defect type definition."""

    defect_code = models.CharField(max_length=50, unique=True)
    defect_name_uz = models.CharField(max_length=200)
    defect_name_en = models.CharField(max_length=200)

    severity = models.CharField(max_length=20, choices=DefectSeverity.choices)
    applies_to = models.CharField(max_length=20, choices=AppliesTo.choices)

    auto_reject = models.BooleanField(default=False)
    requires_reprocessing = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "quality_defect_types"
        ordering = ["severity", "defect_code"]
        verbose_name = "Nuqs turi"
        verbose_name_plural = "Nuqs turlari"

    def __str__(self):
        return f"{self.defect_code} | {self.defect_name_uz} ({self.get_severity_display()})"


class QualityDefect(AuditedModel):
    """Nuqs qayd etish — defect record."""

    defect_number = models.CharField(max_length=50, unique=True, db_index=True)

    production_batch = models.ForeignKey(
        "production.ProductionBatch",
        on_delete=models.CASCADE,
        related_name="quality_defects",
    )
    detection_stage = models.CharField(max_length=20, choices=DetectionStage.choices)

    defect_type = models.ForeignKey(DefectType, on_delete=models.PROTECT)
    quantity_affected_kg = models.DecimalField(
        max_digits=10, decimal_places=3,
        validators=[MinValueValidator(Decimal("0.001"))],
    )
    percentage_of_batch = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    detected_date = models.DateTimeField()
    detected_by = models.ForeignKey(
        "users.User",
        related_name="defects_detected",
        on_delete=models.PROTECT,
    )
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to="quality/defects/", null=True, blank=True)

    root_cause = models.TextField(blank=True)
    corrective_action = models.TextField(blank=True)
    preventive_action = models.TextField(blank=True)

    disposition = models.CharField(
        max_length=20, choices=DefectDisposition.choices, blank=True
    )
    status = models.CharField(
        max_length=20, choices=DefectStatus.choices, default=DefectStatus.OPEN
    )

    resolved_date = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        "users.User",
        null=True, blank=True,
        related_name="defects_resolved",
        on_delete=models.SET_NULL,
    )

    class Meta:
        db_table = "quality_defects"
        ordering = ["-detected_date"]
        indexes = [
            models.Index(fields=["defect_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["detected_date"]),
        ]
        verbose_name = "Nuqs qayd"
        verbose_name_plural = "Nuqs qaydlari"

    def __str__(self):
        return f"{self.defect_number} | {self.defect_type.defect_code} | {self.get_status_display()}"

    @classmethod
    def generate_defect_number(cls) -> str:
        from django.utils import timezone
        year = timezone.now().year
        prefix = f"DEF-{year}"
        last = (
            cls.all_objects.filter(defect_number__startswith=prefix)
            .order_by("-defect_number")
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.defect_number.split("-")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}-{seq:04d}"
