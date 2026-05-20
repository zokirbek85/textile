from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.exceptions import BusinessLogicError, InsufficientStockError
from . import services
from .models import (
    TollingContract, TollingRawMaterialReceipt, TollingDelivery,
    TollingInvoice, ContractStatus, InvoiceStatus,
)
from .serializers import (
    TollingContractSerializer, TollingRawMaterialReceiptSerializer,
    TollingDeliverySerializer, TollingInvoiceSerializer,
)


class TollingContractViewSet(viewsets.ModelViewSet):
    queryset = TollingContract.objects.select_related(
        "target_yarn_product", "raw_material_warehouse", "finished_goods_warehouse"
    ).all()
    serializer_class = TollingContractSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "contract_type"]
    search_fields = ["contract_number", "customer_name", "customer_inn"]
    ordering = ["-contract_date"]

    def create(self, request, *args, **kwargs):
        serializer = TollingContractSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contract = services.create_contract(data=serializer.validated_data, user=request.user)
        return Response(TollingContractSerializer(contract).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        contract = self.get_object()
        contract.status = ContractStatus.ACTIVE
        contract.updated_by = request.user
        from django.db.models import Model
        Model.save(contract)
        return Response(TollingContractSerializer(contract).data)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        contract = self.get_object()
        contract.status = ContractStatus.SUSPENDED
        contract.updated_by = request.user
        from django.db.models import Model
        Model.save(contract)
        return Response(TollingContractSerializer(contract).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        contract = self.get_object()
        contract.status = ContractStatus.COMPLETED
        contract.updated_by = request.user
        from django.db.models import Model
        Model.save(contract)
        return Response(TollingContractSerializer(contract).data)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        stats = services.get_contract_statistics(pk)
        return Response(stats)

    @action(detail=True, methods=["get"])
    def receipts(self, request, pk=None):
        contract = self.get_object()
        qs = contract.raw_receipts.all()
        return Response(TollingRawMaterialReceiptSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def deliveries(self, request, pk=None):
        contract = self.get_object()
        qs = contract.deliveries.all()
        return Response(TollingDeliverySerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def invoices(self, request, pk=None):
        contract = self.get_object()
        qs = contract.invoices.all()
        return Response(TollingInvoiceSerializer(qs, many=True).data)


class TollingRawMaterialReceiptViewSet(viewsets.ModelViewSet):
    queryset = TollingRawMaterialReceipt.objects.select_related(
        "contract", "fiber_product", "received_by"
    ).all()
    serializer_class = TollingRawMaterialReceiptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["contract", "status"]
    search_fields = ["receipt_number", "ttn_number"]
    ordering = ["-receipt_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        receipt = self.get_object()
        try:
            receipt = services.receive_raw_material(receipt=receipt, user=request.user)
        except BusinessLogicError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TollingRawMaterialReceiptSerializer(receipt).data)


class TollingDeliveryViewSet(viewsets.ModelViewSet):
    queryset = TollingDelivery.objects.select_related(
        "contract", "yarn_batch", "delivered_by"
    ).all()
    serializer_class = TollingDeliverySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["contract", "status"]
    search_fields = ["delivery_number", "ttn_number"]
    ordering = ["-delivery_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        delivery = self.get_object()
        try:
            result = services.complete_delivery(delivery=delivery, user=request.user)
        except (BusinessLogicError, InsufficientStockError) as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "delivery": TollingDeliverySerializer(result["delivery"]).data,
            "invoice": TollingInvoiceSerializer(result["invoice"]).data,
        })


class TollingInvoiceViewSet(viewsets.ModelViewSet):
    queryset = TollingInvoice.objects.select_related(
        "contract", "yarn_batch", "delivery"
    ).all()
    serializer_class = TollingInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["contract", "status"]
    search_fields = ["invoice_number"]
    ordering = ["-invoice_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="record-payment")
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        try:
            amount = Decimal(str(request.data.get("amount", "0")))
        except Exception:
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({"detail": "Amount must be > 0"}, status=status.HTTP_400_BAD_REQUEST)

        invoice.paid_amount += amount
        if invoice.paid_amount >= invoice.total_amount:
            invoice.status = InvoiceStatus.PAID
        elif invoice.paid_amount > 0:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        invoice.updated_by = request.user
        invoice.save()
        return Response(TollingInvoiceSerializer(invoice).data)
