from __future__ import annotations
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Avg, Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncWeek

from .models import (
    StandardCost, ActualCost, ProfitabilityAnalysis,
    ProductionKPI, ProductionForecast, DashboardWidget,
)


class CostAccountingService:
    """Create and query actual cost records."""

    @staticmethod
    def record_actual_cost(data: dict, user=None) -> ActualCost:
        cost = ActualCost(**data)
        if user:
            cost.created_by = user
        cost.save()
        return cost

    @staticmethod
    def get_cost_trend(start_date: date, end_date: date, group_by: str = "month"):
        """Return cost_per_kg trend grouped by month or week."""
        qs = (
            ActualCost.objects
            .filter(cost_date__range=(start_date, end_date))
            .exclude(quantity_kg=0)
        )
        trunc_fn = TruncMonth if group_by == "month" else TruncWeek
        return (
            qs.annotate(period=trunc_fn("cost_date"))
            .values("period")
            .annotate(
                avg_cost_per_kg=Avg("cost_per_kg"),
                total_cost_uzs=Sum("total_cost_uzs"),
                total_qty_kg=Sum("quantity_kg"),
                record_count=Count("id"),
            )
            .order_by("period")
        )

    @staticmethod
    def get_cost_breakdown_summary(start_date: date, end_date: date) -> dict:
        qs = ActualCost.objects.filter(cost_date__range=(start_date, end_date))
        agg = qs.aggregate(
            raw_material=Sum("raw_material_cost_uzs"),
            labor=Sum("labor_cost_uzs"),
            overhead=Sum("overhead_cost_uzs"),
            energy=Sum("energy_cost_uzs"),
            maintenance=Sum("maintenance_cost_uzs"),
            waste=Sum("waste_cost_uzs"),
            total=Sum("total_cost_uzs"),
            qty=Sum("quantity_kg"),
            count=Count("id"),
        )
        total = agg["total"] or Decimal("0")
        qty = agg["qty"] or Decimal("1")

        def pct(val):
            v = val or Decimal("0")
            return float(v / total * 100) if total else 0.0

        return {
            "period": {"start": str(start_date), "end": str(end_date)},
            "record_count": agg["count"] or 0,
            "total_cost_uzs": str(total),
            "total_qty_kg": str(qty),
            "avg_cost_per_kg": str((total / qty).quantize(Decimal("0.01"))),
            "breakdown": {
                "raw_material": {"amount": str(agg["raw_material"] or 0), "pct": pct(agg["raw_material"])},
                "labor": {"amount": str(agg["labor"] or 0), "pct": pct(agg["labor"])},
                "overhead": {"amount": str(agg["overhead"] or 0), "pct": pct(agg["overhead"])},
                "energy": {"amount": str(agg["energy"] or 0), "pct": pct(agg["energy"])},
                "maintenance": {"amount": str(agg["maintenance"] or 0), "pct": pct(agg["maintenance"])},
                "waste": {"amount": str(agg["waste"] or 0), "pct": pct(agg["waste"])},
            },
        }

    @staticmethod
    def compare_standard_vs_actual(product_id: str, period_start: date, period_end: date) -> dict:
        """Compare standard cost norms against actual costs for a product."""
        std = (
            StandardCost.objects
            .filter(
                product_id=product_id,
                cost_period_start__lte=period_end,
                cost_period_end__gte=period_start,
            )
            .first()
        )
        actual_agg = ActualCost.objects.filter(
            production_batch__output_product_id=product_id,
            cost_date__range=(period_start, period_end),
        ).aggregate(
            avg_actual_per_kg=Avg("cost_per_kg"),
            total_qty=Sum("quantity_kg"),
        )

        return {
            "product_id": str(product_id),
            "period": {"start": str(period_start), "end": str(period_end)},
            "standard_cost_per_kg": str(std.total_standard_cost_per_kg) if std else None,
            "actual_cost_per_kg": str(actual_agg["avg_actual_per_kg"] or 0),
            "variance": str(
                (actual_agg["avg_actual_per_kg"] or Decimal("0"))
                - (std.total_standard_cost_per_kg if std else Decimal("0"))
            ),
            "total_qty_kg": str(actual_agg["total_qty"] or 0),
        }


