from django.db import models
from decimal import Decimal
from core.models import AuditedModel


class ExpenseCategory(models.TextChoices):
    RAW_MATERIAL = "raw_material", "Raw Material"
    ELECTRICITY = "electricity", "Electricity"
    GAS = "gas", "Gas"
    WATER = "water", "Water"
    SALARY = "salary", "Salary"
    AMORTIZATION = "amortization", "Amortization"
    REPAIR = "repair", "Repair & Maintenance"
    LOGISTICS = "logistics", "Logistics"
    LABORATORY = "laboratory", "Laboratory"
    OVERHEAD = "overhead", "Management Overhead"
    TAXES = "taxes", "Taxes"
    OTHER = "other", "Other Indirect Expenses"


class BatchStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class CottonBatch(AuditedModel):
    """
    Represents one cotton-to-fiber processing run.
    All cost inputs are attached here; fiber cost is calculated from them.
    """
    batch_code = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=BatchStatus.choices, default=BatchStatus.DRAFT)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    # Cotton input
    cotton_input_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    cotton_cost_total = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    cotton_source_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        related_name="cotton_batches_in", null=True, blank=True
    )

    # Outputs (filled when batch is completed)
    fiber_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    seed_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    lint_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    waste_output_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))

    # Byproduct credit values (seed + lint reduce fiber cost)
    seed_credit_value = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    lint_credit_value = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))

    # Destination warehouse for fiber output
    fiber_target_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        related_name="cotton_batches_out", null=True, blank=True
    )

    # Calculated costing results (populated by costing engine on completion)
    total_production_expenses = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    calculated_fiber_cost_per_kg = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    fiber_yield_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))

    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cotton_batches"
        ordering = ["-start_date", "-created_at"]

    def __str__(self):
        return f"Cotton Batch {self.batch_code} ({self.get_status_display()})"

    @property
    def total_byproduct_credit(self) -> Decimal:
        return self.seed_credit_value + self.lint_credit_value

    @property
    def net_cost(self) -> Decimal:
        """Total cotton cost + all production expenses − byproduct credits."""
        return self.cotton_cost_total + self.total_production_expenses - self.total_byproduct_credit


class CottonBatchExpense(AuditedModel):
    """One expense line item attached to a cotton batch."""
    batch = models.ForeignKey(CottonBatch, on_delete=models.CASCADE, related_name="expenses")
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices)
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=4)
    quantity = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True,
                                   help_text="e.g. kWh for electricity, m³ for gas")
    unit = models.CharField(max_length=20, blank=True)
    expense_date = models.DateField()

    class Meta:
        db_table = "cotton_batch_expenses"
        ordering = ["category", "expense_date"]

    def __str__(self):
        return f"{self.batch.batch_code} | {self.get_category_display()} | {self.amount}"


class Machine(AuditedModel):
    class MachineType(models.TextChoices):
        COTTON_GIN = "cotton_gin", "Cotton Gin"
        OPENER = "opener", "Opener"
        CLEANER = "cleaner", "Cleaner"
        CARDING = "carding", "Carding Machine"
        COMBING = "combing", "Combing Machine"
        DRAWING = "drawing", "Drawing Frame"
        ROVING = "roving", "Roving Frame"
        SPINNING = "spinning", "Ring Spinning Machine"
        WINDING = "winding", "Winding Machine"
        OTHER = "other", "Other"

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    machine_type = models.CharField(max_length=30, choices=MachineType.choices)
    manufacturer = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    year_of_manufacture = models.PositiveSmallIntegerField(null=True, blank=True)
    capacity_kg_per_hour = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "machines"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Shift(AuditedModel):
    class ShiftType(models.TextChoices):
        MORNING = "morning", "Morning (06:00-14:00)"
        AFTERNOON = "afternoon", "Afternoon (14:00-22:00)"
        NIGHT = "night", "Night (22:00-06:00)"

    shift_date = models.DateField(db_index=True)
    shift_type = models.CharField(max_length=20, choices=ShiftType.choices)
    batch = models.ForeignKey(
        CottonBatch, on_delete=models.CASCADE, related_name="shifts",
        null=True, blank=True
    )
    supervisor = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="supervised_shifts"
    )
    planned_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("8"))
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    cotton_processed_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    fiber_produced_kg = models.DecimalField(max_digits=14, decimal_places=3, default=Decimal("0"))
    downtime_minutes = models.PositiveIntegerField(default=0)
    downtime_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cotton_shifts"
        ordering = ["-shift_date", "shift_type"]

    def __str__(self):
        return f"{self.shift_date} {self.get_shift_type_display()}"

    @property
    def efficiency_pct(self) -> Decimal:
        from core.utils import safe_divide
        if not self.planned_hours:
            return Decimal("0")
        productive = self.actual_hours - Decimal(self.downtime_minutes) / 60
        return safe_divide(productive, self.planned_hours, Decimal("0")) * 100
