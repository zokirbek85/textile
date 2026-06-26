from django.contrib import admin
from .models import ProductionLine, ProductionOrder, ProductionBatch, ProductionShiftReport


@admin.register(ProductionLine)
class ProductionLineAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "line_type", "factory", "capacity_per_hour", "is_active"]
    list_filter = ["factory", "line_type", "is_active"]
    search_fields = ["name", "code", "equipment_model"]


class ProductionBatchInline(admin.TabularInline):
    model = ProductionBatch
    extra = 0
    fields = ["batch_number", "quantity_kg", "production_date", "shift", "brigade", "status"]
    readonly_fields = ["batch_number"]


@admin.register(ProductionOrder)
class ProductionOrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number", "order_type", "status", "production_line",
        "planned_start_date", "planned_output_kg", "actual_output_kg",
    ]
    list_filter = ["status", "order_type", "production_line", "shift", "brigade"]
    search_fields = ["order_number", "notes"]
    readonly_fields = [
        "order_number", "status", "actual_output_kg",
        "actual_start_date", "actual_end_date",
        "approved_by", "approved_at",
    ]
    inlines = [ProductionBatchInline]
    date_hierarchy = "planned_start_date"


@admin.register(ProductionBatch)
class ProductionBatchAdmin(admin.ModelAdmin):
    list_display = [
        "batch_number", "production_order", "quantity_kg",
        "production_date", "shift", "brigade", "status",
    ]
    list_filter = ["status", "shift", "brigade", "production_date"]
    search_fields = ["batch_number", "machine_number", "pallet_number"]
    readonly_fields = ["batch_number", "qc_checked_at", "qc_checked_by"]
    date_hierarchy = "production_date"


@admin.register(ProductionShiftReport)
class ProductionShiftReportAdmin(admin.ModelAdmin):
    list_display = [
        "report_number", "production_line", "shift_date", "shift", "brigade",
        "total_output_kg", "conversion_rate", "status",
    ]
    list_filter = ["status", "shift", "brigade", "production_line"]
    search_fields = ["report_number"]
    readonly_fields = ["report_number", "submitted_at", "approved_by", "approved_at"]
    date_hierarchy = "shift_date"
