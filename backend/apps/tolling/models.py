from decimal import Decimal
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from core.models import AuditedModel


class ContractStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ContractType(models.TextChoices):
    EXTERNAL = "external", "External Customer"
    INTERNAL = "internal", "Internal Transfer"


class TollingContract(AuditedModel):
    contract_number = models.CharField(max_length=50, unique=True, db_index=True)
    contract_date = models.DateField()
    contract_type = models.CharField(max_length=20, choices=ContractType.choices, default=ContractType.EXTERNAL)
    status = models.CharField(max_length=20, choices=ContractStatus.choices, default=ContractStatus.DRAFT)

    customer_name = models.CharField(max_length=200)
    customer_inn = models.CharField(max_length=20, blank=True)
    customer_address = models.TextField(blank=True)
    customer_contact_person = models.CharField(max_length=200, blank=True)
    customer_phone = models.CharField(max_length=50, blank=True)

    start_date = models.DateField()
    end_date = models.DateField()

    yarn_price_usd = models.DecimalField(max_digits=12, decimal_places=4)
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=4)

    processor_share_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    customer_share_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    loss_share_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    target_yarn_product = models.ForeignKey(
        "warehouse.Product", on_delete=models.PROTECT,
        related_name="tolling_contracts",
    )
    min_fiber_quality_grade = models.CharField(max_length=50, blank=True)
    max_waste_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    vat_included = models.BooleanField(default=True)
    advance_payment_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    payment_term_days = models.PositiveIntegerField(default=30)

    raw_material_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        null=True, blank=True, related_name="tolling_contracts_raw",
    )
    finished_goods_warehouse = models.ForeignKey(
        "warehouse.Warehouse", on_delete=models.PROTECT,
        null=True, blank=True, related_name="tolling_contracts_finished",
    )

    terms_and_conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "tolling_contracts"
        ordering = ["-contract_date", "-created_at"]

    def __str__(self):
        return f"{self.contract_number} — {self.customer_name}"

    def clean(self):
        total = (
            (self.processor_share_pct or Decimal("0"))
            + (self.customer_share_pct or Decimal("0"))
            + (self.loss_share_pct or Decimal("0"))
        )
        if total != Decimal("100.00"):
            raise ValidationError(
                {"processor_share_pct": f"Ulushlar jami 100% bo'lishi kerak. Hozir: {total}%"}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        today = timezone.now().date()
        return self.status == ContractStatus.ACTIVE and self.start_date <= today <= self.end_date

    @property
    def days_until_expiry(self):
        today = timezone.now().date()
        days = (self.end_date - today).days
        return max(days, 0)


class ReceiptStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    RECEIVED = "received", "Received"
    IN_PRODUCTION = "in_production", "In Production"
    COMPLETED = "completed", "Completed"


class TollingRawMaterialReceipt(AuditedModel):
    contract = models.ForeignKey(
        TollingContract, on_delete=models.PROTECT, related_name="raw_receipts"
    )
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    receipt_date = models.DateField()
    status = models.CharField(max_length=20, choices=ReceiptStatus.choices, default=ReceiptStatus.DRAFT)

    ttn_number = models.CharField(max_length=50, blank=True)
    ttn_date = models.DateField(null=True, blank=True)
    acceptance_act_number = models.CharField(max_length=50, blank=True)
    acceptance_act_date = models.DateField(null=True, blank=True)

    fiber_product = models.ForeignKey(
        "warehouse.Product", on_delete=models.PROTECT,
        limit_choices_to={"product_type": "fiber"},
    )
    quantity_kg = models.DecimalField(max_digits=14, decimal_places=3)
    moisture_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    impurity_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fiber_length_mm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    quality_grade = models.CharField(max_length=50, blank=True)

    supplier_name = models.CharField(max_length=200, blank=True)
    driver_name = models.CharField(max_length=200, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)

    received_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True,
        related_name="tolling_receipts_received",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "tolling_raw_receipts"
        ordering = ["-receipt_date", "-created_at"]

    def __str__(self):
        return f"{self.receipt_number} — {self.contract.customer_name}"


class DeliveryStatus(models.TextChoices):
    PENDING = "pending", "Topshirish kutilmoqda"
    READY = "ready", "Topshirish uchun tayyor"
    DELIVERED = "delivered", "Topshirildi"
    CANCELLED = "cancelled", "Bekor qilindi"


class TollingDelivery(AuditedModel):
    contract = models.ForeignKey(
        TollingContract, on_delete=models.PROTECT, related_name="deliveries"
    )
    yarn_batch = models.ForeignKey(
        "yarn_production.YarnBatch", on_delete=models.PROTECT, related_name="tolling_deliveries"
    )
    delivery_number = models.CharField(max_length=50, unique=True, db_index=True)
    delivery_date = models.DateField()
    status = models.CharField(max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING)
    quantity_kg = models.DecimalField(max_digits=14, decimal_places=3)

    delivery_act_number = models.CharField(max_length=50, blank=True)
    ttn_number = models.CharField(max_length=50, blank=True)
    quality_certificate_number = models.CharField(max_length=50, blank=True)

    yarn_count_actual = models.CharField(max_length=20, blank=True)
    strength_cn = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    twist_tpm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    moisture_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    recipient_name = models.CharField(max_length=200, blank=True)
    recipient_phone = models.CharField(max_length=50, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)
    driver_name = models.CharField(max_length=200, blank=True)

    delivered_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True,
        related_name="tolling_deliveries_issued",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "tolling_deliveries"
        ordering = ["-delivery_date", "-created_at"]

    def __str__(self):
        return f"{self.delivery_number} — {self.contract.customer_name}"


class InvoiceStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    ISSUED = "issued", "Yuborildi"
    PAID = "paid", "To'landi"
    PARTIALLY_PAID = "partially_paid", "Qisman to'landi"
    OVERDUE = "overdue", "Muddati o'tgan"
    CANCELLED = "cancelled", "Bekor qilindi"


class TollingInvoice(AuditedModel):
    contract = models.ForeignKey(
        TollingContract, on_delete=models.PROTECT, related_name="invoices"
    )
    yarn_batch = models.ForeignKey(
        "yarn_production.YarnBatch", on_delete=models.PROTECT, related_name="tolling_invoices"
    )
    delivery = models.ForeignKey(
        TollingDelivery, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices"
    )

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice_date = models.DateField()
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)

    base_amount = models.DecimalField(max_digits=20, decimal_places=4)
    vat_amount = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    total_amount = models.DecimalField(max_digits=20, decimal_places=4)
    paid_amount = models.DecimalField(max_digits=20, decimal_places=4, default=Decimal("0"))
    payment_due_date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "tolling_invoices"
        ordering = ["-invoice_date", "-created_at"]

    def __str__(self):
        return f"{self.invoice_number} — {self.contract.customer_name}"

    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount

    @property
    def is_overdue(self):
        today = timezone.now().date()
        return self.status not in [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] and today > self.payment_due_date
