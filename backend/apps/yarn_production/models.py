from django.db import models
from decimal import Decimal
from core.models import AuditedModel
from apps.cotton_production.models import BatchStatus, ExpenseCategory


class YarnBatch(AuditedModel):
    """
    Represents one fiber-to-yarn spinning run.

    Yarn Cost Formula:
        yarn_cost_per_kg = (fiber_cost + Σ spinning_expenses) / yarn_output_kg
    """
    batch_code = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=BatchStatus.choices, default=BatchStatus.DRAFT)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    # Linked yarn product (defines Ne count, type etc.)
    yarn_product = models.ForeignKey(
        "warehouse.Product", on_delete=models.PROTECT,
        related_name="yarn_batches", null=True, blank=True
    )

    # Fiber input
    fiber_input_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    fiber_cost_total = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    fiber_source_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        related_name="yarn_batches_in", null=True, blank=True
    )

    # Yarn output
    yarn_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    waste_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    yarn_target_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        related_name="yarn_batches_out", null=True, blank=True
    )

    # Production metrics
    waste_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    efficiency_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))

    # Costing results (populated on completion)
    total_spinning_expenses = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    calculated_yarn_cost_per_kg = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "yarn_batches"
        ordering = ["-start_date", "-created_at"]

    def __str__(self):
        product_name = self.yarn_product.name if self.yarn_product else "Unknown"
        return f"Yarn Batch {self.batch_code} | {product_name} ({self.get_status_display()})"

    @property
    def net_cost(self) -> Decimal:
        return self.fiber_cost_total + self.total_spinning_expenses


class YarnBatchExpense(AuditedModel):
    batch = models.ForeignKey(YarnBatch, on_delete=models.CASCADE, related_name="expenses")
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices)
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    quantity = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    expense_date = models.DateField()

    class Meta:
        db_table = "yarn_batch_expenses"
        ordering = ["category", "expense_date"]

    def __str__(self):
        return f"{self.batch.batch_code} | {self.get_category_display()} | {self.amount}"


class YarnShift(AuditedModel):
    """Shift-level production record for spinning floor."""

    class ShiftType(models.TextChoices):
        MORNING = "morning", "Morning"
        AFTERNOON = "afternoon", "Afternoon"
        NIGHT = "night", "Night"

    shift_date = models.DateField(db_index=True)
    shift_type = models.CharField(max_length=20, choices=ShiftType.choices)
    batch = models.ForeignKey(YarnBatch, on_delete=models.CASCADE, related_name="shifts",
                               null=True, blank=True)
    machine = models.ForeignKey(
        "cotton_production.Machine", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="yarn_shifts"
    )
    operator = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="yarn_shifts"
    )
    planned_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("8"))
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    fiber_consumed_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    yarn_produced_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    waste_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    downtime_minutes = models.PositiveIntegerField(default=0)
    downtime_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "yarn_shifts"
        ordering = ["-shift_date", "shift_type"]

    def __str__(self):
        return f"{self.shift_date} {self.get_shift_type_display()} | {self.batch}"

    @property
    def waste_pct(self) -> Decimal:
        from core.utils import safe_divide
        return safe_divide(self.waste_kg, self.fiber_consumed_kg, Decimal("0")) * 100

    @property
    def efficiency_pct(self) -> Decimal:
        from core.utils import safe_divide
        if not self.planned_hours:
            return Decimal("0")
        productive = self.actual_hours - Decimal(self.downtime_minutes) / 60
        return safe_divide(productive, self.planned_hours, Decimal("0")) * 100
