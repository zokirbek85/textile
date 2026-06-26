from rest_framework import serializers
from .models import (
    Equipment, SparePart, MaintenanceSchedule, MaintenanceRecord,
    MaintenancePartUsage, EquipmentDowntime, OEEMeasurement,
)


# ─── Equipment ────────────────────────────────────────────────────────────────

class EquipmentSerializer(serializers.ModelSerializer):
    equipment_type_display = serializers.CharField(source="get_equipment_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)
    is_overdue = serializers.BooleanField(source="is_overdue_for_maintenance", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id", "equipment_code", "equipment_name",
            "equipment_type", "equipment_type_display",
            "production_line", "production_line_name",
            "manufacturer", "model", "serial_number", "year_manufactured",
            "rated_capacity", "capacity_unit", "spindles_count",
            "installation_date", "warranty_expires", "location",
            "maintenance_frequency_days", "last_maintenance_date", "next_maintenance_due",
            "total_operating_hours", "status", "status_display",
            "photo", "is_active", "notes", "is_overdue", "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_overdue"]


class EquipmentListSerializer(serializers.ModelSerializer):
    equipment_type_display = serializers.CharField(source="get_equipment_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)
    is_overdue = serializers.BooleanField(source="is_overdue_for_maintenance", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id", "equipment_code", "equipment_name",
            "equipment_type", "equipment_type_display",
            "production_line_name", "manufacturer", "model",
            "rated_capacity", "capacity_unit",
            "status", "status_display",
            "next_maintenance_due", "is_overdue", "is_active",
        ]


class UpdateEquipmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["operational", "maintenance", "breakdown", "idle", "decommissioned"])


# ─── Spare Parts ──────────────────────────────────────────────────────────────

class SparePartSerializer(serializers.ModelSerializer):
    needs_reorder = serializers.BooleanField(read_only=True)
    compatible_equipment_codes = serializers.SerializerMethodField()

    class Meta:
        model = SparePart
        fields = [
            "id", "part_code", "part_name", "category",
            "compatible_equipment", "compatible_equipment_codes",
            "manufacturer_part_number", "supplier_name", "lead_time_days",
            "current_stock", "unit_of_measure", "minimum_stock", "maximum_stock",
            "unit_cost_uzs", "last_purchase_date",
            "storage_location", "is_critical", "is_active", "needs_reorder",
        ]
        read_only_fields = ["id", "needs_reorder"]

    def get_compatible_equipment_codes(self, obj):
        return list(obj.compatible_equipment.values_list("equipment_code", flat=True))


class RestockSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


# ─── Maintenance Schedules ────────────────────────────────────────────────────

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    maintenance_type_display = serializers.CharField(source="get_maintenance_type_display", read_only=True)
    equipment_code = serializers.CharField(source="equipment.equipment_code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True)

    class Meta:
        model = MaintenanceSchedule
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "maintenance_type", "maintenance_type_display",
            "frequency_days", "estimated_duration_hours",
            "maintenance_checklist", "required_technicians",
            "required_spare_parts", "is_active",
        ]
        read_only_fields = ["id"]


# ─── Maintenance Records ───────────────────────────────────────────────────────

class MaintenancePartUsageSerializer(serializers.ModelSerializer):
    part_code = serializers.CharField(source="spare_part.part_code", read_only=True)
    part_name = serializers.CharField(source="spare_part.part_name", read_only=True)
    condition_display = serializers.CharField(source="get_removed_part_condition_display", read_only=True)

    class Meta:
        model = MaintenancePartUsage
        fields = [
            "id", "spare_part", "part_code", "part_name",
            "quantity_used", "unit_cost_uzs", "total_cost_uzs",
            "removed_part_condition", "condition_display", "notes",
        ]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    maintenance_type_display = serializers.CharField(source="get_maintenance_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    equipment_code = serializers.CharField(source="equipment.equipment_code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True)
    technician_name = serializers.CharField(source="assigned_technician.get_full_name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.get_full_name", read_only=True, default=None)
    part_usages = MaintenancePartUsageSerializer(many=True, read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = [
            "id", "record_number", "equipment", "equipment_code", "equipment_name",
            "maintenance_type", "maintenance_type_display",
            "scheduled_date", "scheduled_duration_hours",
            "actual_start", "actual_end", "actual_duration_hours",
            "assigned_technician", "technician_name",
            "work_description", "checklist_completed", "findings", "recommendations",
            "labor_cost_uzs", "parts_cost_uzs", "total_cost_uzs",
            "status", "status_display",
            "approved_by", "approved_by_name", "approved_at",
            "equipment_status_after", "test_run_successful",
            "part_usages", "created_at",
        ]
        read_only_fields = ["id", "record_number", "created_at"]


class MaintenanceRecordListSerializer(serializers.ModelSerializer):
    maintenance_type_display = serializers.CharField(source="get_maintenance_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    equipment_code = serializers.CharField(source="equipment.equipment_code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True)
    technician_name = serializers.CharField(source="assigned_technician.get_full_name", read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = [
            "id", "record_number", "equipment_code", "equipment_name",
            "maintenance_type", "maintenance_type_display",
            "scheduled_date", "technician_name",
            "total_cost_uzs", "status", "status_display", "created_at",
        ]


class MaintenanceRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = [
            "equipment", "maintenance_type", "scheduled_date",
            "scheduled_duration_hours", "assigned_technician",
            "work_description", "findings", "recommendations",
        ]


class CompleteMaintSerializer(serializers.Serializer):
    work_description = serializers.CharField()
    equipment_status_after = serializers.ChoiceField(choices=["operational", "maintenance", "breakdown", "idle"])
    test_run_successful = serializers.BooleanField()
    labor_cost_uzs = serializers.DecimalField(max_digits=12, decimal_places=2)


class UsePartSerializer(serializers.Serializer):
    spare_part = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    removed_part_condition = serializers.ChoiceField(choices=["worn", "broken", "corroded", "preventive"])
    notes = serializers.CharField(required=False, default="")


# ─── Downtime ─────────────────────────────────────────────────────────────────

class EquipmentDowntimeSerializer(serializers.ModelSerializer):
    downtime_type_display = serializers.CharField(source="get_downtime_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    equipment_code = serializers.CharField(source="equipment.equipment_code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.get_full_name", read_only=True)
    resolved_by_name = serializers.CharField(source="resolved_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = EquipmentDowntime
        fields = [
            "id", "downtime_number", "equipment", "equipment_code", "equipment_name",
            "start_time", "end_time", "duration_hours",
            "downtime_type", "downtime_type_display",
            "reason", "problem_description",
            "production_loss_kg", "financial_loss_uzs",
            "action_taken", "resolved_by", "resolved_by_name",
            "maintenance_record", "shift_report",
            "status", "status_display",
            "reported_by", "reported_by_name", "created_at",
        ]
        read_only_fields = ["id", "downtime_number", "duration_hours", "created_at"]


class DowntimeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentDowntime
        fields = ["equipment", "downtime_type", "reason", "problem_description", "start_time", "reported_by"]

    def validate(self, data):
        if "start_time" not in data:
            from django.utils import timezone
            data["start_time"] = timezone.now()
        return data


class ResolveDowntimeSerializer(serializers.Serializer):
    action_taken = serializers.CharField()
    production_loss_kg = serializers.DecimalField(max_digits=12, decimal_places=3, default=0)


# ─── OEE ──────────────────────────────────────────────────────────────────────

class OEEMeasurementSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source="equipment.equipment_code", read_only=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True)

    class Meta:
        model = OEEMeasurement
        fields = [
            "id", "equipment", "equipment_code", "equipment_name",
            "measurement_date", "shift",
            "planned_production_time_hours", "downtime_hours", "availability_percentage",
            "target_production_kg", "actual_production_kg", "performance_percentage",
            "total_production_kg", "defect_production_kg", "quality_percentage",
            "oee_percentage", "shift_report", "calculated_at",
        ]
        read_only_fields = [
            "id", "availability_percentage", "performance_percentage",
            "quality_percentage", "oee_percentage", "calculated_at",
        ]


class CalculateOEESerializer(serializers.Serializer):
    equipment_id = serializers.UUIDField()
    shift_report_id = serializers.UUIDField()
