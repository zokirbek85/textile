"""
Yarn-production service layer (Stage 2: Fiber → Yarn).

Yarn Cost Formula:
    yarn_cost_per_kg = (fiber_cost_total + Σ spinning_expenses) / yarn_output_kg
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import YarnBatch, YarnBatchExpense, BatchStatus
from apps.warehouse.services import issue_stock, receive_stock
from apps.warehouse.models import Warehouse, Product
from core.exceptions import BusinessLogicError, InsufficientStockError
from core.utils import safe_divide, round_money, generate_batch_code

logger = logging.getLogger(__name__)


def create_yarn_batch(
    *,
    start_date,
    yarn_product: Product,
    fiber_source_warehouse: Warehouse,
    yarn_target_warehouse: Warehouse,
    notes: str = "",
    user=None,
) -> YarnBatch:
    batch = YarnBatch.objects.create(
        batch_code=generate_batch_code("YB"),
        start_date=start_date,
        yarn_product=yarn_product,
        fiber_source_warehouse=fiber_source_warehouse,
        yarn_target_warehouse=yarn_target_warehouse,
        status=BatchStatus.IN_PROGRESS,
        notes=notes,
        created_by=user,
    )
    logger.info("Yarn batch created: %s | product=%s", batch.batch_code, yarn_product.name)
    return batch


def add_fiber_input(*, batch: YarnBatch, quantity_kg: Decimal, user=None) -> None:
    """Consume fiber from the fiber warehouse at its current avg cost."""
    if batch.status != BatchStatus.IN_PROGRESS:
        raise BusinessLogicError("Can only add fiber to an in-progress batch.")

    fiber_product = Product.objects.get(product_type="fiber", is_active=True)
    _, total_cost = issue_stock(
        warehouse=batch.fiber_source_warehouse,
        product=fiber_product,
        quantity_kg=quantity_kg,
        movement_date=timezone.now().date(),
        movement_type="production_consumption",
        reference_type="yarn_batch",
        reference_id=str(batch.id),
        user=user,
    )
    batch.fiber_input_kg += quantity_kg
    batch.fiber_cost_total += total_cost
    batch.save(update_fields=["fiber_input_kg", "fiber_cost_total"])
    logger.info("Fiber input: batch=%s qty=%s kg cost=%s", batch.batch_code, quantity_kg, total_cost)


def add_expense(
    *,
    batch: YarnBatch,
    category: str,
    amount: Decimal,
    expense_date,
    description: str = "",
    quantity=None,
    unit: str = "",
    user=None,
) -> YarnBatchExpense:
    if batch.status == BatchStatus.COMPLETED:
        raise BusinessLogicError("Cannot add expenses to a completed batch.")
    return YarnBatchExpense.objects.create(
        batch=batch,
        category=category,
        amount=amount,
        expense_date=expense_date,
        description=description,
        quantity=quantity,
        unit=unit,
        created_by=user,
    )


@transaction.atomic
def complete_yarn_batch(
    *,
    batch: YarnBatch,
    yarn_output_kg: Decimal,
    waste_output_kg: Decimal = Decimal("0"),
    efficiency_pct: Decimal = Decimal("0"),
    end_date=None,
    user=None,
) -> YarnBatch:
    """
    Finalise a yarn batch:
    1. Calculate yarn cost per kg.
    2. Post yarn into the yarn warehouse at the computed cost.
    3. Mark batch completed.
    """
    if batch.status != BatchStatus.IN_PROGRESS:
        raise BusinessLogicError("Only in-progress batches can be completed.")
    if yarn_output_kg <= 0:
        raise BusinessLogicError("Yarn output must be greater than zero.")

    total_expenses = sum((e.amount for e in batch.expenses.all()), Decimal("0"))

    net_cost = batch.fiber_cost_total + total_expenses
    yarn_cost_per_kg = safe_divide(net_cost, yarn_output_kg, Decimal("0"))
    yarn_cost_per_kg = round_money(yarn_cost_per_kg)

    waste_pct = safe_divide(waste_output_kg, batch.fiber_input_kg, Decimal("0")) * 100

    batch.yarn_output_kg = yarn_output_kg
    batch.waste_output_kg = waste_output_kg
    batch.waste_pct = round_money(waste_pct, 2)
    batch.efficiency_pct = round_money(efficiency_pct, 2)
    batch.total_spinning_expenses = total_expenses
    batch.calculated_yarn_cost_per_kg = yarn_cost_per_kg
    batch.end_date = end_date or timezone.now().date()
    batch.status = BatchStatus.COMPLETED
    batch.updated_by = user
    batch.save()

    # Post yarn into the target warehouse
    receive_stock(
        warehouse=batch.yarn_target_warehouse,
        product=batch.yarn_product,
        quantity_kg=yarn_output_kg,
        cost_per_kg=yarn_cost_per_kg,
        movement_date=batch.end_date,
        movement_type="production_output",
        reference_type="yarn_batch",
        reference_id=str(batch.id),
        user=user,
    )

    logger.info(
        "Yarn batch completed: %s | output=%s kg | cost/kg=%s",
        batch.batch_code, yarn_output_kg, yarn_cost_per_kg,
    )

    from apps.notifications.tasks import notify_batch_completed, check_cost_spike
    notify_batch_completed.delay(str(batch.id), "yarn")
    check_cost_spike.delay(str(batch.id), "yarn")

    return batch


def get_yarn_batch_cost_breakdown(batch: YarnBatch) -> dict:
    expenses_by_category = {}
    for exp in batch.expenses.all():
        expenses_by_category.setdefault(exp.category, Decimal("0"))
        expenses_by_category[exp.category] += exp.amount

    fiber_cost_per_kg = safe_divide(
        batch.fiber_cost_total, batch.fiber_input_kg, Decimal("0")
    )
    return {
        "batch_code": batch.batch_code,
        "status": batch.status,
        "yarn_product": batch.yarn_product.name if batch.yarn_product else None,
        "fiber_input_kg": batch.fiber_input_kg,
        "fiber_cost_total": batch.fiber_cost_total,
        "fiber_cost_per_kg": round_money(fiber_cost_per_kg),
        "expenses_by_category": expenses_by_category,
        "total_spinning_expenses": batch.total_spinning_expenses,
        "net_cost": batch.net_cost,
        "yarn_output_kg": batch.yarn_output_kg,
        "yarn_cost_per_kg": batch.calculated_yarn_cost_per_kg,
        "waste_output_kg": batch.waste_output_kg,
        "waste_pct": batch.waste_pct,
        "efficiency_pct": batch.efficiency_pct,
    }
