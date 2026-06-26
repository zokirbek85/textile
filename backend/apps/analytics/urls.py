from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StandardCostViewSet, ActualCostViewSet, ProfitabilityAnalysisViewSet,
    ProductionKPIViewSet, ProductionForecastViewSet, DashboardWidgetViewSet,
    machine_efficiency_analytics, operator_analytics,
    cost_comparison, production_overview_analytics,
)

router = DefaultRouter()
router.register("standard-costs", StandardCostViewSet, basename="standard-costs")
router.register("actual-costs", ActualCostViewSet, basename="actual-costs")
router.register("profitability", ProfitabilityAnalysisViewSet, basename="profitability")
router.register("kpi", ProductionKPIViewSet, basename="kpi")
router.register("forecasts", ProductionForecastViewSet, basename="forecasts")
router.register("widgets", DashboardWidgetViewSet, basename="widgets")

urlpatterns = [
    path("", include(router.urls)),
    # Legacy endpoints
    path("machine-efficiency/", machine_efficiency_analytics),
    path("operator/", operator_analytics),
    path("cost-comparison/", cost_comparison),
    path("production-overview/", production_overview_analytics),
]
