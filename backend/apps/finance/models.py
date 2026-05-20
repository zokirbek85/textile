from django.db import models
from decimal import Decimal
from core.models import AuditedModel


class TransactionType(models.TextChoices):
    PRODUCTION_COST = "production_cost", "Production Cost"
    RAW_MATERIAL_PURCHASE = "raw_material_purchase", "Raw Material Purchase"
    UTILITY_EXPENSE = "utility_expense", "Utility Expense"
    SALARY_EXPENSE = "salary_expense", "Salary Expense"
    MAINTENANCE_EXPENSE = "maintenance_expense", "Maintenance Expense"
    OVERHEAD_ALLOCATION = "overhead_allocation", "Overhead Allocation"
    REVENUE = "revenue", "Revenue"
    OTHER_EXPENSE = "other_expense", "Other Expense"
    OTHER_INCOME = "other_income", "Other Income"


class FinancialTransaction(AuditedModel):
    """General ledger entry for all financial events in the system."""

    transaction_date = models.DateField(db_index=True)
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    description = models.TextField()
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.CharField(max_length=50, blank=True)

    # Debit / credit categorisation
    is_expense = models.BooleanField(default=True)

    # Expense category mirrors cotton/yarn batch categories for aggregation
    expense_category = models.CharField(max_length=30, blank=True)

    class Meta:
        db_table = "financial_transactions"
        ordering = ["-transaction_date", "-created_at"]
        indexes = [
            models.Index(fields=["transaction_date", "transaction_type"]),
        ]

    def __str__(self):
        direction = "EXP" if self.is_expense else "INC"
        return f"{direction} | {self.transaction_date} | {self.amount} | {self.description[:40]}"


class BudgetLine(AuditedModel):
    """Monthly budget vs actuals tracking."""

    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    category = models.CharField(max_length=30)
    budgeted_amount = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "budget_lines"
        unique_together = [("year", "month", "category")]
        ordering = ["year", "month", "category"]

    def __str__(self):
        return f"Budget {self.year}/{self.month:02d} | {self.category} | {self.budgeted_amount}"
