from decimal import Decimal
from rest_framework import serializers
from .models import Warehouse, Product, ProductCategory, StockLedger, StockMovement


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["id", "name", "code", "description", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "code", "product_type", "product_type_display",
            "category", "category_name", "unit", "description",
            "yarn_count", "yarn_type", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WarehouseSerializer(serializers.ModelSerializer):
    warehouse_type_display = serializers.CharField(source="get_warehouse_type_display", read_only=True)
    total_stock_value = serializers.SerializerMethodField()
    total_quantity_kg = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = [
            "id", "name", "code", "warehouse_type", "warehouse_type_display",
            "location", "capacity_kg", "is_active", "notes",
            "total_stock_value", "total_quantity_kg", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_total_stock_value(self, obj):
        from django.db.models import Sum
        result = StockLedger.objects.filter(warehouse=obj).aggregate(total=Sum("total_value"))
        return result["total"] or 0

    def get_total_quantity_kg(self, obj):
        from django.db.models import Sum
        result = StockLedger.objects.filter(warehouse=obj).aggregate(total=Sum("quantity_kg"))
        return result["total"] or 0


class StockLedgerSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.code", read_only=True)
    product_type = serializers.CharField(source="product.product_type", read_only=True)

    class Meta:
        model = StockLedger
        fields = [
            "id", "warehouse", "warehouse_name", "product", "product_name",
            "product_code", "product_type", "quantity_kg", "avg_cost_per_kg",
            "total_value", "last_movement_at", "updated_at",
        ]
        read_only_fields = fields


class StockMovementSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    movement_type_display = serializers.CharField(source="get_movement_type_display", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "warehouse", "warehouse_name", "product", "product_name",
            "movement_type", "movement_type_display", "quantity_kg",
            "cost_per_kg", "total_cost", "balance_after",
            "reference_type", "reference_id", "notes", "movement_date",
            "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "total_cost", "balance_after", "created_at"]


class StockReceiptSerializer(serializers.Serializer):
    """Input serializer for the receive-stock action."""
    warehouse_id = serializers.UUIDField()
    product_id = serializers.UUIDField()
    quantity_kg = serializers.DecimalField(max_digits=16, decimal_places=3, min_value=Decimal("0.001"))
    cost_per_kg = serializers.DecimalField(max_digits=20, decimal_places=4, min_value=Decimal("0"))
    movement_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)


class StockTransferSerializer(serializers.Serializer):
    from_warehouse_id = serializers.UUIDField()
    to_warehouse_id = serializers.UUIDField()
    product_id = serializers.UUIDField()
    quantity_kg = serializers.DecimalField(max_digits=16, decimal_places=3, min_value=Decimal("0.001"))
    movement_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["from_warehouse_id"] == attrs["to_warehouse_id"]:
            raise serializers.ValidationError("Source and destination warehouses must differ.")
        return attrs

