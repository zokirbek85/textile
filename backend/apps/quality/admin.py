from django.contrib import admin
from .models import (
    QualityParameter, QualityTest, QualityTestResult,
    QualityCertificate, DefectType, QualityDefect,
)


@admin.register(QualityParameter)
class QualityParameterAdmin(admin.ModelAdmin):
    list_display = ["parameter_code", "parameter_name_uz", "applies_to", "data_type", "is_critical", "is_active"]
    list_filter = ["applies_to", "data_type", "is_critical", "is_active"]
    search_fields = ["parameter_code", "parameter_name_uz"]


class QualityTestResultInline(admin.TabularInline):
    model = QualityTestResult
    extra = 0
    readonly_fields = ["is_within_spec", "deviation_percentage"]


@admin.register(QualityTest)
class QualityTestAdmin(admin.ModelAdmin):
    list_display = ["test_number", "test_type", "product", "test_date", "overall_result", "quality_grade", "approved_for_use"]
    list_filter = ["test_type", "overall_result", "approved_for_use"]
    search_fields = ["test_number"]
    readonly_fields = ["test_number", "overall_result", "quality_grade"]
    inlines = [QualityTestResultInline]


@admin.register(QualityCertificate)
class QualityCertificateAdmin(admin.ModelAdmin):
    list_display = ["certificate_number", "product", "quality_grade", "issue_date", "valid_until", "is_active"]
    list_filter = ["quality_grade", "is_active"]
    search_fields = ["certificate_number"]
    readonly_fields = ["certificate_number"]


@admin.register(DefectType)
class DefectTypeAdmin(admin.ModelAdmin):
    list_display = ["defect_code", "defect_name_uz", "severity", "applies_to", "auto_reject", "is_active"]
    list_filter = ["severity", "applies_to", "auto_reject"]
    search_fields = ["defect_code", "defect_name_uz"]


@admin.register(QualityDefect)
class QualityDefectAdmin(admin.ModelAdmin):
    list_display = ["defect_number", "production_batch", "defect_type", "quantity_affected_kg", "status", "detected_date"]
    list_filter = ["status", "detection_stage", "defect_type__severity"]
    search_fields = ["defect_number", "description"]
    readonly_fields = ["defect_number", "percentage_of_batch"]
