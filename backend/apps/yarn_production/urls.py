from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import YarnBatchViewSet, YarnShiftViewSet

router = DefaultRouter()
router.register("batches", YarnBatchViewSet, basename="yarn-batches")
router.register("shifts", YarnShiftViewSet, basename="yarn-shifts")

urlpatterns = [path("", include(router.urls))]
