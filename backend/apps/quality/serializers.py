from rest_framework import serializers
from .models import (
    QualityParameter, QualityTest, QualityTestResult,
    QualityCertificate, DefectType, QualityDefect,
)


class QualityParameterSerializer(serializers.ModelSerializer):
    applies_to_display = serializers.CharField(source="get_applies_to_display", read_only=True)
    data_type_display = serializers.CharField(source="get_data_type_display", read_only=True)

    class Meta:
        model = QualityParameter
        fields = [
            "id", "parameter_code", "parameter_name_uz", "parameter_name_en",
            "applies_to", "applies_to_display", "unit", "data_type", "data_type_display",
            "ozd_standard", "min_value", "max_value", "optimal_value",
            "testing_method", "equipment_required",
            "is_critical", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ─── Test Results ──────────────────────────────────────────────────────────────

class QualityTestResultSerializer(serializers.ModelSerializer):
    parameter_code = serializers.CharField(source="parameter.parameter_code", read_only=True)
    parameter_name = serializers.CharField(source="parameter.parameter_name_uz", read_only=True)
    parameter_unit = serializers.CharField(source="parameter.unit", read_only=True)
    parameter_min = serializers.DecimalField(source="parameter.min_value", max_digits=10, decimal_places=2, read_only=True)
    parameter_max = serializers.DecimalField(source="parameter.max_value", max_digits=10, decimal_places=2, read_only=True)
    is_critical = serializers.BooleanField(source="parameter.is_critical", read_only=True)
    data_type = serializers.CharField(source="parameter.data_type", read_only=True)

    class Meta:
        model = QualityTestResult
        fields = [
            "id", "parameter", "parameter_code", "parameter_name", "parameter_unit",
            "parameter_min", "parameter_max", "is_critical", "data_type",
            "measured_value", "measured_grade",
            "is_within_spec", "deviation_percentage",
            "instrument_id", "calibration_date", "notes",
        ]
        read_only_fields = ["id", "is_within_spec", "deviation_percentage"]


class QualityTestResultUpdateSerializer(serializers.ModelSerializer):
    """Used by lab tech to enter measured values."""

    class Meta:
        model = QualityTestResult
        fields = ["measured_value", "measured_grade", "instrument_id", "calibration_date", "notes"]


# ─── Quality Tests ─────────────────────────────────────────────────────────────

class QualityTestSerializer(serializers.ModelSerializer):
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    overall_result_display = serializers.CharField(source="get_overall_result_display", read_only=True)
    tested_by_name = serializers.CharField(source="tested_by.get_full_name", read_only=True)
    sample_taken_by_name = serializers.CharField(source="sample_taken_by.get_full_name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True, default=None)
    product_name = serializers.CharField(source="product.name", read_only=True)
    batch_number = serializers.CharField(source="production_batch.batch_number", read_only=True, default=None)
    test_results = QualityTestResultSerializer(many=True, read_only=True)
    result_count = serializers.SerializerMethodField()
    pass_count = serializers.SerializerMethodField()

    class Meta:
        model = QualityTest
        fields = [
            "id", "test_number", "test_type", "test_type_display",
            "production_batch", "batch_number", "product", "product_name",
            "sample_size_kg", "sample_location", "sample_taken_date", "sample_taken_by", "sample_taken_by_name",
            "test_date", "tested_by", "tested_by_name", "lab_equipment",
            "overall_result", "overall_result_display", "quality_grade",
            "approved_for_use", "rejected", "rejection_reason",
            "reviewed_by", "reviewed_by_name", "reviewed_at",
            "notes", "created_at",
            "test_results", "result_count", "pass_count",
        ]
        read_only_fields = ["id", "test_number", "overall_result", "quality_grade", "approved_for_use", "rejected", "created_at"]

    def get_result_count(self, obj):
        return obj.test_results.count()

    def get_pass_count(self, obj):
        return obj.test_results.filter(is_within_spec=True).count()


class QualityTestListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    overall_result_display = serializers.CharField(source="get_overall_result_display", read_only=True)
    tested_by_name = serializers.CharField(source="tested_by.get_full_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    batch_number = serializers.CharField(source="production_batch.batch_number", read_only=True, default=None)

    class Meta:
        model = QualityTest
        fields = [
            "id", "test_number", "test_type", "test_type_display",
            "batch_number", "product_name",
            "test_date", "tested_by_name",
            "overall_result", "overall_result_display", "quality_grade",
            "approved_for_use", "created_at",
        ]


class QualityTestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityTest
        fields = [
            "test_type", "production_batch", "product",
            "sample_size_kg", "sample_location", "sample_taken_date", "sample_taken_by",
            "test_date", "tested_by", "lab_equipment", "notes",
        ]

    def validate(self, data):
        if not data.get("production_batch") and not data.get("product"):
            raise serializers.ValidationError("Partiya yoki mahsulot ko'rsatilishi shart.")
        if data.get("production_batch") and not data.get("product"):
            data["product"] = data["production_batch"].output_product
        return data


class RejectTestSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


class IssueCertificateSerializer(serializers.Serializer):
    complies_with = serializers.CharField(required=False, default="O'zDSt 604:2016")


# ─── Certificates ──────────────────────────────────────────────────────────────

class QualityCertificateSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    batch_number = serializers.CharField(source="production_batch.batch_number", read_only=True)
    test_number = serializers.CharField(source="quality_test.test_number", read_only=True)
    issued_by_name = serializers.CharField(source="issued_by.get_full_name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.get_full_name", read_only=True)

    class Meta:
        model = QualityCertificate
        fields = [
            "id", "certificate_number",
            "production_batch", "batch_number",
            "product", "product_name",
            "quantity_kg", "quality_grade",
            "quality_test", "test_number",
            "complies_with", "issue_date", "valid_until",
            "issued_by", "issued_by_name",
            "approved_by", "approved_by_name",
            "is_active", "cancelled_at", "cancellation_reason",
            "created_at",
        ]
        read_only_fields = ["id", "certificate_number", "is_active", "cancelled_at", "created_at"]


class CancelCertificateSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)


# ─── Defect Types ──────────────────────────────────────────────────────────────

class DefectTypeSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)
    applies_to_display = serializers.CharField(source="get_applies_to_display", read_only=True)

    class Meta:
        model = DefectType
        fields = [
            "id", "defect_code", "defect_name_uz", "defect_name_en",
            "severity", "severity_display", "applies_to", "applies_to_display",
            "auto_reject", "requires_reprocessing", "description", "is_active",
        ]
        read_only_fields = ["id"]


# ─── Defects ───────────────────────────────────────────────────────────────────

class QualityDefectSerializer(serializers.ModelSerializer):
    detection_stage_display = serializers.CharField(source="get_detection_stage_display", read_only=True)
    disposition_display = serializers.CharField(source="get_disposition_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    defect_type_code = serializers.CharField(source="defect_type.defect_code", read_only=True)
    defect_type_name = serializers.CharField(source="defect_type.defect_name_uz", read_only=True)
    defect_severity = serializers.CharField(source="defect_type.severity", read_only=True)
    batch_number = serializers.CharField(source="production_batch.batch_number", read_only=True)
    detected_by_name = serializers.CharField(source="detected_by.get_full_name", read_only=True)
    resolved_by_name = serializers.CharField(source="resolved_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = QualityDefect
        fields = [
            "id", "defect_number",
            "production_batch", "batch_number",
            "detection_stage", "detection_stage_display",
            "defect_type", "defect_type_code", "defect_type_name", "defect_severity",
            "quantity_affected_kg", "percentage_of_batch",
            "detected_date", "detected_by", "detected_by_name",
            "description", "photo",
            "root_cause", "corrective_action", "preventive_action",
            "disposition", "disposition_display",
            "status", "status_display",
            "resolved_date", "resolved_by", "resolved_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "defect_number", "percentage_of_batch", "created_at"]


class QualityDefectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityDefect
        fields = [
            "production_batch", "detection_stage", "defect_type",
            "quantity_affected_kg", "detected_date", "detected_by",
            "description", "photo",
        ]


class ResolveDefectSerializer(serializers.Serializer):
    disposition = serializers.ChoiceField(choices=["use_as_is", "reprocess", "downgrade", "scrap"])
    root_cause = serializers.CharField(min_length=5)
    corrective_action = serializers.CharField(min_length=5)
