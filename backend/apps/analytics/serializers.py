from rest_framework import serializers
from .models import (
    StandardCost, ActualCost, ProfitabilityAnalysis,
    ProductionKPI, ProductionForecast, DashboardWidget,
)


class StandardCostSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.product_code", read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StandardCost
        fields = [
            "id", "product", "product_name", "product_code",
            "cost_period_start", "cost_period_end",
            "raw_material_cost_per_kg", "labor_cost_per_kg",
            "overhead_cost_per_kg", "energy_cost_per_kg",
            "total_standard_cost_per_kg",
            "approved_by", "approved_by_name",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["total_standard_cost_per_kg", "created_at", "updated_at"]

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None


class ActualCostSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="production_order.order_number", read_only=True)
    batch_number = serializers.CharField(source="production_batch.batch_number", read_only=True)

    class Meta:
        model = ActualCost
        fields = [
            "id", "production_order", "order_number",
            "production_batch", "batch_number",
            "cost_date",
            "raw_material_cost_uzs", "labor_cost_uzs", "overhead_cost_uzs",
            "energy_cost_uzs", "maintenance_cost_uzs", "waste_cost_uzs",
            "total_cost_uzs", "quantity_kg", "cost_per_kg",
            "notes", "created_at",
        ]
        read_only_fields = ["total_cost_uzs", "cost_per_kg", "created_at"]


class ProfitabilityAnalysisSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="production_order.order_number", read_only=True)

    class Meta:
        model = ProfitabilityAnalysis
        fields = [
            "id", "production_order", "order_number",
            "analysis_date", "period_start", "period_end",
            "revenue_uzs", "cogs_uzs", "gross_profit_uzs", "gross_margin_pct",
            "overhead_allocated_uzs", "net_profit_uzs", "net_margin_pct",
            "quantity_kg", "revenue_per_kg",
            "notes", "created_at",
        ]
        read_only_fields = [
            "gross_profit_uzs", "gross_margin_pct",
            "net_profit_uzs", "net_margin_pct",
            "revenue_per_kg", "created_at",
        ]


class ProductionKPISerializer(serializers.ModelSerializer):
    production_line_name = serializers.CharField(source="production_line.name", read_only=True)
    production_line_code = serializers.CharField(source="production_line.code", read_only=True)

    class Meta:
        model = ProductionKPI
        fields = [
            "id", "production_line", "production_line_name", "production_line_code",
            "kpi_date", "shift",
            "output_kg", "target_kg", "efficiency_pct",
            "quality_pass_rate_pct", "waste_pct", "downtime_hours",
            "cost_per_kg", "oee_pct", "energy_kwh",
            "created_at",
        ]
        read_only_fields = ["efficiency_pct", "created_at"]


class ProductionForecastSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.product_code", read_only=True)
    period_display = serializers.CharField(source="get_period_display", read_only=True)
    method_display = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = ProductionForecast
        fields = [
            "id", "product", "product_name", "product_code",
            "forecast_date", "period", "period_display",
            "period_start", "period_end",
            "forecast_quantity_kg", "actual_quantity_kg", "forecast_accuracy_pct",
            "confidence_low_kg", "confidence_high_kg",
            "method", "method_display",
            "notes", "created_at",
        ]
        read_only_fields = ["forecast_accuracy_pct", "created_at"]


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source="get_widget_type_display", read_only=True)

    class Meta:
        model = DashboardWidget
        fields = [
            "id", "widget_type", "widget_type_display", "title", "config",
            "position_x", "position_y", "width", "height", "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]
