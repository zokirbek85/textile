from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions import IsProductionManager
from core.exceptions import BusinessLogicError, InsufficientStockError
from .models import YarnBatch, YarnShift
from .serializers import (
    YarnBatchSerializer, YarnBatchCreateSerializer,
    AddFiberInputSerializer, CompleteYarnBatchSerializer,
    YarnShiftSerializer, YarnBatchExpenseSerializer,
)
from . import services
from apps.cotton_production.serializers import AddExpenseSerializer


class YarnBatchViewSet(viewsets.ModelViewSet):
    queryset = YarnBatch.objects.prefetch_related("expenses").select_related(
        "yarn_product", "fiber_source_warehouse", "yarn_target_warehouse", "created_by"
    )
    serializer_class = YarnBatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "start_date", "yarn_product", "tolling_contract"]
    search_fields = ["batch_code", "notes"]
    ordering_fields = ["start_date", "yarn_output_kg", "calculated_yarn_cost_per_kg"]
    ordering = ["-start_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return YarnBatchCreateSerializer
        return YarnBatchSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy",
                           "add_fiber", "add_expense", "complete"):
            return [IsProductionManager()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = YarnBatchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        from apps.warehouse.models import Warehouse, Product
        try:
            yarn_product = Product.objects.get(id=d["yarn_product_id"])
            src = Warehouse.objects.get(id=d["fiber_source_warehouse_id"])
            tgt = Warehouse.objects.get(id=d["yarn_target_warehouse_id"])
        except (Warehouse.DoesNotExist, Product.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        batch = services.create_yarn_batch(
            start_date=d["start_date"],
            yarn_product=yarn_product,
            fiber_source_warehouse=src,
            yarn_target_warehouse=tgt,
            notes=d.get("notes", ""),
            user=request.user,
        )
        return Response(YarnBatchSerializer(batch).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="add-fiber")
    def add_fiber(self, request, pk=None):
        batch = self.get_object()
        serializer = AddFiberInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.add_fiber_input(
                batch=batch,
                quantity_kg=serializer.validated_data["quantity_kg"],
                user=request.user,
            )
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(YarnBatchSerializer(batch).data)

    @action(detail=True, methods=["post"], url_path="add-expense")
    def add_expense(self, request, pk=None):
        batch = self.get_object()
        serializer = AddExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.add_expense(batch=batch, user=request.user, **serializer.validated_data)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(YarnBatchSerializer(batch).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        batch = self.get_object()
        serializer = CompleteYarnBatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            batch = services.complete_yarn_batch(
                batch=batch, user=request.user, **serializer.validated_data
            )
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(YarnBatchSerializer(batch).data)

    @action(detail=True, methods=["get"], url_path="cost-breakdown")
    def cost_breakdown(self, request, pk=None):
        batch = self.get_object()
        return Response(services.get_yarn_batch_cost_breakdown(batch))

    @action(detail=True, methods=["post"], url_path="complete-tolling")
    def complete_tolling(self, request, pk=None):
        from apps.tolling.services import complete_tolling_yarn_batch
        batch = self.get_object()
        try:
            result = complete_tolling_yarn_batch(batch=batch, user=request.user)
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class YarnShiftViewSet(viewsets.ModelViewSet):
    queryset = YarnShift.objects.select_related(
        "batch", "machine", "operator"
    ).all()
    serializer_class = YarnShiftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["shift_date", "shift_type", "batch", "machine", "operator"]
    ordering_fields = ["shift_date", "yarn_produced_kg", "efficiency_pct"]
    ordering = ["-shift_date"]
