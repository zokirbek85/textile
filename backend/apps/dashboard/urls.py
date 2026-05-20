from django.urls import path
from .views import dashboard_overview, production_trend

urlpatterns = [
    path("overview/", dashboard_overview),
    path("production-trend/", production_trend),
]
