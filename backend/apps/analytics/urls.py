from django.urls import path
from .views import (
    machine_efficiency_analytics, operator_analytics,
    cost_comparison, production_overview_analytics,
)

urlpatterns = [
    path("machine-efficiency/", machine_efficiency_analytics),
    path("operator/", operator_analytics),
    path("cost-comparison/", cost_comparison),
    path("production-overview/", production_overview_analytics),
]
