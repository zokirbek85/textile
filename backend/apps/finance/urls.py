from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialTransactionViewSet, BudgetLineViewSet, financial_summary

router = DefaultRouter()
router.register("transactions", FinancialTransactionViewSet, basename="transactions")
router.register("budget", BudgetLineViewSet, basename="budget")

urlpatterns = [
    path("summary/", financial_summary),
    path("", include(router.urls)),
]
