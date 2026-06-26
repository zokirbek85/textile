from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter

from core.permissions import IsProductionManager, IsAdminOrDirector
from core.exceptions import BusinessLogicError
from .models import (
    ProductionLine, ProductionOrder, ProductionBatch, ProductionShiftReport,
)
from .serializers import (
    ProductionLineSerializer, ProductionLineUtilizationSerializer,
    ProductionOrderSerializer, ProductionOrderCreateSerializer,
    ProductionBatchSerializer, ProductionBatchCreateSerializer,
    QCUpdateSerializer, BatchTraceabilitySerializer,
    ProductionShiftReportSerializer, ProductionShiftReportCreateSerializer,
    ProductionDashboardSerializer,
)
from . import services


class ProductionLineViewSet(viewsets.ModelViewSet):
    queryset = ProductionLine.objects.all().order_by("factory", "name")
    serializer_class = ProductionLineSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["factory", "line_type", "is_active"]
    search_fields = ["name", "code", "equipment_model"]
    ordering_fields = ["name", "capacity_per_hour"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["get"], url_path="utilization")
    def utilization(self, request, pk=None):
        line = self.get_object()
        orders_qs = ProductionOrder.objects.all().filter(
            production_line=line,
            status__in=["approved", "in_progress"],
        )
        from django.db.models import Sum
        planned_hours = orders_qs.count() * 12  # rough estimate
        capacity_day = float(line.capacity_per_hour) * 24
        utilization = round(
            sum(
                float(o.planned_output_kg) / capacity_day * 100
                for o in orders_qs
            ) / max(orders_qs.count(), 1),
            2,
        )
        return Response({
            "line_id": str(line.id),
            "line_name": line.name,
            "orders_in_progress": orders_qs.filter(status="in_progress").count(),
            "planned_hours": planned_hours,
            "utilization_pct": utilization,
        })

    @action(detail=True, methods=["get"], url_path="schedule")
    def schedule(self, request, pk=None):
        line = self.get_object()
        orders = (
            ProductionOrder.objects.all()
            .filter(production_line=line)
            .exclude(status="cancelled")
            .order_by("planned_start_date")
            .select_related("input_product", "output_product", "supervisor")
        )
        serializer = ProductionOrderSerializer(orders, many=True)
        return Response(serializer.data)


class ProductionOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        ProductionOrder.objects.all()
        .select_related(
            "input_product", "output_product", "production_line",
            "supervisor", "approved_by", "tolling_contract",
        )
        .prefetch_related("batches")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "status", "order_type", "production_line", "shift", "brigade",
        "supervisor", "tolling_contract",
    ]
    search_fields = ["order_number", "notes"]
    ordering_fields = ["planned_start_date", "planned_output_kg", "created_at"]
    ordering = ["-planned_start_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return ProductionOrderCreateSerializer
        return ProductionOrderSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy",
                           "approve", "cancel"):
            return [IsProductionManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        order = self.get_object()
        try:
            order = services.approve_production_order(order, request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        order = self.get_object()
        try:
            order = services.start_production_order(order, request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        order = self.get_object()
        try:
            order = services.complete_production_order(order, request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get("reason", "")
        try:
            order = services.cancel_production_order(order, request.user, reason)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionOrderSerializer(order).data)

    @action(detail=True, methods=["get"])
    def batches(self, request, pk=None):
        order = self.get_object()
        qs = order.batches.all().select_related("output_product", "qc_checked_by")
        serializer = ProductionBatchSerializer(qs, many=True)
        return Response(serializer.data)


class ProductionBatchViewSet(viewsets.ModelViewSet):
    queryset = (
        ProductionBatch.objects.all()
        .select_related(
            "production_order", "output_product", "qc_checked_by",
        )
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "production_order", "shift", "brigade", "production_date"]
    search_fields = ["batch_number", "machine_number", "pallet_number"]
    ordering_fields = ["production_date", "quantity_kg", "created_at"]
    ordering = ["-production_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return ProductionBatchCreateSerializer
        return ProductionBatchSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "qc_update"):
            return [IsProductionManager()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="qc-update")
    def qc_update(self, request, pk=None):
        batch = self.get_object()
        serializer = QCUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            batch = services.update_batch_qc(
                batch=batch,
                user=request.user,
                **serializer.validated_data,
            )
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionBatchSerializer(batch).data)

    @action(detail=True, methods=["get"], url_path="traceability")
    def traceability(self, request, pk=None):
        batch = self.get_object()
        data = services.get_batch_traceability(batch)
        return Response(data)


class ProductionShiftReportViewSet(viewsets.ModelViewSet):
    queryset = (
        ProductionShiftReport.objects.all()
        .select_related(
            "production_line", "supervisor", "approved_by",
        )
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        "production_line", "shift_date", "shift", "brigade", "supervisor", "status"
    ]
    search_fields = ["report_number", "notes"]
    ordering_fields = ["shift_date", "total_output_kg", "conversion_rate"]
    ordering = ["-shift_date"]

    def get_serializer_class(self):
        if self.action == "create":
            return ProductionShiftReportCreateSerializer
        return ProductionShiftReportSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "submit"):
            return [IsProductionManager()]
        if self.action == "approve":
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        report = self.get_object()
        try:
            report = services.submit_shift_report(report, request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionShiftReportSerializer(report).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        report = self.get_object()
        try:
            report = services.approve_shift_report(report, request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProductionShiftReportSerializer(report).data)

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        from datetime import date, timedelta
        today = date.today()
        start = request.query_params.get("start_date", str(today - timedelta(days=30)))
        end = request.query_params.get("end_date", str(today))
        data = services.get_shift_analytics(start, end)
        return Response(data)


class ProductionDashboardView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        data = services.get_production_dashboard()
        return Response(data)
