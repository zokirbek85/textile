from datetime import date, timedelta

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Avg, Count, F

# Legacy imports (kept for backward compatibility)
from apps.yarn_production.models import YarnBatch, YarnShift, BatchStatus as YBS
from apps.cotton_production.models import CottonBatch, Shift as CottonShift, BatchStatus as CBS

from .models import (
    StandardCost, ActualCost, ProfitabilityAnalysis,
    ProductionKPI, ProductionForecast, DashboardWidget,
)
from .serializers import (
    StandardCostSerializer, ActualCostSerializer,
    ProfitabilityAnalysisSerializer, ProductionKPISerializer,
    ProductionForecastSerializer, DashboardWidgetSerializer,
)
from .services import (
    CostAccountingService, ProfitabilityService,
    KPIAggregationService, ForecastingService, DashboardService,
)


# ─── New Module 4 ViewSets ─────────────────────────────────────────────────────

class StandardCostViewSet(viewsets.ModelViewSet):
    queryset = StandardCost.objects.select_related("product", "approved_by")
    serializer_class = StandardCostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["product"]
    ordering_fields = ["cost_period_start", "total_standard_cost_per_kg"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="compare")
    def compare(self, request):
        product_id = request.query_params.get("product")
        start = request.query_params.get("start_date", str(date.today().replace(day=1)))
        end = request.query_params.get("end_date", str(date.today()))
        if not product_id:
            return Response({"detail": "product query param required."}, status=400)
        result = CostAccountingService.compare_standard_vs_actual(
            product_id, date.fromisoformat(start), date.fromisoformat(end)
        )
        return Response(result)


class ActualCostViewSet(viewsets.ModelViewSet):
    queryset = ActualCost.objects.select_related("production_order", "production_batch")
    serializer_class = ActualCostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["production_order", "production_batch"]
    ordering_fields = ["cost_date", "cost_per_kg", "total_cost_uzs"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="trend")
    def trend(self, request):
        days = int(request.query_params.get("days", 90))
        group_by = request.query_params.get("group_by", "month")
        since = date.today() - timedelta(days=days)
        data = CostAccountingService.get_cost_trend(since, date.today(), group_by)
        return Response(list(data))

    @action(detail=False, methods=["get"], url_path="breakdown")
    def breakdown(self, request):
        days = int(request.query_params.get("days", 30))
        since = date.today() - timedelta(days=days)
        data = CostAccountingService.get_cost_breakdown_summary(since, date.today())
        return Response(data)


class ProfitabilityAnalysisViewSet(viewsets.ModelViewSet):
    queryset = ProfitabilityAnalysis.objects.select_related("production_order")
    serializer_class = ProfitabilityAnalysisSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["production_order"]
    ordering_fields = ["analysis_date", "net_margin_pct", "revenue_uzs"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="trend")
    def trend(self, request):
        days = int(request.query_params.get("days", 180))
        since = date.today() - timedelta(days=days)
        data = ProfitabilityService.get_profitability_trend(since, date.today())
        return Response(data)

    @action(detail=False, methods=["get"], url_path="executive-summary")
    def executive_summary(self, request):
        days = int(request.query_params.get("days", 30))
        since = date.today() - timedelta(days=days)
        data = ProfitabilityService.get_executive_summary(since, date.today())
        return Response(data)


class ProductionKPIViewSet(viewsets.ModelViewSet):
    queryset = ProductionKPI.objects.select_related("production_line")
    serializer_class = ProductionKPISerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["production_line", "shift"]
    ordering_fields = ["kpi_date", "efficiency_pct", "oee_pct"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        days = int(request.query_params.get("days", 30))
        data = KPIAggregationService.get_kpi_dashboard(days)
        return Response(data)

    @action(detail=False, methods=["post"], url_path="snapshot")
    def snapshot(self, request):
        shift_report_id = request.data.get("shift_report_id")
        if not shift_report_id:
            return Response({"detail": "shift_report_id required."}, status=400)
        from apps.production.models import ProductionShiftReport
        try:
            sr = ProductionShiftReport.objects.get(pk=shift_report_id)
        except ProductionShiftReport.DoesNotExist:
            return Response({"detail": "Shift report not found."}, status=404)
        kpi = KPIAggregationService.snapshot_from_shift_report(sr, request.user)
        return Response(ProductionKPISerializer(kpi).data, status=status.HTTP_201_CREATED)


class ProductionForecastViewSet(viewsets.ModelViewSet):
    queryset = ProductionForecast.objects.select_related("product")
    serializer_class = ProductionForecastSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["product", "period", "method"]
    ordering_fields = ["forecast_date", "period_start", "forecast_accuracy_pct"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="update-actual")
    def update_actual(self, request, pk=None):
        actual_kg = request.data.get("actual_quantity_kg")
        if actual_kg is None:
            return Response({"detail": "actual_quantity_kg required."}, status=400)
        from decimal import Decimal
        fc = ForecastingService.update_actual(pk, Decimal(str(actual_kg)), request.user)
        return Response(ProductionForecastSerializer(fc).data)

    @action(detail=False, methods=["get"], url_path="accuracy-report")
    def accuracy_report(self, request):
        days = int(request.query_params.get("days", 90))
        since = date.today() - timedelta(days=days)
        data = ForecastingService.get_forecast_accuracy_report(since, date.today())
        return Response(data)


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DashboardWidget.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="executive-dashboard")
    def executive_dashboard(self, request):
        days = int(request.query_params.get("days", 30))
        data = DashboardService.get_executive_dashboard(days)
        return Response(data)


