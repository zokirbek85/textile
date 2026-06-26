from django.contrib import admin
from .models import (
    Equipment, SparePart, MaintenanceSchedule, MaintenanceRecord,
    MaintenancePartUsage, EquipmentDowntime, OEEMeasurement,
)


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ["equipment_code", "equipment_name", "equipment_type", "manufacturer", "status", "next_maintenance_due", "is_active"]
    list_filter = ["status", "equipment_type", "is_active"]
    search_fields = ["equipment_code", "equipment_name", "serial_number"]
    readonly_fields = ["total_operating_hours"]


@admin.register(SparePart)
class SparePartAdmin(admin.ModelAdmin):
    list_display = ["part_code", "part_name", "category", "current_stock", "minimum_stock", "is_critical", "is_active"]
    list_filter = ["category", "is_critical", "is_active"]
    search_fields = ["part_code", "part_name"]


@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ["equipment", "maintenance_type", "frequency_days", "estimated_duration_hours", "is_active"]
    list_filter = ["maintenance_type", "is_active"]


class PartUsageInline(admin.TabularInline):
    model = MaintenancePartUsage
    extra = 0


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ["record_number", "equipment", "maintenance_type", "scheduled_date", "status", "total_cost_uzs"]
    list_filter = ["status", "maintenance_type"]
    search_fields = ["record_number", "equipment__equipment_code"]
    readonly_fields = ["record_number"]
    inlines = [PartUsageInline]


@admin.register(EquipmentDowntime)
class EquipmentDowntimeAdmin(admin.ModelAdmin):
    list_display = ["downtime_number", "equipment", "downtime_type", "start_time", "duration_hours", "status"]
    list_filter = ["status", "downtime_type"]
    search_fields = ["downtime_number", "reason"]
    readonly_fields = ["downtime_number", "duration_hours"]


@admin.register(OEEMeasurement)
class OEEMeasurementAdmin(admin.ModelAdmin):
    list_display = ["equipment", "measurement_date", "shift", "availability_percentage", "performance_percentage", "quality_percentage", "oee_percentage"]
    list_filter = ["shift"]
    readonly_fields = ["availability_percentage", "performance_percentage", "quality_percentage", "oee_percentage"]
