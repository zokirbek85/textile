from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CottonBatchViewSet, MachineViewSet, ShiftViewSet

router = DefaultRouter()
router.register("batches", CottonBatchViewSet, basename="cotton-batches")
router.register("machines", MachineViewSet, basename="machines")
router.register("shifts", ShiftViewSet, basename="cotton-shifts")

urlpatterns = [path("", include(router.urls))]
