from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, ProductViewSet, ProductCategoryViewSet,
    StockLedgerViewSet, StockMovementViewSet,
)

router = DefaultRouter()
router.register("warehouses", WarehouseViewSet, basename="warehouses")
router.register("products", ProductViewSet, basename="products")
router.register("categories", ProductCategoryViewSet, basename="product-categories")
router.register("ledger", StockLedgerViewSet, basename="stock-ledger")
router.register("movements", StockMovementViewSet, basename="stock-movements")

urlpatterns = [path("", include(router.urls))]
