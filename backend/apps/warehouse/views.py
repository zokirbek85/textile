from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions import IsWarehouseManager, ReadOnlyOrAdmin
from .models import Warehouse, Product, ProductCategory, StockLedger, StockMovement
from .serializers import (
    WarehouseSerializer, ProductSerializer, ProductCategorySerializer,
    StockLedgerSerializer, StockMovementSerializer,
    StockReceiptSerializer, StockTransferSerializer,
)
from . import services


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["warehouse_type", "is_active"]
    search_fields = ["name", "code"]

    @action(detail=True, methods=["get"], url_path="balances")
    def balances(self, request, pk=None):
        warehouse = self.get_object()
        summary = services.get_warehouse_summary(warehouse)
        return Response(summary)

    @action(detail=False, methods=["post"], url_path="receive",
            permission_classes=[IsWarehouseManager])
    def receive(self, request):
        serializer = StockReceiptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            warehouse = Warehouse.objects.get(id=d["warehouse_id"])
            product = Product.objects.get(id=d["product_id"])
        except (Warehouse.DoesNotExist, Product.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        movement = services.receive_stock(
            warehouse=warehouse,
            product=product,
            quantity_kg=d["quantity_kg"],
            cost_per_kg=d["cost_per_kg"],
            movement_date=d["movement_date"],
            notes=d.get("notes", ""),
            user=request.user,
        )
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="transfer",
            permission_classes=[IsWarehouseManager])
    def transfer(self, request):
        serializer = StockTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            from_wh = Warehouse.objects.get(id=d["from_warehouse_id"])
            to_wh = Warehouse.objects.get(id=d["to_warehouse_id"])
            product = Product.objects.get(id=d["product_id"])
        except (Warehouse.DoesNotExist, Product.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        from core.exceptions import InsufficientStockError
        try:
            out_mv, in_mv = services.transfer_stock(
                from_warehouse=from_wh,
                to_warehouse=to_wh,
                product=product,
                quantity_kg=d["quantity_kg"],
                movement_date=d["movement_date"],
                notes=d.get("notes", ""),
                user=request.user,
            )
        except InsufficientStockError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "out_movement": StockMovementSerializer(out_mv).data,
            "in_movement": StockMovementSerializer(in_mv).data,
        }, status=status.HTTP_201_CREATED)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["product_type", "category", "is_active"]
    search_fields = ["name", "code", "yarn_count", "yarn_type"]
    ordering_fields = ["name", "code", "product_type"]


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [ReadOnlyOrAdmin]
    search_fields = ["name", "code"]


class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLedgerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["warehouse", "product"]
    search_fields = ["product__name", "warehouse__name"]
    ordering_fields = ["quantity_kg", "total_value", "avg_cost_per_kg"]

    def get_queryset(self):
        return (
            StockLedger.objects
            .select_related("warehouse", "product")
            .filter(quantity_kg__gt=0)
        )


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["warehouse", "product", "movement_type", "movement_date"]
    search_fields = ["product__name", "warehouse__name", "reference_id", "notes"]
    ordering_fields = ["movement_date", "quantity_kg", "total_cost", "created_at"]
    ordering = ["-movement_date"]

    def get_queryset(self):
        return (
            StockMovement.objects
            .select_related("warehouse", "product", "created_by")
            .all()
        )
