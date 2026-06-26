from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductionLineViewSet,
    ProductionOrderViewSet,
    ProductionBatchViewSet,
    ProductionShiftReportViewSet,
    ProductionDashboardView,
)

router = DefaultRouter()
router.register("lines", ProductionLineViewSet, basename="production-lines")
router.register("orders", ProductionOrderViewSet, basename="production-orders")
router.register("batches", ProductionBatchViewSet, basename="production-batches")
router.register("shift-reports", ProductionShiftReportViewSet, basename="production-shift-reports")
router.register("dashboard", ProductionDashboardView, basename="production-dashboard")

urlpatterns = [path("", include(router.urls))]
