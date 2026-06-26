from decimal import Decimal
from rest_framework import serializers
from .models import CottonBatch, CottonBatchExpense, Machine, Shift


class CottonBatchExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = CottonBatchExpense
        fields = [
            "id", "batch", "category", "category_display", "description",
            "amount", "quantity", "unit", "expense_date", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CottonBatchSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    expenses = CottonBatchExpenseSerializer(many=True, read_only=True)
    net_cost = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    total_byproduct_credit = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)

    class Meta:
        model = CottonBatch
        fields = [
            "id", "batch_code", "status", "status_display",
            "start_date", "end_date",
            "cotton_input_kg", "cotton_cost_total",
            "fiber_output_kg", "seed_output_kg", "lint_output_kg", "waste_output_kg",
            "seed_credit_value", "lint_credit_value", "total_byproduct_credit",
            "total_production_expenses", "net_cost",
            "calculated_fiber_cost_per_kg", "fiber_yield_pct",
            "cotton_source_warehouse", "fiber_target_warehouse",
            "notes", "expenses", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "batch_code", "total_production_expenses",
            "calculated_fiber_cost_per_kg", "fiber_yield_pct",
            "net_cost", "total_byproduct_credit", "created_at", "updated_at",
        ]


class CottonBatchCreateSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    cotton_source_warehouse_id = serializers.UUIDField()
    fiber_target_warehouse_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, allow_blank=True)


class AddCottonInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity_kg = serializers.DecimalField(max_digits=14, decimal_places=3, min_value=Decimal("0.001"))


class AddExpenseSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=CottonBatchExpense.category.field.choices
                                       if hasattr(CottonBatchExpense, 'category') else [])
    amount = serializers.DecimalField(max_digits=20, decimal_places=4, min_value=Decimal("0"))
    expense_date = serializers.DateField()
    description = serializers.CharField(required=False, allow_blank=True)
    quantity = serializers.DecimalField(max_digits=14, decimal_places=3,
                                        required=False, allow_null=True)
    unit = serializers.CharField(required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from .models import ExpenseCategory
        self.fields["category"] = serializers.ChoiceField(choices=ExpenseCategory.choices)


class CompleteBatchSerializer(serializers.Serializer):
    fiber_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, min_value=Decimal("0.001"))
    seed_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, default=0, min_value=Decimal("0"))
    lint_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, default=0, min_value=Decimal("0"))
    waste_output_kg = serializers.DecimalField(max_digits=14, decimal_places=3, default=0, min_value=Decimal("0"))
    seed_credit_value = serializers.DecimalField(max_digits=20, decimal_places=4, default=0, min_value=Decimal("0"))
    lint_credit_value = serializers.DecimalField(max_digits=20, decimal_places=4, default=0, min_value=Decimal("0"))
    end_date = serializers.DateField(required=False)


class MachineSerializer(serializers.ModelSerializer):
    machine_type_display = serializers.CharField(source="get_machine_type_display", read_only=True)

    class Meta:
        model = Machine
        fields = [
            "id", "name", "code", "machine_type", "machine_type_display",
            "manufacturer", "model_number", "year_of_manufacture",
            "capacity_kg_per_hour", "is_active", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ShiftSerializer(serializers.ModelSerializer):
    shift_type_display = serializers.CharField(source="get_shift_type_display", read_only=True)
    efficiency_pct = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    supervisor_name = serializers.CharField(source="supervisor.get_full_name", read_only=True)

    class Meta:
        model = Shift
        fields = [
            "id", "shift_date", "shift_type", "shift_type_display",
            "batch", "supervisor", "supervisor_name",
            "planned_hours", "actual_hours", "efficiency_pct",
            "cotton_processed_kg", "fiber_produced_kg",
            "downtime_minutes", "downtime_reason", "notes", "created_at",
        ]
        read_only_fields = ["id", "efficiency_pct", "created_at"]
