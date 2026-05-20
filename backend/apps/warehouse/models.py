from django.db import models
from django.db.models import F
from decimal import Decimal
from core.models import AuditedModel, TimeStampedModel


class WarehouseType(models.TextChoices):
    COTTON = "cotton", "Cotton Warehouse"
    FIBER = "fiber", "Fiber Warehouse"
    WIP = "wip", "WIP Warehouse"
    YARN = "yarn", "Yarn Warehouse"
    WASTE = "waste", "Waste Warehouse"
    TOLLING_RAW = "tolling_raw_material", "Tolling Raw Material"
    TOLLING_FG = "tolling_finished_goods", "Tolling Finished Goods"
    OTHER = "other", "Other"


class Warehouse(AuditedModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    warehouse_type = models.CharField(max_length=25, choices=WarehouseType.choices)
    location = models.CharField(max_length=255, blank=True)
    capacity_kg = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "warehouses"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_warehouse_type_display()})"


class ProductCategory(TimeStampedModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "product_categories"
        verbose_name_plural = "product categories"

    def __str__(self):
        return self.name


class Product(AuditedModel):
    class ProductType(models.TextChoices):
        RAW_COTTON = "raw_cotton", "Raw Cotton"
        FIBER = "fiber", "Fiber"
        SEED = "seed", "Seed"
        LINT = "lint", "Lint"
        YARN = "yarn", "Yarn"
        WASTE = "waste", "Waste"
        OTHER = "other", "Other"

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    product_type = models.CharField(max_length=20, choices=ProductType.choices)
    category = models.ForeignKey(
        ProductCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    unit = models.CharField(max_length=20, default="kg")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    # Yarn-specific attributes (null for non-yarn products)
    yarn_count = models.CharField(max_length=20, blank=True, help_text="e.g. Ne20/1, Ne30/1")
    yarn_type = models.CharField(max_length=50, blank=True, help_text="Carded / Combed / Compact")

    class Meta:
        db_table = "products"

    def __str__(self):
        return f"{self.name} ({self.code})"


class StockLedger(TimeStampedModel):
    """
    Running balance + weighted-average cost per product per warehouse.
    One row per (warehouse, product) pair. Updated atomically on every movement.
    """
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="ledger_entries")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="ledger_entries")
    quantity_kg = models.DecimalField(max_digits=16, decimal_places=3, default=Decimal("0"))
    # Weighted-average cost per kg
    avg_cost_per_kg = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    total_value = models.DecimalField(max_digits=24, decimal_places=4, default=Decimal("0"))
    last_movement_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "stock_ledger"
        unique_together = [("warehouse", "product")]

    def __str__(self):
        return f"{self.warehouse.name} | {self.product.name} | {self.quantity_kg} kg"

    def apply_receipt(self, qty: Decimal, cost_per_kg: Decimal) -> None:
        """
        Moving weighted-average recalculation on every inbound movement.
        new_avg = (existing_value + new_qty * new_cost) / (existing_qty + new_qty)
        """
        from django.utils import timezone

        new_qty = self.quantity_kg + qty
        if new_qty <= 0:
            self.avg_cost_per_kg = Decimal("0")
            self.quantity_kg = Decimal("0")
            self.total_value = Decimal("0")
        else:
            new_value = self.total_value + (qty * cost_per_kg)
            self.avg_cost_per_kg = new_value / new_qty
            self.quantity_kg = new_qty
            self.total_value = new_value
        self.last_movement_at = timezone.now()
        self.save()

    def apply_issue(self, qty: Decimal) -> Decimal:
        """
        Deduct qty at current avg cost. Returns total cost of the issued qty.
        Raises ValueError if insufficient stock.
        """
        from django.utils import timezone
        from core.exceptions import InsufficientStockError

        if qty > self.quantity_kg:
            raise InsufficientStockError(
                str(self.product), float(self.quantity_kg), float(qty)
            )
        cost = qty * self.avg_cost_per_kg
        self.quantity_kg -= qty
        self.total_value = self.quantity_kg * self.avg_cost_per_kg
        self.last_movement_at = timezone.now()
        self.save()
        return cost


class MovementType(models.TextChoices):
    RECEIPT = "receipt", "Receipt (Inbound)"
    ISSUE = "issue", "Issue (Outbound)"
    TRANSFER_IN = "transfer_in", "Transfer In"
    TRANSFER_OUT = "transfer_out", "Transfer Out"
    PRODUCTION_OUTPUT = "production_output", "Production Output"
    PRODUCTION_CONSUMPTION = "production_consumption", "Production Consumption"
    ADJUSTMENT = "adjustment", "Adjustment"
    RETURN = "return", "Return"


class StockMovement(AuditedModel):
    """Immutable ledger of every stock transaction."""

    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="movements")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="movements")
    movement_type = models.CharField(max_length=30, choices=MovementType.choices)
    quantity_kg = models.DecimalField(max_digits=16, decimal_places=3)
    cost_per_kg = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    total_cost = models.DecimalField(max_digits=24, decimal_places=4, default=Decimal("0"))

    # Running balance snapshot after this movement
    balance_after = models.DecimalField(max_digits=16, decimal_places=3, default=Decimal("0"))

    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    movement_date = models.DateField(db_index=True)

    class Meta:
        db_table = "stock_movements"
        ordering = ["-movement_date", "-created_at"]
        indexes = [
            models.Index(fields=["warehouse", "product", "movement_date"]),
            models.Index(fields=["movement_type", "movement_date"]),
        ]

    def __str__(self):
        return (
            f"{self.get_movement_type_display()} | {self.product.name} "
            f"| {self.quantity_kg} kg | {self.movement_date}"
        )
