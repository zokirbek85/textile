from decimal import Decimal
from rest_framework import serializers
from .models import (
    ProductionLine, ProductionOrder, ProductionBatch, ProductionShiftReport,
)


class ProductionLineSerializer(serializers.ModelSerializer):
    line_type_display = serializers.CharField(source="get_line_type_display", read_only=True)
    factory_display = serializers.CharField(source="get_factory_display", read_only=True)

    class Meta:
        model = ProductionLine
        fields = [
            "id", "name", "code", "line_type", "line_type_display",
            "factory", "factory_display", "equipment_model",
            "capacity_per_hour", "is_active", "installation_date",
            "maintenance_schedule", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProductionLineUtilizationSerializer(serializers.Serializer):
    line_id = serializers.UUIDField()
    line_name = serializers.CharField()
    orders_in_progress = serializers.IntegerField()
    planned_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    utilization_pct = serializers.DecimalField(max_digits=5, decimal_places=2)


# ─── Production Order ──────────────────────────────────────────────────────────

class ProductionOrderSerializer(serializers.ModelSerializer):
    order_type_display = serializers.CharField(source="get_order_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shift_display = serializers.CharField(source="get_shift_display", read_only=True)
    brigade_display = serializers.CharField(source="get_brigade_display", read_only=True)

    input_product_name = serializers.CharField(source="input_product.name", read_only=True)
    output_product_name = serializers.CharField(source="output_product.name", read_only=True)
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)
    supervisor_name = serializers.CharField(source="supervisor.get_full_name", read_only=True)
    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name", read_only=True, default=None
    )
    tolling_contract_number = serializers.CharField(
        source="tolling_contract.contract_number", read_only=True, default=None
    )

    completion_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    is_delayed = serializers.BooleanField(read_only=True)
    batch_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductionOrder
        fields = [
            "id", "order_number", "order_type", "order_type_display", "status", "status_display",
            "tolling_contract", "tolling_contract_number",
            "cotton_batch", "yarn_batch",
            "input_product", "input_product_name",
            "output_product", "output_product_name",
            "input_quantity_kg", "planned_output_kg", "actual_output_kg", "waste_percentage",
            "yarn_count", "twist_per_meter",
            "production_line", "production_line_name",
            "planned_start_date", "planned_end_date",
            "actual_start_date", "actual_end_date",
            "shift", "shift_display", "brigade", "brigade_display",
            "supervisor", "supervisor_name",
            "approved_by", "approved_by_name", "approved_at",
            "completion_rate", "is_delayed", "batch_count",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "order_number", "status", "actual_output_kg",
            "actual_start_date", "actual_end_date",
            "approved_by", "approved_at", "created_at", "updated_at",
        ]

    def get_batch_count(self, obj) -> int:
        return obj.batches.all().count()


class ProductionOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionOrder
        fields = [
            "order_type", "tolling_contract",
            "input_product", "output_product",
            "input_quantity_kg", "planned_output_kg", "waste_percentage",
            "yarn_count", "twist_per_meter",
            "production_line",
            "planned_start_date", "planned_end_date",
            "shift", "brigade", "supervisor", "notes",
        ]

    def validate(self, attrs):
        if attrs["planned_end_date"] <= attrs["planned_start_date"]:
            raise serializers.ValidationError(
                {"planned_end_date": "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak."}
            )
        if attrs["order_type"] == "tolling" and not attrs.get("tolling_contract"):
            raise serializers.ValidationError(
                {"tolling_contract": "Davalliq buyurtmasi uchun shartnoma majburiy."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["order_number"] = ProductionOrder.generate_order_number()
        return super().create(validated_data)


# ─── Production Batch ──────────────────────────────────────────────────────────

class ProductionBatchSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shift_display = serializers.CharField(source="get_shift_display", read_only=True)
    output_product_name = serializers.CharField(source="output_product.name", read_only=True)
    order_number = serializers.CharField(source="production_order.order_number", read_only=True)
    qc_checked_by_name = serializers.CharField(
        source="qc_checked_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = ProductionBatch
        fields = [
            "id", "batch_number", "production_order", "order_number",
            "status", "status_display",
            "output_product", "output_product_name", "quantity_kg",
            "yarn_count_actual", "twist_actual", "strength_cn", "evenness_cv",
            "production_date", "shift", "shift_display", "brigade", "machine_number",
            "warehouse_location", "pallet_number",
            "qc_checked_at", "qc_checked_by", "qc_checked_by_name", "qc_notes",
            "notes", "created_at",
        ]
        read_only_fields = ["id", "batch_number", "created_at"]


class ProductionBatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionBatch
        fields = [
            "production_order", "output_product", "quantity_kg",
            "yarn_count_actual", "twist_actual", "strength_cn", "evenness_cv",
            "production_date", "shift", "brigade", "machine_number",
            "warehouse_location", "pallet_number", "notes",
        ]

    def create(self, validated_data):
        order = validated_data["production_order"]
        validated_data["batch_number"] = ProductionBatch.generate_batch_number(order)
        return super().create(validated_data)


class QCUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["qc_passed", "qc_failed"])
    qc_notes = serializers.CharField(allow_blank=True, default="")
    strength_cn = serializers.DecimalField(
        max_digits=8, decimal_places=2, required=False, allow_null=True
    )
    evenness_cv = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, allow_null=True
    )


class BatchTraceabilitySerializer(serializers.Serializer):
    batch_number = serializers.CharField()
    order_number = serializers.CharField()
    order_type = serializers.CharField()
    production_line = serializers.CharField()
    input_product = serializers.CharField()
    output_product = serializers.CharField()
    quantity_kg = serializers.DecimalField(max_digits=12, decimal_places=3)
    production_date = serializers.DateField()
    shift = serializers.CharField()
    brigade = serializers.IntegerField()
    tolling_contract_number = serializers.CharField(allow_null=True)
    status = serializers.CharField()


# ─── Shift Report ──────────────────────────────────────────────────────────────

class ProductionShiftReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shift_display = serializers.CharField(source="get_shift_display", read_only=True)
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)
    supervisor_name = serializers.CharField(source="supervisor.get_full_name", read_only=True)
    approved_by_name = serializers.CharField(
        source="approved_by.get_full_name", read_only=True, default=None
    )
    oee_availability = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    oee_performance = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = ProductionShiftReport
        fields = [
            "id", "report_number",
            "production_line", "production_line_name",
            "shift_date", "shift", "shift_display", "brigade",
            "supervisor", "supervisor_name", "workers_count",
            "total_input_kg", "total_output_kg", "waste_kg", "conversion_rate",
            "planned_runtime_hours", "actual_runtime_hours",
            "downtime_hours", "downtime_reason",
            "electricity_kwh", "gas_m3", "water_m3",
            "defect_count", "defect_description",
            "status", "status_display",
            "submitted_at", "approved_by", "approved_by_name", "approved_at",
            "oee_availability", "oee_performance",
            "notes", "created_at",
        ]
        read_only_fields = [
            "id", "report_number", "status",
            "submitted_at", "approved_by", "approved_at", "created_at",
        ]


class ProductionShiftReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionShiftReport
        fields = [
            "production_line", "shift_date", "shift", "brigade",
            "supervisor", "workers_count",
            "total_input_kg", "total_output_kg", "waste_kg",
            "planned_runtime_hours", "actual_runtime_hours",
            "downtime_hours", "downtime_reason",
            "electricity_kwh", "gas_m3", "water_m3",
            "defect_count", "defect_description", "notes",
        ]

    def validate(self, attrs):
        total_out = attrs.get("total_output_kg", Decimal("0"))
        total_in = attrs.get("total_input_kg", Decimal("0"))
        if total_out > total_in:
            raise serializers.ValidationError(
                {"total_output_kg": "Chiqish miqdori kirish miqdoridan ko'p bo'lishi mumkin emas."}
            )
        downtime = attrs.get("downtime_hours", Decimal("0"))
        actual = attrs.get("actual_runtime_hours", Decimal("0"))
        planned = attrs.get("planned_runtime_hours", Decimal("12"))
        if actual + downtime > planned:
            raise serializers.ValidationError(
                {"downtime_hours": "Ish vaqti + to'xtash vaqti rejalashtirilgan vaqtdan oshib ketdi."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["report_number"] = ProductionShiftReport.generate_report_number()
        if validated_data["total_input_kg"] > 0:
            validated_data["conversion_rate"] = (
                validated_data["total_output_kg"] / validated_data["total_input_kg"] * 100
            ).quantize(Decimal("0.01"))
        return super().create(validated_data)


# ─── Dashboard / Analytics ────────────────────────────────────────────────────

class ProductionDashboardSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    orders_in_progress = serializers.IntegerField()
    orders_delayed = serializers.IntegerField()
    orders_completed_today = serializers.IntegerField()
    total_output_today_kg = serializers.DecimalField(max_digits=12, decimal_places=3)
    avg_conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    active_lines = serializers.IntegerField()
    pending_qc_batches = serializers.IntegerField()
