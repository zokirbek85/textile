from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EquipmentViewSet, SparePartViewSet, MaintenanceScheduleViewSet,
    MaintenanceRecordViewSet, EquipmentDowntimeViewSet, OEEViewSet,
    MaintenanceCostViewSet,
)

router = DefaultRouter()
router.register("equipment", EquipmentViewSet, basename="equipment")
router.register("spare-parts", SparePartViewSet, basename="spare-part")
router.register("schedules", MaintenanceScheduleViewSet, basename="maintenance-schedule")
router.register("records", MaintenanceRecordViewSet, basename="maintenance-record")
router.register("downtime", EquipmentDowntimeViewSet, basename="equipment-downtime")
router.register("oee", OEEViewSet, basename="oee")
router.register("analytics", MaintenanceCostViewSet, basename="maintenance-analytics")

urlpatterns = [
    path("", include(router.urls)),
]
