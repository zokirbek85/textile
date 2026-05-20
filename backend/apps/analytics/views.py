from datetime import date, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, F

from apps.yarn_production.models import YarnBatch, YarnShift, BatchStatus as YBS
from apps.cotton_production.models import CottonBatch, Shift as CottonShift, BatchStatus as CBS
from apps.costing_engine.models import CostSnapshot


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def machine_efficiency_analytics(request):
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
    """Compare last N completed yarn batches side by side."""
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
    """Month-by-month production volume and cost summary."""
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
