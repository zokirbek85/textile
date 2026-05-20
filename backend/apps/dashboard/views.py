from datetime import date, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count

from apps.cotton_production.models import CottonBatch, Shift as CottonShift, BatchStatus as CBS
from apps.yarn_production.models import YarnBatch, YarnShift, BatchStatus as YBS
from apps.warehouse.models import StockLedger, Warehouse
from apps.costing_engine.services import get_current_yarn_costs, get_cost_trend, get_kpi_summary
from apps.costing_engine.models import CostSnapshot


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """
    All data needed to render the main dashboard in one call.
    Aggressively cached — 60s TTL is enough for a live factory floor.
    """
    today = date.today()
    month_start = today.replace(day=1)
    week_start = today - timedelta(days=today.weekday())

    # ── Today's production ────────────────────────────────────────────────────
    today_cotton_shifts = CottonShift.objects.filter(shift_date=today)
    today_yarn_shifts = YarnShift.objects.filter(shift_date=today)

    today_fiber = today_cotton_shifts.aggregate(
        kg=Sum("fiber_produced_kg")
    )["kg"] or 0

    today_yarn = today_yarn_shifts.aggregate(
        kg=Sum("yarn_produced_kg")
    )["kg"] or 0

    # ── This month ───────────────────────────────────────────────────────────
    month_yarn_batches = YarnBatch.objects.filter(
        status=YBS.COMPLETED,
        end_date__gte=month_start,
        end_date__lte=today,
    )
    month_yarn_kg = month_yarn_batches.aggregate(kg=Sum("yarn_output_kg"))["kg"] or 0
    avg_yarn_cost = month_yarn_batches.aggregate(c=Avg("calculated_yarn_cost_per_kg"))["c"]

    month_cotton_batches = CottonBatch.objects.filter(
        status=CBS.COMPLETED,
        end_date__gte=month_start,
        end_date__lte=today,
    )
    month_fiber_kg = month_cotton_batches.aggregate(kg=Sum("fiber_output_kg"))["kg"] or 0

    # ── Active batches ────────────────────────────────────────────────────────
    active_cotton = CottonBatch.objects.filter(status=CBS.IN_PROGRESS).count()
    active_yarn = YarnBatch.objects.filter(status=YBS.IN_PROGRESS).count()

    # ── Warehouse totals ──────────────────────────────────────────────────────
    warehouses = Warehouse.objects.filter(is_active=True)
    warehouse_summary = []
    for wh in warehouses:
        total_value = StockLedger.objects.filter(warehouse=wh).aggregate(
            tv=Sum("total_value")
        )["tv"] or 0
        total_kg = StockLedger.objects.filter(warehouse=wh).aggregate(
            tq=Sum("quantity_kg")
        )["tq"] or 0
        warehouse_summary.append({
            "id": str(wh.id),
            "name": wh.name,
            "type": wh.warehouse_type,
            "total_kg": total_kg,
            "total_value": total_value,
        })

    # ── Current yarn costs ────────────────────────────────────────────────────
    current_yarn_costs = get_current_yarn_costs()

    # ── 30-day cost trend (yarn) ──────────────────────────────────────────────
    yarn_cost_trend = get_cost_trend(
        stage=CostSnapshot.ProductionStage.FIBER_TO_YARN,
        days=30,
    )

    # ── Machine efficiency (last 7 days) ─────────────────────────────────────
    machine_efficiency = (
        YarnShift.objects
        .filter(shift_date__gte=week_start)
        .select_related("machine")
        .values("machine__name", "machine__code")
        .annotate(
            avg_efficiency=Avg("actual_hours"),
            total_yarn=Sum("yarn_produced_kg"),
            shifts=Count("id"),
        )
    )

    return Response({
        "today": {
            "fiber_produced_kg": today_fiber,
            "yarn_produced_kg": today_yarn,
            "date": today.isoformat(),
        },
        "this_month": {
            "fiber_kg": month_fiber_kg,
            "yarn_kg": month_yarn_kg,
            "avg_yarn_cost_per_kg": avg_yarn_cost,
            "cotton_batches_completed": month_cotton_batches.count(),
            "yarn_batches_completed": month_yarn_batches.count(),
        },
        "active_batches": {
            "cotton": active_cotton,
            "yarn": active_yarn,
        },
        "warehouses": warehouse_summary,
        "current_yarn_costs": current_yarn_costs,
        "yarn_cost_trend": list(yarn_cost_trend),
        "machine_efficiency": list(machine_efficiency),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def production_trend(request):
    """Daily production quantities for the past N days."""
    days = int(request.query_params.get("days", 30))
    since = date.today() - timedelta(days=days)

    cotton_daily = (
        CottonShift.objects
        .filter(shift_date__gte=since)
        .values("shift_date")
        .annotate(fiber_kg=Sum("fiber_produced_kg"))
        .order_by("shift_date")
    )
    yarn_daily = (
        YarnShift.objects
        .filter(shift_date__gte=since)
        .values("shift_date")
        .annotate(yarn_kg=Sum("yarn_produced_kg"), waste_kg=Sum("waste_kg"))
        .order_by("shift_date")
    )

    # Merge by date
    cotton_map = {r["shift_date"]: r["fiber_kg"] for r in cotton_daily}
    yarn_map = {r["shift_date"]: {"yarn_kg": r["yarn_kg"], "waste_kg": r["waste_kg"]}
                for r in yarn_daily}

    all_dates = sorted(set(list(cotton_map.keys()) + list(yarn_map.keys())))
    trend = []
    for d in all_dates:
        trend.append({
            "date": d.isoformat(),
            "fiber_kg": float(cotton_map.get(d, 0)),
            "yarn_kg": float(yarn_map.get(d, {}).get("yarn_kg", 0)),
            "waste_kg": float(yarn_map.get(d, {}).get("waste_kg", 0)),
        })

    return Response(trend)
