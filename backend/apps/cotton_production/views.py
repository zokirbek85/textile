from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions import IsProductionManager
from core.exceptions import BusinessLogicError, InsufficientStockError
from .models import CottonBatch, Machine, Shift
from .serializers import (
    CottonBatchSerializer, CottonBatchCreateSerializer,
    AddCottonInputSerializer, AddExpenseSerializer, CompleteBatchSerializer,
    MachineSerializer, ShiftSerializer,
)
from . import services


class CottonBatchViewSet(viewsets.ModelViewSet):
    queryset = CottonBatch.objects.prefetch_related("expenses").select_related(
        "cotton_source_warehouse", "fiber_target_warehouse", "created_by"
    )
    serializer_class = CottonBatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "start_date", "end_date"]
    search_fields = ["batch_code", "notes"]
    ordering_fields = ["start_date", "created_at", "fiber_output_kg"]
    ordering = ["-start_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return CottonBatchCreateSerializer
        return CottonBatchSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy",
                           "add_cotton", "add_expense", "complete"):
            return [IsProductionManager()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = CottonBatchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        from apps.warehouse.models import Warehouse
        try:
            src = Warehouse.objects.get(id=d["cotton_source_warehouse_id"])
            tgt = Warehouse.objects.get(id=d["fiber_target_warehouse_id"])
        except Warehouse.DoesNotExist as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        batch = services.create_batch(
            start_date=d["start_date"],
            cotton_source_warehouse=src,
            fiber_target_warehouse=tgt,
            notes=d.get("notes", ""),
            user=request.user,
        )
        return Response(CottonBatchSerializer(batch).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="add-cotton")
    def add_cotton(self, request, pk=None):
        batch = self.get_object()
        serializer = AddCottonInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        from apps.warehouse.models import Product
        try:
            product = Product.objects.get(id=d["product_id"])
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            services.add_cotton_input(
                batch=batch, product=product,
                quantity_kg=d["quantity_kg"], user=request.user,
            )
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CottonBatchSerializer(batch).data)

    @action(detail=True, methods=["post"], url_path="add-expense")
    def add_expense(self, request, pk=None):
        batch = self.get_object()
        serializer = AddExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            services.add_expense(batch=batch, user=request.user, **d)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CottonBatchSerializer(batch).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        batch = self.get_object()
        serializer = CompleteBatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            batch = services.complete_batch(batch=batch, user=request.user, **serializer.validated_data)
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CottonBatchSerializer(batch).data)

    @action(detail=True, methods=["get"], url_path="cost-breakdown")
    def cost_breakdown(self, request, pk=None):
        batch = self.get_object()
        return Response(services.get_batch_cost_breakdown(batch))


class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.filter(is_active=True)
    serializer_class = MachineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["machine_type", "is_active"]
    search_fields = ["name", "code", "manufacturer"]


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related("batch", "supervisor").all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["shift_date", "shift_type", "batch"]
    search_fields = ["notes"]
    ordering_fields = ["shift_date", "fiber_produced_kg"]
    ordering = ["-shift_date"]
