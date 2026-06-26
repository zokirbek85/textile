"""
Quality Control business logic.

Key invariants:
- A QualityTest must be in 'passed' state before a certificate can be issued
- Critical parameter failures always cause overall test failure
- Grade A/B/C is derived from parameter deviation percentages
- Batch status (qc_passed/qc_failed) is updated when a test is approved/rejected
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from core.exceptions import BusinessLogicError
from .models import (
    QualityTest, QualityTestResult, QualityParameter,
    QualityCertificate, QualityDefect, DefectType,
    TestResult, DefectStatus,
)

logger = logging.getLogger("apps.quality")


# ─── Quality Test Services ────────────────────────────────────────────────────

def create_test_for_batch(batch, test_type: str, tested_by, sample_size_kg: Decimal,
                           sample_taken_by=None, lab_equipment: str = "") -> QualityTest:
    """Create a QualityTest with result slots for all applicable parameters."""
    product = batch.output_product
    product_type = product.product_type if hasattr(product, "product_type") else "cotton_fiber"

    # Map product type to applies_to value
    applies_map = {
        "raw_cotton": "raw_cotton",
        "fiber": "cotton_fiber",
        "yarn": "yarn",
        "sliver": "sliver",
        "cotton_fiber": "cotton_fiber",
    }
    applies_to = applies_map.get(product_type, "cotton_fiber")

    parameters = QualityParameter.objects.filter(applies_to=applies_to, is_active=True)

    with transaction.atomic():
        test = QualityTest.objects.create(
            test_number=QualityTest.generate_test_number(),
            test_type=test_type,
            production_batch=batch,
            product=product,
            sample_size_kg=sample_size_kg,
            sample_taken_date=timezone.now(),
            sample_taken_by=sample_taken_by or tested_by,
            test_date=timezone.now(),
            tested_by=tested_by,
            lab_equipment=lab_equipment,
            overall_result=TestResult.PENDING,
            created_by=tested_by,
        )
        for param in parameters:
            QualityTestResult.objects.create(
                quality_test=test,
                parameter=param,
                is_within_spec=True,
            )

    logger.info("Quality test %s created for batch %s", test.test_number, batch.batch_number)
    return test


def evaluate_test_results(test: QualityTest, user) -> QualityTest:
    """Evaluate all parameter results, set overall_result and quality_grade."""
    results = test.test_results.select_related("parameter").all()

    any_critical_fail = False
    total_deviation = Decimal("0")
    evaluated_count = 0

    for result in results:
        param = result.parameter
        if param.data_type == "numeric" and result.measured_value is not None:
            within = True
            deviation = Decimal("0")

            if param.min_value is not None and result.measured_value < param.min_value:
                within = False
                deviation = abs(result.measured_value - param.min_value) / param.min_value * 100

            if param.max_value is not None and result.measured_value > param.max_value:
                within = False
                deviation = abs(result.measured_value - param.max_value) / param.max_value * 100

            result.is_within_spec = within
            result.deviation_percentage = deviation.quantize(Decimal("0.01"))
            result.save(update_fields=["is_within_spec", "deviation_percentage"])

            if not within and param.is_critical:
                any_critical_fail = True

            total_deviation += deviation
            evaluated_count += 1

        elif param.data_type == "pass_fail":
            # measured_grade "pass"/"fail"
            within = result.measured_grade.lower() in ("pass", "o'tdi", "otdi", "1", "true")
            result.is_within_spec = within
            result.save(update_fields=["is_within_spec"])
            if not within and param.is_critical:
                any_critical_fail = True

    avg_deviation = (total_deviation / evaluated_count) if evaluated_count else Decimal("0")

    if any_critical_fail:
        overall = TestResult.FAILED
        grade = "C"
    elif avg_deviation <= Decimal("5"):
        overall = TestResult.PASSED
        grade = "A"
    elif avg_deviation <= Decimal("15"):
        overall = TestResult.PASSED
        grade = "B"
    else:
        overall = TestResult.FAILED
        grade = "C"

    with transaction.atomic():
        test.overall_result = overall
        test.quality_grade = grade
        test.reviewed_by = user
        test.reviewed_at = timezone.now()
        test.updated_by = user
        test.save(update_fields=[
            "overall_result", "quality_grade", "reviewed_by", "reviewed_at",
            "updated_by", "updated_at",
        ])

    logger.info("Test %s evaluated → %s grade %s", test.test_number, overall, grade)
    return test


def approve_test(test: QualityTest, user) -> QualityTest:
    """Approve a passed test → mark batch qc_passed."""
    if test.overall_result != TestResult.PASSED:
        raise BusinessLogicError(
            f"Faqat 'O'tdi' natijali sinovni tasdiqlash mumkin. Hozirgi natija: {test.get_overall_result_display()}"
        )
    from apps.production.models import BatchStatus
    with transaction.atomic():
        test.approved_for_use = True
        test.reviewed_by = user
        test.reviewed_at = timezone.now()
        test.updated_by = user
        test.save(update_fields=[
            "approved_for_use", "reviewed_by", "reviewed_at", "updated_by", "updated_at"
        ])
        if test.production_batch:
            batch = test.production_batch
            batch.status = BatchStatus.QC_PASSED
            batch.qc_checked_at = timezone.now()
            batch.qc_checked_by = user
            batch.save(update_fields=["status", "qc_checked_at", "qc_checked_by", "updated_at"])

    logger.info("Test %s approved by %s", test.test_number, user)
    return test


def reject_test(test: QualityTest, reason: str, user) -> QualityTest:
    """Reject a test → mark batch qc_failed."""
    if not reason:
        raise BusinessLogicError("Rad etish sababi ko'rsatilishi shart.")
    from apps.production.models import BatchStatus
    with transaction.atomic():
        test.rejected = True
        test.rejection_reason = reason
        test.overall_result = TestResult.FAILED
        test.reviewed_by = user
        test.reviewed_at = timezone.now()
        test.updated_by = user
        test.save(update_fields=[
            "rejected", "rejection_reason", "overall_result",
            "reviewed_by", "reviewed_at", "updated_by", "updated_at",
        ])
        if test.production_batch:
            batch = test.production_batch
            batch.status = BatchStatus.QC_FAILED
            batch.qc_checked_at = timezone.now()
            batch.qc_checked_by = user
            batch.qc_notes = reason
            batch.save(update_fields=["status", "qc_checked_at", "qc_checked_by", "qc_notes", "updated_at"])

    logger.info("Test %s rejected by %s: %s", test.test_number, user, reason)
    return test


# ─── Certificate Services ──────────────────────────────────────────────────────

def issue_certificate(test: QualityTest, approved_by, complies_with: str = "") -> QualityCertificate:
    """Issue a quality certificate for a passed and approved test."""
    if not test.approved_for_use:
        raise BusinessLogicError("Sertifikat faqat tasdiqlangan sinovlar uchun beriladi.")
    if test.overall_result != TestResult.PASSED:
        raise BusinessLogicError("Sertifikat faqat 'O'tdi' natijali sinovlar uchun beriladi.")
    if not test.production_batch:
        raise BusinessLogicError("Sertifikat faqat partiya bog'liq sinovlar uchun beriladi.")

    batch = test.production_batch
    if hasattr(batch, "quality_certificate"):
        raise BusinessLogicError(
            f"Bu partiya uchun sertifikat allaqachon berilgan: {batch.quality_certificate.certificate_number}"
        )

    today = timezone.now().date()
    with transaction.atomic():
        cert = QualityCertificate.objects.create(
            certificate_number=QualityCertificate.generate_certificate_number(),
            production_batch=batch,
            product=batch.output_product,
            quantity_kg=batch.quantity_kg,
            quality_grade=test.quality_grade,
            quality_test=test,
            complies_with=complies_with or "O'zDSt 604:2016",
            issue_date=today,
            valid_until=today.replace(year=today.year + 1),
            issued_by=test.tested_by,
            approved_by=approved_by,
            created_by=approved_by,
        )

    logger.info("Certificate %s issued for batch %s", cert.certificate_number, batch.batch_number)
    return cert


def cancel_certificate(cert: QualityCertificate, reason: str, user) -> QualityCertificate:
    if not cert.is_active:
        raise BusinessLogicError("Bu sertifikat allaqachon bekor qilingan.")
    if not reason:
        raise BusinessLogicError("Bekor qilish sababi ko'rsatilishi shart.")
    with transaction.atomic():
        cert.is_active = False
        cert.cancelled_at = timezone.now()
        cert.cancellation_reason = reason
        cert.updated_by = user
        cert.save(update_fields=["is_active", "cancelled_at", "cancellation_reason", "updated_by", "updated_at"])
    logger.info("Certificate %s cancelled by %s", cert.certificate_number, user)
    return cert


# ─── Defect Services ───────────────────────────────────────────────────────────

def log_defect(batch, defect_type: DefectType, quantity_kg: Decimal,
               detected_by, description: str = "") -> "QualityDefect":
    """Log a quality defect against a production batch."""
    pct = (quantity_kg / batch.quantity_kg * 100).quantize(Decimal("0.01"))

    with transaction.atomic():
        defect = QualityDefect.objects.create(
            defect_number=QualityDefect.generate_defect_number(),
            production_batch=batch,
            detection_stage="qc_inspection",
            defect_type=defect_type,
            quantity_affected_kg=quantity_kg,
            percentage_of_batch=pct,
            detected_date=timezone.now(),
            detected_by=detected_by,
            description=description,
            created_by=detected_by,
        )
        # Auto-reject critical defects
        if defect_type.auto_reject:
            from apps.production.models import BatchStatus
            batch.status = BatchStatus.QC_FAILED
            batch.qc_notes = f"Kritik nuqs: {defect_type.defect_name_uz}"
            batch.save(update_fields=["status", "qc_notes", "updated_at"])

    logger.info("Defect %s logged for batch %s", defect.defect_number, batch.batch_number)
    return defect


def resolve_defect(defect: "QualityDefect", disposition: str, root_cause: str,
                   corrective_action: str, user) -> "QualityDefect":
    if defect.status in (DefectStatus.RESOLVED, DefectStatus.CLOSED):
        raise BusinessLogicError("Bu nuqs allaqachon hal qilingan.")
    with transaction.atomic():
        defect.disposition = disposition
        defect.root_cause = root_cause
        defect.corrective_action = corrective_action
        defect.status = DefectStatus.RESOLVED
        defect.resolved_date = timezone.now()
        defect.resolved_by = user
        defect.updated_by = user
        defect.save(update_fields=[
            "disposition", "root_cause", "corrective_action", "status",
            "resolved_date", "resolved_by", "updated_by", "updated_at",
        ])
    logger.info("Defect %s resolved by %s", defect.defect_number, user)
    return defect


# ─── Analytics ────────────────────────────────────────────────────────────────

def get_pass_rate(start_date=None, end_date=None) -> dict:
    from django.db.models import Count, Q
    qs = QualityTest.objects.all()
    if start_date:
        qs = qs.filter(test_date__date__gte=start_date)
    if end_date:
        qs = qs.filter(test_date__date__lte=end_date)
    total = qs.count()
    passed = qs.filter(overall_result=TestResult.PASSED).count()
    failed = qs.filter(overall_result=TestResult.FAILED).count()
    rate = (Decimal(passed) / Decimal(total) * 100).quantize(Decimal("0.1")) if total else Decimal("0")
    return {"total": total, "passed": passed, "failed": failed, "pass_rate": float(rate)}


def get_defects_by_type(start_date=None, end_date=None) -> list:
    from django.db.models import Count, Sum
    qs = QualityDefect.objects.all()
    if start_date:
        qs = qs.filter(detected_date__date__gte=start_date)
    if end_date:
        qs = qs.filter(detected_date__date__lte=end_date)
    return list(
        qs.values("defect_type__defect_code", "defect_type__defect_name_uz")
        .annotate(count=Count("id"), total_kg=Sum("quantity_affected_kg"))
        .order_by("-count")
    )


def get_grade_distribution(start_date=None, end_date=None) -> dict:
    from django.db.models import Count
    qs = QualityTest.objects.filter(overall_result=TestResult.PASSED)
    if start_date:
        qs = qs.filter(test_date__date__gte=start_date)
    if end_date:
        qs = qs.filter(test_date__date__lte=end_date)
    dist = {row["quality_grade"]: row["count"] for row in
            qs.values("quality_grade").annotate(count=Count("id"))}
    return {"A": dist.get("A", 0), "B": dist.get("B", 0), "C": dist.get("C", 0)}


def get_compliance_score() -> dict:
    from django.db.models import Count
    total_results = QualityTestResult.objects.count()
    within = QualityTestResult.objects.filter(is_within_spec=True).count()
    score = (Decimal(within) / Decimal(total_results) * 100).quantize(Decimal("0.1")) if total_results else Decimal("0")
    return {"total_results": total_results, "within_spec": within, "compliance_score": float(score)}
