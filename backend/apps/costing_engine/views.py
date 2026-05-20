from datetime import date
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import CostSnapshot
from .serializers import CostSnapshotSerializer
from . import services


class CostSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CostSnapshotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["stage", "product", "reference_type"]
    ordering_fields = ["snapshot_date", "output_cost_per_kg"]
    ordering = ["-snapshot_date"]

    def get_queryset(self):
        return CostSnapshot.objects.select_related("product").all()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_yarn_costs(request):
    return Response(services.get_current_yarn_costs())


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cost_trend(request):
    stage = request.query_params.get("stage", CostSnapshot.ProductionStage.FIBER_TO_YARN)
    days = int(request.query_params.get("days", 90))
    product_id = request.query_params.get("product_id")
    return Response(services.get_cost_trend(stage=stage, days=days, product_id=product_id))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def expense_breakdown(request):
    stage = request.query_params.get("stage", CostSnapshot.ProductionStage.FIBER_TO_YARN)
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    from datetime import datetime
    start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else None
    end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None

    return Response(services.get_expense_breakdown_aggregate(stage, start, end))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpi_summary(request):
    as_of_str = request.query_params.get("as_of")
    as_of = None
    if as_of_str:
        from datetime import datetime
        as_of = datetime.strptime(as_of_str, "%Y-%m-%d").date()
    return Response(services.get_kpi_summary(as_of=as_of))