# ─── Legacy function-based views (kept for backward compatibility) ─────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def machine_efficiency_analytics(request):
    from datetime import date, timedelta
    days = int(request.query_params.get("days", 30))
    since = date.today() - timedelta(days=days)

    data = (
        YarnShift.objects
        .filter(shift_date__gte=since)
        .select_related("machine")
        .values("machine__id", "machine__name", "machine__code")
        .annotate(
            total_shifts=Count("id"),
            total_yarn_kg=Sum("yarn_produced_kg"),
            total_waste_kg=Sum("waste_kg"),
            avg_downtime_min=Avg("downtime_minutes"),
            total_hours=Sum("actual_hours"),
        )
        .order_by("-total_yarn_kg")
    )
    return Response(list(data))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def operator_analytics(request):
    from datetime import date, timedelta
    days = int(request.query_params.get("days", 30))
    since = date.today() - timedelta(days=days)

    data = (
        YarnShift.objects
        .filter(shift_date__gte=since, operator__isnull=False)
        .values("operator__id", "operator__first_name", "operator__last_name")
        .annotate(
            total_shifts=Count("id"),
            total_yarn_kg=Sum("yarn_produced_kg"),
            total_waste_kg=Sum("waste_kg"),
            avg_downtime_min=Avg("downtime_minutes"),
        )
        .order_by("-total_yarn_kg")
    )
    return Response(list(data))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cost_comparison(request):
    limit = int(request.query_params.get("limit", 10))
    batches = (
        YarnBatch.objects
        .filter(status=YBS.COMPLETED)
        .select_related("yarn_product")
        .order_by("-end_date")[:limit]
    )
    data = [
        {
            "batch_code": b.batch_code,
            "product": b.yarn_product.name if b.yarn_product else "",
            "yarn_count": b.yarn_product.yarn_count if b.yarn_product else "",
            "end_date": b.end_date.isoformat() if b.end_date else "",
            "yarn_cost_per_kg": float(b.calculated_yarn_cost_per_kg),
            "fiber_cost_per_kg": float(b.fiber_cost_total / b.fiber_input_kg) if b.fiber_input_kg else 0,
            "spinning_cost_per_kg": float(b.total_spinning_expenses / b.yarn_output_kg) if b.yarn_output_kg else 0,
            "waste_pct": float(b.waste_pct),
            "efficiency_pct": float(b.efficiency_pct),
        }
        for b in batches
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def production_overview_analytics(request):
    from django.db.models.functions import TruncMonth

    yarn_monthly = (
        YarnBatch.objects
        .filter(status=YBS.COMPLETED)
        .annotate(month=TruncMonth("end_date"))
        .values("month")
        .annotate(
            yarn_kg=Sum("yarn_output_kg"),
            avg_cost=Avg("calculated_yarn_cost_per_kg"),
            batch_count=Count("id"),
        )
        .order_by("month")
    )

    fiber_monthly = (
        CottonBatch.objects
        .filter(status=CBS.COMPLETED)
        .annotate(month=TruncMonth("end_date"))
        .values("month")
        .annotate(
            fiber_kg=Sum("fiber_output_kg"),
            cotton_kg=Sum("cotton_input_kg"),
            avg_fiber_cost=Avg("calculated_fiber_cost_per_kg"),
        )
        .order_by("month")
    )

    return Response({
        "yarn_monthly": list(yarn_monthly),
        "fiber_monthly": list(fiber_monthly),
    })
