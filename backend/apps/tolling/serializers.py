from decimal import Decimal
from rest_framework import serializers
from .models import (
    TollingContract, TollingRawMaterialReceipt, TollingDelivery, TollingInvoice,
)


class TollingContractSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    contract_type_display = serializers.CharField(source="get_contract_type_display", read_only=True)
    target_yarn_product_name = serializers.CharField(source="target_yarn_product.name", read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    raw_material_warehouse_name = serializers.CharField(
        source="raw_material_warehouse.name", read_only=True
    )
    finished_goods_warehouse_name = serializers.CharField(
        source="finished_goods_warehouse.name", read_only=True
    )

    class Meta:
        model = TollingContract
        fields = [
            "id", "contract_number", "contract_date", "contract_type", "contract_type_display",
            "status", "status_display", "customer_name", "customer_inn", "customer_address",
            "customer_contact_person", "customer_phone",
            "start_date", "end_date", "days_until_expiry", "is_active",
            "yarn_price_usd", "exchange_rate",
            "processor_share_pct", "customer_share_pct", "loss_share_pct",
            "target_yarn_product", "target_yarn_product_name",
            "min_fiber_quality_grade", "max_waste_pct",
            "vat_included", "advance_payment_pct", "payment_term_days",
            "raw_material_warehouse", "raw_material_warehouse_name",
            "finished_goods_warehouse", "finished_goods_warehouse_name",
            "terms_and_conditions", "notes", "created_at",
        ]
        read_only_fields = [
            "id", "raw_material_warehouse", "finished_goods_warehouse", "created_at",
        ]

    def validate(self, attrs):
        total = (
            attrs.get("processor_share_pct", Decimal("0"))
            + attrs.get("customer_share_pct", Decimal("0"))
            + attrs.get("loss_share_pct", Decimal("0"))
        )
        if total != Decimal("100.00"):
            raise serializers.ValidationError(
                {"processor_share_pct": f"Ulushlar jami 100% bo'lishi kerak. Hozir: {total}%"}
            )
        return attrs


class TollingRawMaterialReceiptSerializer(serializers.ModelSerializer):
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True)
    customer_name = serializers.CharField(source="contract.customer_name", read_only=True)
    fiber_product_name = serializers.CharField(source="fiber_product.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    received_by_name = serializers.CharField(source="received_by.get_full_name", read_only=True)

    class Meta:
        model = TollingRawMaterialReceipt
        fields = [
            "id", "contract", "contract_number", "customer_name",
            "receipt_number", "receipt_date", "status", "status_display",
            "ttn_number", "ttn_date", "acceptance_act_number", "acceptance_act_date",
            "fiber_product", "fiber_product_name", "quantity_kg",
            "moisture_pct", "impurity_pct", "fiber_length_mm", "quality_grade",
            "supplier_name", "driver_name", "vehicle_number",
            "received_by", "received_by_name", "notes", "created_at",
        ]
        read_only_fields = ["id", "receipt_number", "status", "received_by", "created_at"]

    def create(self, validated_data):
        import datetime
        from apps.tolling.models import TollingRawMaterialReceipt as M
        year = datetime.datetime.now().year
        count = M.objects.filter(receipt_date__year=year).count() + 1
        validated_data["receipt_number"] = f"REC-{year}-{count:05d}"
        return super().create(validated_data)


class TollingDeliverySerializer(serializers.ModelSerializer):
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True)
    customer_name = serializers.CharField(source="contract.customer_name", read_only=True)
    batch_code = serializers.CharField(source="yarn_batch.batch_code", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TollingDelivery
        fields = [
            "id", "contract", "contract_number", "customer_name",
            "yarn_batch", "batch_code",
            "delivery_number", "delivery_date", "status", "status_display",
            "quantity_kg",
            "delivery_act_number", "ttn_number", "quality_certificate_number",
            "yarn_count_actual", "strength_cn", "twist_tpm", "moisture_pct",
            "recipient_name", "recipient_phone", "vehicle_number", "driver_name",
            "delivered_by", "notes", "created_at",
        ]
        read_only_fields = [
            "id", "delivery_number", "delivery_act_number",
            "ttn_number", "quality_certificate_number",
            "status", "delivered_by", "created_at",
        ]

    def create(self, validated_data):
        import datetime
        from apps.tolling.models import TollingDelivery as M
        year = datetime.datetime.now().year
        count = M.objects.filter(delivery_date__year=year).count() + 1
        validated_data["delivery_number"] = f"DEL-{year}-{count:05d}"
        return super().create(validated_data)


class TollingInvoiceSerializer(serializers.ModelSerializer):
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True)
    customer_name = serializers.CharField(source="contract.customer_name", read_only=True)
    batch_code = serializers.CharField(source="yarn_batch.batch_code", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    balance_due = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = TollingInvoice
        fields = [
            "id", "contract", "contract_number", "customer_name",
            "yarn_batch", "batch_code", "delivery",
            "invoice_number", "invoice_date", "status", "status_display",
            "base_amount", "vat_amount", "total_amount",
            "paid_amount", "balance_due", "is_overdue",
            "payment_due_date", "notes", "created_at",
        ]
        read_only_fields = ["id", "invoice_number", "status", "created_at"]
