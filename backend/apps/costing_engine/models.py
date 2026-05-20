from django.db import models
from decimal import Decimal
from core.models import TimeStampedModel


class CostSnapshot(TimeStampedModel):
    """
    Immutable point-in-time cost record.
    Created each time a batch is completed to support trend analysis.
    """
    class ProductionStage(models.TextChoices):
        COTTON_TO_FIBER = "cotton_to_fiber", "Cotton → Fiber"
        FIBER_TO_YARN = "fiber_to_yarn", "Fiber → Yarn"

    stage = models.CharField(max_length=20, choices=ProductionStage.choices)
    reference_type = models.CharField(max_length=50)  # "cotton_batch" | "yarn_batch"
    reference_id = models.UUIDField(db_index=True)
    snapshot_date = models.DateField(db_index=True)

    # Input metrics
    input_kg = models.DecimalField(max_digits=14, decimal_places=3)
    input_cost = models.DecimalField(max_digits=20, decimal_places=4)

    # Output metrics
    output_kg = models.DecimalField(max_digits=14, decimal_places=3)
    output_cost_per_kg = models.DecimalField(max_digits=20, decimal_places=4)
    total_output_cost = models.DecimalField(max_digits=20, decimal_places=4)

    # Expenses breakdown (JSON)
    expenses_breakdown = models.JSONField(default=dict)

    # Yield / waste metrics
    yield_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    waste_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))

    product = models.ForeignKey(
        "warehouse.Product", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "cost_snapshots"
        ordering = ["-snapshot_date", "-created_at"]
        indexes = [
            models.Index(fields=["stage", "snapshot_date"]),
            models.Index(fields=["product", "snapshot_date"]),
        ]

    def __str__(self):
        return f"{self.get_stage_display()} | {self.snapshot_date} | {self.output_cost_per_kg}/kg"
