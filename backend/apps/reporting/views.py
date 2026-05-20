from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date

from apps.yarn_production.models import YarnBatch, BatchStatus as YBS
from apps.cotton_production.models import CottonBatch, BatchStatus as CBS
from apps.warehouse.models import StockLedger
from .generators import (
    generate_yarn_cost_excel,
    generate_warehouse_balance_excel,
    generate_cotton_cost_excel,
)


def _parse_date_range(request):
    start = request.query_params.get("start_date", date.today().replace(day=1).isoformat())
    end = request.query_params.get("end_date", date.today().isoformat())
    return start, end


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yarn_cost_report(request):
    start, end = _parse_date_range(request)
    batches = YarnBatch.objects.filter(
        status=YBS.COMPLETED,
        end_date__gte=start,
        end_date__lte=end,
    ).select_related("yarn_product").prefetch_related("expenses")

    fmt = request.query_params.get("format", "json")
    if fmt == "excel":
        content = generate_yarn_cost_excel(batches)
        response = HttpResponse(
            content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="yarn_cost_{start}_{end}.xlsx"'
        return response

    # JSON — Power BI / frontend
    data = []
    for b in batches:
        from apps.yarn_production.services import get_yarn_batch_cost_breakdown
        data.append(get_yarn_batch_cost_breakdown(b))
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fiber_cost_report(request):
    start, end = _parse_date_range(request)
    batches = CottonBatch.objects.filter(
        status=CBS.COMPLETED,
        end_date__gte=start,
        end_date__lte=end,
    ).prefetch_related("expenses")

    fmt = request.query_params.get("format", "json")
    if fmt == "excel":
        content = generate_cotton_cost_excel(batches)
        response = HttpResponse(
            content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="fiber_cost_{start}_{end}.xlsx"'
        return response

    from apps.cotton_production.services import get_batch_cost_breakdown
    return Response([get_batch_cost_breakdown(b) for b in batches])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def warehouse_balance_report(request):
    fmt = request.query_params.get("format", "json")
    entries = StockLedger.objects.select_related(
        "warehouse", "product"
    ).filter(quantity_kg__gt=0)

    if fmt == "excel":
        content = generate_warehouse_balance_excel(entries)
        response = HttpResponse(
            content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        today = date.today().isoformat()
        response["Content-Disposition"] = f'attachment; filename="warehouse_balance_{today}.xlsx"'
        return response

    from apps.warehouse.serializers import StockLedgerSerializer
    return Response(StockLedgerSerializer(entries, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def waste_analysis_report(request):
    start, end = _parse_date_range(request)
    batches = YarnBatch.objects.filter(
        status=YBS.COMPLETED,
        end_date__gte=start,
        end_date__lte=end,
    ).select_related("yarn_product")

    data = [
        {
            "batch_code": b.batch_code,
            "product": b.yarn_product.name if b.yarn_product else "",
            "fiber_input_kg": float(b.fiber_input_kg),
            "yarn_output_kg": float(b.yarn_output_kg),
            "waste_kg": float(b.waste_output_kg),
            "waste_pct": float(b.waste_pct),
            "end_date": b.end_date.isoformat() if b.end_date else "",
        }
        for b in batches
    ]
    return Response(data)
