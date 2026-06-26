from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QualityParameterViewSet, QualityTestViewSet,
    QualityCertificateViewSet, DefectTypeViewSet,
    QualityDefectViewSet, QualityAnalyticsViewSet,
)

router = DefaultRouter()
router.register("parameters", QualityParameterViewSet, basename="quality-parameter")
router.register("tests", QualityTestViewSet, basename="quality-test")
router.register("certificates", QualityCertificateViewSet, basename="quality-certificate")
router.register("defect-types", DefectTypeViewSet, basename="defect-type")
router.register("defects", QualityDefectViewSet, basename="quality-defect")
router.register("analytics", QualityAnalyticsViewSet, basename="quality-analytics")

urlpatterns = [
    path("", include(router.urls)),
]
