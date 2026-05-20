from rest_framework import serializers
from .models import FinancialTransaction, BudgetLine


class FinancialTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = FinancialTransaction
        fields = [
            "id", "transaction_date", "transaction_type", "transaction_type_display",
            "amount", "description", "reference_type", "reference_id",
            "is_expense", "expense_category",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by", "created_by_name"]


class BudgetLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetLine
        fields = ["id", "year", "month", "category", "budgeted_amount", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class FinancialSummarySerializer(serializers.Serializer):
    period = serializers.DictField()
    total_expenses = serializers.DecimalField(max_digits=20, decimal_places=4)
    total_income = serializers.DecimalField(max_digits=20, decimal_places=4)
    net = serializers.DecimalField(max_digits=20, decimal_places=4)
    expenses_by_category = serializers.DictField()