class ProfitabilityService:
    """Create and analyse profitability records."""

    @staticmethod
    def record_analysis(data: dict, user=None) -> ProfitabilityAnalysis:
        analysis = ProfitabilityAnalysis(**data)
        if user:
            analysis.created_by = user
        analysis.save()
        return analysis

    @staticmethod
    def get_profitability_trend(start_date: date, end_date: date) -> list:
        return list(
            ProfitabilityAnalysis.objects
            .filter(analysis_date__range=(start_date, end_date))
            .annotate(period=TruncMonth("analysis_date"))
            .values("period")
            .annotate(
                total_revenue=Sum("revenue_uzs"),
                total_cogs=Sum("cogs_uzs"),
                total_gross_profit=Sum("gross_profit_uzs"),
                total_net_profit=Sum("net_profit_uzs"),
                avg_net_margin=Avg("net_margin_pct"),
                total_qty_kg=Sum("quantity_kg"),
                count=Count("id"),
            )
            .order_by("period")
        )

    @staticmethod
    def get_executive_summary(start_date: date, end_date: date) -> dict:
        agg = ProfitabilityAnalysis.objects.filter(
            analysis_date__range=(start_date, end_date)
        ).aggregate(
            revenue=Sum("revenue_uzs"),
            cogs=Sum("cogs_uzs"),
            gross_profit=Sum("gross_profit_uzs"),
            net_profit=Sum("net_profit_uzs"),
            avg_net_margin=Avg("net_margin_pct"),
            qty=Sum("quantity_kg"),
            count=Count("id"),
        )
        cost_agg = ActualCost.objects.filter(
            cost_date__range=(start_date, end_date)
        ).aggregate(total=Sum("total_cost_uzs"), qty=Sum("quantity_kg"))

        return {
            "period": {"start": str(start_date), "end": str(end_date)},
            "revenue_uzs": str(agg["revenue"] or 0),
            "cogs_uzs": str(agg["cogs"] or 0),
            "gross_profit_uzs": str(agg["gross_profit"] or 0),
            "net_profit_uzs": str(agg["net_profit"] or 0),
            "avg_net_margin_pct": str(agg["avg_net_margin"] or 0),
            "total_qty_kg": str(agg["qty"] or 0),
            "analysis_count": agg["count"] or 0,
            "total_production_cost_uzs": str(cost_agg["total"] or 0),
        }


class KPIAggregationService:
    """Aggregate and snapshot production KPIs from shift reports."""

    @staticmethod
    def snapshot_from_shift_report(shift_report, user=None) -> ProductionKPI:
        from apps.quality.models import QualityTest
        from apps.maintenance.models import OEEMeasurement

        line = shift_report.production_line
        kpi_date = shift_report.shift_date
        shift = shift_report.shift

        total_tests = QualityTest.objects.filter(
            test_date=kpi_date,
            batch__production_order__production_line=line,
        ).count()
        passed_tests = QualityTest.objects.filter(
            test_date=kpi_date,
            batch__production_order__production_line=line,
            overall_result="passed",
        ).count()
        pass_rate = (
            Decimal(str(passed_tests)) / Decimal(str(total_tests)) * 100
            if total_tests else Decimal("0")
        )

        target = (
            line.capacity_per_hour * shift_report.planned_runtime_hours
        ) if shift_report.planned_runtime_hours else Decimal("0")

        waste_pct = (
            shift_report.waste_kg / shift_report.total_input_kg * 100
            if shift_report.total_input_kg else Decimal("0")
        )

        oee_obj = (
            OEEMeasurement.objects
            .filter(shift_report=shift_report)
            .order_by("-calculated_at")
            .first()
        )

        kpi, _ = ProductionKPI.objects.update_or_create(
            production_line=line,
            kpi_date=kpi_date,
            shift=shift,
            defaults={
                "output_kg": shift_report.total_output_kg,
                "target_kg": target,
                "quality_pass_rate_pct": pass_rate,
                "waste_pct": waste_pct,
                "downtime_hours": shift_report.downtime_hours,
                "energy_kwh": shift_report.electricity_kwh,
                "oee_pct": oee_obj.oee_percentage if oee_obj else None,
                "created_by": user,
            },
        )
        return kpi

    @staticmethod
    def get_kpi_dashboard(days: int = 30) -> dict:
        since = date.today() - timedelta(days=days)
        kpis = ProductionKPI.objects.filter(kpi_date__gte=since)
        agg = kpis.aggregate(
            avg_efficiency=Avg("efficiency_pct"),
            avg_quality=Avg("quality_pass_rate_pct"),
            avg_oee=Avg("oee_pct"),
            avg_downtime=Avg("downtime_hours"),
            total_output=Sum("output_kg"),
            count=Count("id"),
        )
        by_line = list(
            kpis.values("production_line__name", "production_line__code")
            .annotate(
                avg_efficiency=Avg("efficiency_pct"),
                avg_quality=Avg("quality_pass_rate_pct"),
                avg_oee=Avg("oee_pct"),
                total_output=Sum("output_kg"),
                records=Count("id"),
            )
            .order_by("-avg_efficiency")
        )
        return {
            "days": days,
            "summary": {
                "avg_efficiency_pct": str(agg["avg_efficiency"] or 0),
                "avg_quality_pct": str(agg["avg_quality"] or 0),
                "avg_oee_pct": str(agg["avg_oee"] or 0),
                "avg_downtime_hours": str(agg["avg_downtime"] or 0),
                "total_output_kg": str(agg["total_output"] or 0),
                "kpi_records": agg["count"] or 0,
            },
            "by_line": by_line,
        }


