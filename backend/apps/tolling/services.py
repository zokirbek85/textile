from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.warehouse.models import Warehouse
from apps.warehouse.services import receive_stock, issue_stock
from core.utils import round_money
from .models import (
    TollingContract, TollingRawMaterialReceipt, TollingDelivery,
    TollingInvoice, ContractStatus, ReceiptStatus, DeliveryStatus, InvoiceStatus,
)


@transaction.atomic
def create_contract(*, data: dict, user) -> TollingContract:
    """Create a tolling contract and auto-create two dedicated warehouses."""
    # Strip warehouse FK fields — we set them after creation
    data_copy = {
        k: v for k, v in data.items()
        if k not in (
            "raw_material_warehouse", "raw_material_warehouse_id",
            "finished_goods_warehouse", "finished_goods_warehouse_id",
        )
    }
    contract = TollingContract(**data_copy, created_by=user)
    # Skip full_clean here because warehouses are null at this stage
    from django.db.models import Model
    Model.save(contract)

    # Auto-create dedicated warehouses for this contract
    raw_wh = Warehouse.objects.create(
        name=f"Daval Xom Ashyo — {contract.customer_name[:50]}",
        code=f"TOLL-RAW-{str(contract.id)[:8].upper()}",
        warehouse_type="tolling_raw_material",
        is_active=True,
        created_by=user,
    )
    fg_wh = Warehouse.objects.create(
        name=f"Daval Tayyor — {contract.customer_name[:50]}",
        code=f"TOLL-FG-{str(contract.id)[:8].upper()}",
        warehouse_type="tolling_finished_goods",
        is_active=True,
        created_by=user,
    )

    contract.raw_material_warehouse = raw_wh
    contract.finished_goods_warehouse = fg_wh
    contract.updated_by = user
    Model.save(contract)
    return contract


@transaction.atomic
def receive_raw_material(*, receipt: TollingRawMaterialReceipt, user) -> TollingRawMaterialReceipt:
    """Post raw material receipt into the contract's raw material warehouse."""
    if receipt.status == ReceiptStatus.RECEIVED:
        from core.exceptions import BusinessLogicError
        raise BusinessLogicError("Already received.")

    receive_stock(
        warehouse=receipt.contract.raw_material_warehouse,
        product=receipt.fiber_product,
        quantity_kg=receipt.quantity_kg,
        cost_per_kg=Decimal("0"),  # tolling: cost is 0 for processor
        movement_date=receipt.receipt_date,
        reference_type="tolling_receipt",
        reference_id=str(receipt.id),
        notes=receipt.notes,
        user=user,
    )
    receipt.status = ReceiptStatus.RECEIVED
    receipt.received_by = user
    receipt.updated_by = user
    receipt.save()
    return receipt


@transaction.atomic
def complete_tolling_yarn_batch(
    *,
    batch,
    yarn_output_kg: Decimal,
    waste_output_kg: Decimal = Decimal("0"),
    efficiency_pct: Decimal = Decimal("0"),
    end_date=None,
    user,
) -> dict:
    """
    Finalise a tolling yarn batch: calculate cost, split yarn output 3 ways,
    and calculate the service fee. batch must have tolling_contract set and
    not yet be COMPLETED.
    """
    from apps.yarn_production.models import BatchStatus
    from core.exceptions import BusinessLogicError
    from core.utils import round_money, round_weight, safe_divide

    if not batch.tolling_contract_id:
        raise BusinessLogicError("Not a tolling batch.")
    if batch.status == BatchStatus.COMPLETED:
        raise BusinessLogicError("Already completed.")
    if yarn_output_kg <= 0:
        raise BusinessLogicError("Yarn output must be greater than zero.")

    contract = batch.tolling_contract
    total_yarn = yarn_output_kg

    total_expenses = sum((e.amount for e in batch.expenses.all()), Decimal("0"))
    net_cost = batch.fiber_cost_total + total_expenses
    yarn_cost_per_kg = round_money(safe_divide(net_cost, total_yarn, Decimal("0")))
    waste_pct = round_money(safe_divide(waste_output_kg, batch.fiber_input_kg, Decimal("0")) * 100, 2)

    batch.yarn_output_kg = total_yarn
    batch.waste_output_kg = waste_output_kg
    batch.waste_pct = waste_pct
    batch.efficiency_pct = round_money(efficiency_pct, 2)
    batch.total_spinning_expenses = total_expenses
    batch.calculated_yarn_cost_per_kg = yarn_cost_per_kg

    # Three-way split
    processor_yarn = round_weight(total_yarn * contract.processor_share_pct / 100)
    customer_yarn = round_weight(total_yarn * contract.customer_share_pct / 100)
    loss_yarn = total_yarn - processor_yarn - customer_yarn  # rounding remainder goes here

    batch.processor_yarn_kg = processor_yarn
    batch.customer_yarn_kg = customer_yarn
    batch.loss_yarn_kg = loss_yarn

    # Service fee calculation
    if batch.fiber_input_kg and batch.fiber_input_kg > 0:
        service_fee_per_kg = round_money(
            contract.yarn_price_usd * processor_yarn * contract.exchange_rate / batch.fiber_input_kg
        )
    else:
        service_fee_per_kg = Decimal("0")

    total_service_fee = round_money(service_fee_per_kg * batch.fiber_input_kg)
    if contract.vat_included:
        total_with_vat = round_money(total_service_fee * Decimal("1.12"))
    else:
        total_with_vat = total_service_fee

    batch.service_fee_per_kg_fiber = service_fee_per_kg
    batch.total_service_fee = total_service_fee
    batch.total_service_fee_with_vat = total_with_vat

    today = end_date or timezone.now().date()

    # Processor share → self yarn warehouse
    if processor_yarn > 0:
        try:
            self_wh = Warehouse.objects.get(code="WH-YARN-SELF")
        except Warehouse.DoesNotExist:
            self_wh = Warehouse.objects.filter(warehouse_type="yarn").first()
        if self_wh:
            receive_stock(
                warehouse=self_wh,
                product=batch.yarn_product,
                quantity_kg=processor_yarn,
                cost_per_kg=batch.calculated_yarn_cost_per_kg,
                movement_date=today,
                reference_type="yarn_batch",
                reference_id=str(batch.id),
                notes="Tolling - processor share",
                user=user,
            )

    # Customer share → contract finished goods warehouse
    if customer_yarn > 0:
        receive_stock(
            warehouse=contract.finished_goods_warehouse,
            product=batch.yarn_product,
            quantity_kg=customer_yarn,
            cost_per_kg=Decimal("0"),
            movement_date=today,
            reference_type="yarn_batch",
            reference_id=str(batch.id),
            notes="Tolling - customer share",
            user=user,
        )

    batch.status = BatchStatus.COMPLETED
    batch.end_date = today
    batch.updated_by = user
    batch.save()

    return {
        "batch_id": str(batch.id),
        "processor_yarn_kg": str(processor_yarn),
        "customer_yarn_kg": str(customer_yarn),
        "loss_yarn_kg": str(loss_yarn),
        "service_fee_per_kg_fiber": str(service_fee_per_kg),
        "total_service_fee": str(total_service_fee),
        "total_service_fee_with_vat": str(total_with_vat),
    }


