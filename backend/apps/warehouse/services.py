"""
Warehouse service layer — all stock mutations go through here.
Views MUST NOT touch StockLedger or StockMovement directly.
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import Warehouse, Product, StockLedger, StockMovement, MovementType
from core.exceptions import InsufficientStockError

logger = logging.getLogger(__name__)


def _get_or_create_ledger(warehouse: Warehouse, product: Product) -> StockLedger:
    ledger, _ = StockLedger.objects.get_or_create(
        warehouse=warehouse,
        product=product,
        defaults={"quantity_kg": Decimal("0"), "avg_cost_per_kg": Decimal("0"), "total_value": Decimal("0")},
    )
    return ledger


@transaction.atomic
def receive_stock(
    *,
    warehouse: Warehouse,
    product: Product,
    quantity_kg: Decimal,
    cost_per_kg: Decimal,
    movement_date,
    reference_type: str = "",
    reference_id: str = "",
    notes: str = "",
    user=None,
) -> StockMovement:
    """Record an inbound stock receipt and update weighted-average cost."""
    ledger = _get_or_create_ledger(warehouse, product)
    ledger.apply_receipt(quantity_kg, cost_per_kg)

    movement = StockMovement.objects.create(
        warehouse=warehouse,
        product=product,
        movement_type=MovementType.RECEIPT,
        quantity_kg=quantity_kg,
        cost_per_kg=cost_per_kg,
        total_cost=quantity_kg * cost_per_kg,
        balance_after=ledger.quantity_kg,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        movement_date=movement_date,
        created_by=user,
    )
    logger.info("RECEIPT | warehouse=%s | product=%s | qty=%s kg | cost=%s/kg",
                warehouse.code, product.code, quantity_kg, cost_per_kg)
    return movement


@transaction.atomic
def issue_stock(
    *,
    warehouse: Warehouse,
    product: Product,
    quantity_kg: Decimal,
    movement_date,
    movement_type: str = MovementType.ISSUE,
    reference_type: str = "",
    reference_id: str = "",
    notes: str = "",
    user=None,
) -> tuple[StockMovement, Decimal]:
    """
    Deduct stock at weighted-average cost.
    Returns (movement, total_cost_issued).
    Raises InsufficientStockError if balance < quantity_kg.
    """
    ledger = _get_or_create_ledger(warehouse, product)
    cost_per_kg = ledger.avg_cost_per_kg
    total_cost = ledger.apply_issue(quantity_kg)  # raises if insufficient

    movement = StockMovement.objects.create(
        warehouse=warehouse,
        product=product,
        movement_type=movement_type,
        quantity_kg=quantity_kg,
        cost_per_kg=cost_per_kg,
        total_cost=total_cost,
        balance_after=ledger.quantity_kg,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        movement_date=movement_date,
        created_by=user,
    )
    logger.info("ISSUE | warehouse=%s | product=%s | qty=%s kg | cost=%s total",
                warehouse.code, product.code, quantity_kg, total_cost)
    return movement, total_cost


@transaction.atomic
def transfer_stock(
    *,
    from_warehouse: Warehouse,
    to_warehouse: Warehouse,
    product: Product,
    quantity_kg: Decimal,
    movement_date,
    notes: str = "",
    user=None,
) -> tuple[StockMovement, StockMovement]:
    """Transfer between warehouses — atomic pair of out + in movements."""
    out_movement, total_cost = issue_stock(
        warehouse=from_warehouse,
        product=product,
        quantity_kg=quantity_kg,
        movement_date=movement_date,
        movement_type=MovementType.TRANSFER_OUT,
        reference_type="transfer",
        notes=notes,
        user=user,
    )
    cost_per_kg = out_movement.cost_per_kg
    in_movement = receive_stock(
        warehouse=to_warehouse,
        product=product,
        quantity_kg=quantity_kg,
        cost_per_kg=cost_per_kg,
        movement_date=movement_date,
        movement_type=MovementType.TRANSFER_IN,
        reference_type="transfer",
        reference_id=str(out_movement.id),
        notes=notes,
        user=user,
    )
    return out_movement, in_movement


def get_stock_balance(warehouse: Warehouse, product: Product) -> dict:
    ledger = _get_or_create_ledger(warehouse, product)
    return {
        "warehouse": warehouse.name,
        "product": product.name,
        "quantity_kg": ledger.quantity_kg,
        "avg_cost_per_kg": ledger.avg_cost_per_kg,
        "total_value": ledger.total_value,
    }


def get_warehouse_summary(warehouse: Warehouse) -> list[dict]:
    return list(
        StockLedger.objects.filter(warehouse=warehouse, quantity_kg__gt=0)
        .select_related("product")
        .values(
            "product__name", "product__code", "product__product_type",
            "quantity_kg", "avg_cost_per_kg", "total_value", "last_movement_at",
        )
    )
