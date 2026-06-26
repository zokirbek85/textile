from decimal import Decimal
from rest_framework import serializers
from .models import YarnBatch, YarnBatchExpense, YarnShift


class YarnBatchExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = YarnBatchExpense
        fields = [
            "id", "batch", "category", "category_display", "description",
            "amount", "quantity", "unit", "expense_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class YarnBatchSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    yarn_product_name = serializers.CharField(source="yarn_product.name", read_only=True)
    yarn_count = serializers.CharField(source="yarn_product.yarn_count", read_only=True)
    yarn_type = serializers.CharField(source="yarn_product.yarn_type", read_only=True)
    expenses = YarnBatchExpenseSerializer(many=True, read_only=True)
    net_cost = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    tolling_customer_name = serializers.CharField(source="tolling_contract.customer_name", read_only=True, default="")

    class Meta:
        model = YarnBatch
        fields = [
            "id", "batch_code", "status", "status_display",
            "start_date", "end_date",
            "yarn_product", "yarn_product_name", "yarn_count", "yarn_type",
            "fiber_input_kg", "fiber_cost_total",
            "yarn_output_kg", "waste_output_kg",
            "waste_pct", "efficiency_pct",
            "total_spinning_expenses", "net_cost",
            "calculated_yarn_cost_per_kg",
            "fiber_source_warehouse", "yarn_target_warehouse",
            "notes", "expenses", "created_at", "updated_at",
            # Tolling fields
            "tolling_contract", "tolling_customer_name",
            "processor_yarn_kg", "customer_yarn_kg", "loss_yarn_kg",
            "service_fee_per_kg_fiber", "total_service_fee", "total_service_fee_with_vat",
        ]
        read_only_fields = [
            "id", "batch_code", "total_spinning_expenses",
            "calculated_yarn_cost_per_kg", "waste_pct",
            "net_cost", "created_at", "updated_at",
            "processor_yarn_kg", "customer_yarn_kg", "loss_yarn_kg",
            "service_fee_per_kg_fiber", "total_service_fee", "total_service_fee_with_vat",
        ]


class YarnBatchCreateSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    yarn_product_id = serializers.UUIDField()
    fiber_source_warehouse_id = serializers.UUIDField(required=False)
    yarn_target_warehouse_id = serializers.UUIDField(required=False)
    tolling_contract_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("tolling_contract_id"):
            if not attrs.get("fiber_source_warehouse_id"):
                raise serializers.ValidationError(
                    {"fiber_source_warehouse_id": "Required for own-material batches."}
                )
            if not attrs.get("yarn_target_warehouse_id"):
                raise serializers.ValidationError(
                    {"yarn_target_warehouse_id": "Required for own-material batches."}
                )
        return attrs


class AddFiberInputSerializer(serializers.Serializer):
    quantity_kg = serializers.DecimalField(max_digits=14, decimal_places=3, min_value=Decimal("0.001"))


class CompleteYarnBatchSerializer(serializers.Serializer):
    yarn_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, min_value=Decimal("0.001"))
    waste_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, default=0, min_value=Decimal("0"))
    efficiency_pct = serializers.DecimalField(max_digits=6, decimal_places=2, default=0, min_value=Decimal("0"))
    end_date = serializers.DateField(required=False)


class YarnShiftSerializer(serializers.ModelSerializer):
    shift_type_display = serializers.CharField(source="get_shift_type_display", read_only=True)
    operator_name = serializers.CharField(source="operator.get_full_name", read_only=True)
    machine_name = serializers.CharField(source="machine.name", read_only=True)
    waste_pct = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    efficiency_pct = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = YarnShift
        fields = [
            "id", "shift_date", "shift_type", "shift_type_display",
            "batch", "machine", "machine_name", "operator", "operator_name",
            "planned_hours", "actual_hours", "efficiency_pct",
            "fiber_consumed_kg", "yarn_produced_kg", "waste_kg", "waste_pct",
            "downtime_minutes", "downtime_reason", "notes", "created_at",
        ]
        read_only_fields = ["id", "waste_pct", "efficiency_pct", "created_at"]
