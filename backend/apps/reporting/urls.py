from django.urls import path
from .views import (
    yarn_cost_report, fiber_cost_report,
    warehouse_balance_report, waste_analysis_report,
)

urlpatterns = [
    path("yarn-cost/", yarn_cost_report),
    path("fiber-cost/", fiber_cost_report),
    path("warehouse-balance/", warehouse_balance_report),
    path("waste-analysis/", waste_analysis_report),
]
