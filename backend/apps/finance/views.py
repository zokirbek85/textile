from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Q
from datetime import date

from core.permissions import IsAccountant
from .models import FinancialTransaction, BudgetLine
from .serializers import FinancialTransactionSerializer, BudgetLineSerializer


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    queryset = FinancialTransaction.objects.select_related("created_by").all()
    serializer_class = FinancialTransactionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["transaction_type", "is_expense", "transaction_date", "expense_category"]
    search_fields = ["description", "reference_id"]
    ordering_fields = ["transaction_date", "amount"]
    ordering = ["-transaction_date"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAccountant()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BudgetLineViewSet(viewsets.ModelViewSet):
    queryset = BudgetLine.objects.all()
    serializer_class = BudgetLineSerializer
    permission_classes = [IsAccountant]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["year", "month", "category"]
    ordering = ["year", "month", "category"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def financial_summary(request):
    start = request.query_params.get("start_date", date.today().replace(day=1).isoformat())
    end = request.query_params.get("end_date", date.today().isoformat())

    qs = FinancialTransaction.objects.filter(
        transaction_date__gte=start,
        transaction_date__lte=end,
    )

    total_expenses = qs.filter(is_expense=True).aggregate(t=Sum("amount"))["t"] or 0
    total_income = qs.filter(is_expense=False).aggregate(t=Sum("amount"))["t"] or 0

    expenses_by_category = {}
    for tx in qs.filter(is_expense=True):
        cat = tx.expense_category or tx.transaction_type
        expenses_by_category[cat] = expenses_by_category.get(cat, 0) + float(tx.amount)

    return Response({
        "period": {"start": start, "end": end},
        "total_expenses": total_expenses,
        "total_income": total_income,
        "net": float(total_income) - float(total_expenses),
        "expenses_by_category": expenses_by_category,
    })