@transaction.atomic
def create_delivery(*, data: dict, user) -> TollingDelivery:
    """Create a delivery and auto-assign document numbers."""
    import datetime
    year = datetime.datetime.now().year
    count = TollingDelivery.objects.filter(delivery_date__year=year).count() + 1
    delivery_data = {k: v for k, v in data.items() if k != "delivery_number"}
    delivery = TollingDelivery.objects.create(
        **delivery_data,
        delivery_number=f"DEM-DEL-{year}-{count:05d}",
        delivery_act_number=f"AKT-{year}-{count:05d}",
        ttn_number=f"TTN-{year}-{count:05d}",
        quality_certificate_number=f"CERT-{year}-{count:05d}",
        status=DeliveryStatus.PENDING,
        created_by=user,
    )
    return delivery


@transaction.atomic
def complete_delivery(*, delivery: TollingDelivery, user) -> dict:
    """Issue stock from finished goods warehouse and create invoice."""
    from core.exceptions import BusinessLogicError
    if delivery.status == DeliveryStatus.DELIVERED:
        raise BusinessLogicError("Already delivered.")

    issue_stock(
        warehouse=delivery.contract.finished_goods_warehouse,
        product=delivery.yarn_batch.yarn_product,
        quantity_kg=delivery.quantity_kg,
        movement_date=delivery.delivery_date,
        reference_type="tolling_delivery",
        reference_id=str(delivery.id),
        notes=f"Delivery #{delivery.delivery_number}",
        user=user,
    )

    delivery.status = DeliveryStatus.DELIVERED
    delivery.delivered_by = user
    delivery.updated_by = user
    delivery.save()

    # Auto-generate invoice
    import datetime
    from datetime import timedelta
    year = datetime.datetime.now().year
    count = TollingInvoice.objects.filter(invoice_date__year=year).count() + 1
    proportion = Decimal("0")
    if delivery.yarn_batch.customer_yarn_kg:
        proportion = min(
            Decimal("1"),
            delivery.quantity_kg / delivery.yarn_batch.customer_yarn_kg,
        )
    total_amount = round_money(delivery.yarn_batch.total_service_fee_with_vat * proportion)
    base_amount = round_money(delivery.yarn_batch.total_service_fee * proportion)
    vat_amount = total_amount - base_amount
    invoice = TollingInvoice.objects.create(
        contract=delivery.contract,
        yarn_batch=delivery.yarn_batch,
        delivery=delivery,
        invoice_number=f"INV-{year}-{count:05d}",
        invoice_date=delivery.delivery_date,
        base_amount=base_amount,
        vat_amount=vat_amount,
        total_amount=total_amount,
        payment_due_date=delivery.delivery_date + timedelta(days=delivery.contract.payment_term_days),
        status=InvoiceStatus.ISSUED,
        created_by=user,
    )

    return {"delivery": delivery, "invoice": invoice}


def get_contract_statistics(contract_id: str) -> dict:
    """Aggregate statistics for a tolling contract."""
    from django.db.models import Sum
    contract = TollingContract.objects.get(id=contract_id)

    total_received = (
        contract.raw_receipts.filter(status=ReceiptStatus.RECEIVED)
        .aggregate(t=Sum("quantity_kg"))["t"] or Decimal("0")
    )

    batches = contract.yarn_batches.filter(status="completed")
    total_yarn = batches.aggregate(t=Sum("yarn_output_kg"))["t"] or Decimal("0")
    total_customer_yarn = batches.aggregate(t=Sum("customer_yarn_kg"))["t"] or Decimal("0")
    total_service_fee = batches.aggregate(t=Sum("total_service_fee_with_vat"))["t"] or Decimal("0")

    total_paid = contract.invoices.aggregate(t=Sum("paid_amount"))["t"] or Decimal("0")

    return {
        "total_fiber_received_kg": str(total_received),
        "total_yarn_produced_kg": str(total_yarn),
        "total_customer_yarn_kg": str(total_customer_yarn),
        "total_service_fee": str(total_service_fee),
        "total_paid": str(total_paid),
        "balance_due": str(total_service_fee - total_paid),
        "days_until_expiry": contract.days_until_expiry,
    }
