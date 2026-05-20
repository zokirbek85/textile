"""
Cotton-to-fiber production service layer.

Fiber Cost Formula:
    fiber_cost_per_kg = (cotton_cost + Σ expenses - Σ byproduct_credits) / fiber_output_kg
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import CottonBatch, CottonBatchExpense, BatchStatus
from apps.warehouse.services import issue_stock, receive_stock
from apps.warehouse.models import Warehouse, Product
from core.exceptions import BusinessLogicError
from core.utils import safe_divide, round_money, generate_batch_code

logger = logging.getLogger(__name__)


def create_batch(*, start_date, cotton_source_warehouse: Warehouse,
                 fiber_target_warehouse: Warehouse, notes: str = "", user=None) -> CottonBatch:
    batch = CottonBatch.objects.create(
        batch_code=generate_batch_code("CB"),
        start_date=start_date,
        cotton_source_warehouse=cotton_source_warehouse,
        fiber_target_warehouse=fiber_target_warehouse,
        status=BatchStatus.IN_PROGRESS,
        notes=notes,
        created_by=user,
    )
    logger.info("Cotton batch created: %s", batch.batch_code)
    return batch


def add_cotton_input(*, batch: CottonBatch, product: Product,
                     quantity_kg: Decimal, user=None) -> None:
    """
    Consume cotton from the source warehouse and record it as batch input.
    The warehouse avg-cost at time of issue becomes the cotton raw material cost.
    """
    if batch.status != BatchStatus.IN_PROGRESS:
        raise BusinessLogicError("Can only add cotton to an in-progress batch.")

    _, total_cost = issue_stock(
        warehouse=batch.cotton_source_warehouse,
        product=product,
        quantity_kg=quantity_kg,
        movement_date=timezone.now().date(),
        movement_type="production_consumption",
        reference_type="cotton_batch",
        reference_id=str(batch.id),
        user=user,
    )
    batch.cotton_input_kg += quantity_kg
    batch.cotton_cost_total += total_cost
    batch.save(update_fields=["cotton_input_kg", "cotton_cost_total"])
    logger.info("Cotton input: batch=%s qty=%s kg cost=%s", batch.batch_code, quantity_kg, total_cost)


def add_expense(*, batch: CottonBatch, category: str, amount: Decimal,
                expense_date, description: str = "",
                quantity=None, unit: str = "", user=None) -> CottonBatchExpense:
    if batch.status == BatchStatus.COMPLETED:
        raise BusinessLogicError("Cannot add expenses to a completed batch.")
    expense = CottonBatchExpense.objects.create(
        batch=batch,
        category=category,
        amount=amount,
        expense_date=expense_date,
        description=description,
        quantity=quantity,
        unit=unit,
        created_by=user,
    )
    logger.info("Expense added: batch=%s category=%s amount=%s", batch.batch_code, category, amount)
    return expense


@transaction.atomic
def complete_batch(
    *,
    batch: CottonBatch,
    fiber_output_kg: Decimal,
    seed_output_kg: Decimal = Decimal("0"),
    lint_output_kg: Decimal = Decimal("0"),
    waste_output_kg: Decimal = Decimal("0"),
    seed_credit_value: Decimal = Decimal("0"),
    lint_credit_value: Decimal = Decimal("0"),
    end_date=None,
    user=None,
) -> CottonBatch:
    """
    Finalise a cotton batch:
    1. Compute fiber cost per kg using the formula.
    2. Issue fiber into the fiber warehouse at the calculated cost.
    3. Mark batch as completed.
    """
    if batch.status != BatchStatus.IN_PROGRESS:
        raise BusinessLogicError("Only in-progress batches can be completed.")
    if fiber_output_kg <= 0:
        raise BusinessLogicError("Fiber output must be greater than zero.")

    # Sum all recorded expenses
    total_expenses = sum(
        (e.amount for e in batch.expenses.all()), Decimal("0")
    )

    # Core formula
    net_cost = batch.cotton_cost_total + total_expenses - seed_credit_value - lint_credit_value
    fiber_cost_per_kg = safe_divide(net_cost, fiber_output_kg, Decimal("0"))
    fiber_cost_per_kg = round_money(fiber_cost_per_kg)

    # Yield %
    yield_pct = safe_divide(fiber_output_kg, batch.cotton_input_kg, Decimal("0")) * 100

    # Update batch record
    batch.fiber_output_kg = fiber_output_kg
    batch.seed_output_kg = seed_output_kg
    batch.lint_output_kg = lint_output_kg
    batch.waste_output_kg = waste_output_kg
    batch.seed_credit_value = seed_credit_value
    batch.lint_credit_value = lint_credit_value
    batch.total_production_expenses = total_expenses
    batch.calculated_fiber_cost_per_kg = fiber_cost_per_kg
    batch.fiber_yield_pct = round_money(yield_pct, 2)
    batch.end_date = end_date or timezone.now().date()
    batch.status = BatchStatus.COMPLETED
    batch.updated_by = user
    batch.save()

    # Deposit fiber into the fiber warehouse
    fiber_product = Product.objects.get(product_type="fiber", is_active=True)
    receive_stock(
        warehouse=batch.fiber_target_warehouse,
        product=fiber_product,
        quantity_kg=fiber_output_kg,
        cost_per_kg=fiber_cost_per_kg,
        movement_date=batch.end_date,
        movement_type="production_output",
        reference_type="cotton_batch",
        reference_id=str(batch.id),
        user=user,
    )

    logger.info(
        "Cotton batch completed: %s | fiber=%s kg | cost/kg=%s",
        batch.batch_code, fiber_output_kg, fiber_cost_per_kg,
    )

    # Fire async notifications (non-blocking — failures don't roll back the transaction)
    from apps.notifications.tasks import notify_batch_completed, check_cost_spike
    notify_batch_completed.delay(str(batch.id), "cotton")
    check_cost_spike.delay(str(batch.id), "cotton")

    return batch


def get_batch_cost_breakdown(batch: CottonBatch) -> dict:
    """Return a structured cost breakdown for reporting / API."""
    expenses_by_category = {}
    for exp in batch.expenses.all():
        expenses_by_category.setdefault(exp.category, Decimal("0"))
        expenses_by_category[exp.category] += exp.amount

    return {
        "batch_code": batch.batch_code,
        "status": batch.status,
        "cotton_input_kg": batch.cotton_input_kg,
        "cotton_cost_total": batch.cotton_cost_total,
        "expenses_by_category": expenses_by_category,
        "total_expenses": batch.total_production_expenses,
        "byproduct_credits": batch.total_byproduct_credit,
        "net_cost": batch.net_cost,
        "fiber_output_kg": batch.fiber_output_kg,
        "fiber_cost_per_kg": batch.calculated_fiber_cost_per_kg,
        "fiber_yield_pct": batch.fiber_yield_pct,
    }
