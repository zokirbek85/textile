from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CostSnapshotViewSet, current_yarn_costs, cost_trend, expense_breakdown, kpi_summary

router = DefaultRouter()
router.register("snapshots", CostSnapshotViewSet, basename="cost-snapshots")

urlpatterns = [
    path("current-yarn-costs/", current_yarn_costs),
    path("cost-trend/", cost_trend),
    path("expense-breakdown/", expense_breakdown),
    path("kpi-summary/", kpi_summary),
    path("", include(router.urls)),
]
