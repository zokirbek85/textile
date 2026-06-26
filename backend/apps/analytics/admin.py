from django.contrib import admin
from .models import (
    StandardCost, ActualCost, ProfitabilityAnalysis,
    ProductionKPI, ProductionForecast, DashboardWidget,
)


@admin.register(StandardCost)
class StandardCostAdmin(admin.ModelAdmin):
    list_display = ["product", "cost_period_start", "cost_period_end", "total_standard_cost_per_kg", "approved_by"]
    list_filter = ["cost_period_start"]
    search_fields = ["product__name", "product__product_code"]
    readonly_fields = ["total_standard_cost_per_kg", "created_at", "updated_at"]
    date_hierarchy = "cost_period_start"


@admin.register(ActualCost)
class ActualCostAdmin(admin.ModelAdmin):
    list_display = ["cost_date", "production_order", "production_batch", "quantity_kg", "total_cost_uzs", "cost_per_kg"]
    list_filter = ["cost_date"]
    search_fields = ["production_order__order_number", "production_batch__batch_number"]
    readonly_fields = ["total_cost_uzs", "cost_per_kg", "created_at"]
    date_hierarchy = "cost_date"


@admin.register(ProfitabilityAnalysis)
class ProfitabilityAnalysisAdmin(admin.ModelAdmin):
    list_display = ["analysis_date", "production_order", "revenue_uzs", "net_profit_uzs", "net_margin_pct"]
    list_filter = ["analysis_date"]
    search_fields = ["production_order__order_number"]
    readonly_fields = ["gross_profit_uzs", "gross_margin_pct", "net_profit_uzs", "net_margin_pct", "revenue_per_kg", "created_at"]
    date_hierarchy = "analysis_date"


@admin.register(ProductionKPI)
class ProductionKPIAdmin(admin.ModelAdmin):
    list_display = ["kpi_date", "production_line", "shift", "output_kg", "efficiency_pct", "oee_pct"]
    list_filter = ["kpi_date", "production_line", "shift"]
    search_fields = ["production_line__name", "production_line__code"]
    readonly_fields = ["efficiency_pct", "created_at"]
    date_hierarchy = "kpi_date"


@admin.register(ProductionForecast)
class ProductionForecastAdmin(admin.ModelAdmin):
    list_display = ["product", "period", "period_start", "period_end", "forecast_quantity_kg", "actual_quantity_kg", "forecast_accuracy_pct"]
    list_filter = ["period", "method"]
    search_fields = ["product__name", "product__product_code"]
    readonly_fields = ["forecast_accuracy_pct", "created_at"]
    date_hierarchy = "period_start"


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "widget_type", "position_x", "position_y", "is_active"]
    list_filter = ["widget_type", "is_active"]
    search_fields = ["user__email", "title"]
