from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TollingContractViewSet, TollingRawMaterialReceiptViewSet,
    TollingDeliveryViewSet, TollingInvoiceViewSet,
)

router = DefaultRouter()
router.register("contracts", TollingContractViewSet, basename="tolling-contracts")
router.register("receipts", TollingRawMaterialReceiptViewSet, basename="tolling-receipts")
router.register("deliveries", TollingDeliveryViewSet, basename="tolling-deliveries")
router.register("invoices", TollingInvoiceViewSet, basename="tolling-invoices")

urlpatterns = [path("", include(router.urls))]