class ForecastingService:
    """Manage and evaluate production forecasts."""

    @staticmethod
    def create_forecast(data: dict, user=None) -> ProductionForecast:
        fc = ProductionForecast(**data)
        if user:
            fc.created_by = user
        fc.save()
        return fc

    @staticmethod
    def update_actual(forecast_id: str, actual_kg: Decimal, user=None) -> ProductionForecast:
        fc = ProductionForecast.objects.get(pk=forecast_id)
        fc.actual_quantity_kg = actual_kg
        fc.update_accuracy()
        if user:
            fc.updated_by = user
        fc.save()
        return fc

    @staticmethod
    def get_forecast_accuracy_report(start_date: date, end_date: date) -> dict:
        qs = ProductionForecast.objects.filter(
            period_start__range=(start_date, end_date),
            actual_quantity_kg__isnull=False,
        )
        agg = qs.aggregate(
            avg_accuracy=Avg("forecast_accuracy_pct"),
            total_forecast=Sum("forecast_quantity_kg"),
            total_actual=Sum("actual_quantity_kg"),
            count=Count("id"),
        )
        by_product = list(
            qs.values("product__name", "product__product_code")
            .annotate(
                avg_accuracy=Avg("forecast_accuracy_pct"),
                record_count=Count("id"),
            )
            .order_by("-avg_accuracy")
        )
        return {
            "period": {"start": str(start_date), "end": str(end_date)},
            "avg_accuracy_pct": str(agg["avg_accuracy"] or 0),
            "total_forecast_kg": str(agg["total_forecast"] or 0),
            "total_actual_kg": str(agg["total_actual"] or 0),
            "evaluated_forecasts": agg["count"] or 0,
            "by_product": by_product,
        }


class DashboardService:
    """Assemble the executive analytics dashboard payload."""

    @staticmethod
    def get_executive_dashboard(days: int = 30) -> dict[str, Any]:
        from apps.production.models import ProductionShiftReport
        from apps.maintenance.models import OEEMeasurement, EquipmentDowntime
        from apps.quality.models import QualityTest

        since = date.today() - timedelta(days=days)

        # Production summary
        prod_agg = ProductionShiftReport.objects.filter(
            shift_date__gte=since
        ).aggregate(
            total_output=Sum("total_output_kg"),
            total_input=Sum("total_input_kg"),
            total_waste=Sum("waste_kg"),
            shift_count=Count("id"),
        )

        # Quality
        q_total = QualityTest.objects.filter(test_date__gte=since).count()
        q_passed = QualityTest.objects.filter(test_date__gte=since, overall_result="passed").count()

        # OEE
        oee_agg = OEEMeasurement.objects.filter(
            measurement_date__gte=since
        ).aggregate(avg_oee=Avg("oee_percentage"))

        # Downtime
        active_dt = EquipmentDowntime.objects.filter(status="active").count()

        # Profitability
        profit_agg = ProfitabilityAnalysis.objects.filter(
            analysis_date__gte=since
        ).aggregate(
            revenue=Sum("revenue_uzs"),
            net_profit=Sum("net_profit_uzs"),
            avg_margin=Avg("net_margin_pct"),
        )

        # KPI trend (last 8 weeks)
        kpi_trend = list(
            ProductionKPI.objects.filter(kpi_date__gte=since)
            .annotate(week=TruncWeek("kpi_date"))
            .values("week")
            .annotate(
                avg_eff=Avg("efficiency_pct"),
                avg_quality=Avg("quality_pass_rate_pct"),
                total_output=Sum("output_kg"),
            )
            .order_by("week")
        )

        return {
            "days": days,
            "production": {
                "total_output_kg": str(prod_agg["total_output"] or 0),
                "total_input_kg": str(prod_agg["total_input"] or 0),
                "total_waste_kg": str(prod_agg["total_waste"] or 0),
                "shift_count": prod_agg["shift_count"] or 0,
            },
            "quality": {
                "total_tests": q_total,
                "passed": q_passed,
                "pass_rate_pct": round(q_passed / q_total * 100, 2) if q_total else 0,
            },
            "oee": {
                "avg_oee_pct": str(oee_agg["avg_oee"] or 0),
            },
            "downtime": {
                "active_events": active_dt,
            },
            "profitability": {
                "revenue_uzs": str(profit_agg["revenue"] or 0),
                "net_profit_uzs": str(profit_agg["net_profit"] or 0),
                "avg_net_margin_pct": str(profit_agg["avg_margin"] or 0),
            },
            "kpi_trend": kpi_trend,
        }
