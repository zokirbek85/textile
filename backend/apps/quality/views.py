from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from core.permissions import IsAdminOrDirector
from core.exceptions import BusinessLogicError
from .models import (
    QualityParameter, QualityTest, QualityCertificate, DefectType, QualityDefect,
)
from .serializers import (
    QualityParameterSerializer,
    QualityTestSerializer, QualityTestListSerializer, QualityTestCreateSerializer,
    QualityTestResultSerializer, QualityTestResultUpdateSerializer,
    RejectTestSerializer, IssueCertificateSerializer,
    QualityCertificateSerializer, CancelCertificateSerializer,
    DefectTypeSerializer,
    QualityDefectSerializer, QualityDefectCreateSerializer, ResolveDefectSerializer,
)
from . import services


class QualityParameterViewSet(viewsets.ModelViewSet):
    queryset = QualityParameter.objects.all()
    serializer_class = QualityParameterSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["applies_to", "data_type", "is_active", "is_critical"]
    search_fields = ["parameter_code", "parameter_name_uz", "parameter_name_en"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["get"], url_path="by-product/(?P<product_type>[^/.]+)")
    def by_product(self, request, product_type=None):
        qs = self.queryset.filter(applies_to=product_type, is_active=True)
        serializer = QualityParameterSerializer(qs, many=True)
        return Response(serializer.data)


class QualityTestViewSet(viewsets.ModelViewSet):
    queryset = (
        QualityTest.objects.all()
        .select_related("production_batch", "product", "tested_by", "sample_taken_by", "reviewed_by")
        .prefetch_related("test_results__parameter")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["test_type", "overall_result", "approved_for_use", "rejected"]
    search_fields = ["test_number", "product__name"]
    ordering_fields = ["test_date", "created_at"]
    ordering = ["-test_date"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return QualityTestListSerializer
        if self.action == "create":
            return QualityTestCreateSerializer
        return QualityTestSerializer

    def perform_create(self, serializer):
        validated = serializer.validated_data
        batch = validated.get("production_batch")
        if batch:
            test = services.create_test_for_batch(
                batch=batch,
                test_type=validated["test_type"],
                tested_by=validated.get("tested_by", self.request.user),
                sample_size_kg=validated["sample_size_kg"],
                sample_taken_by=validated.get("sample_taken_by"),
                lab_equipment=validated.get("lab_equipment", ""),
            )
            # No further save needed — already done in service
            return
        serializer.save(
            test_number=QualityTest.generate_test_number(),
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        batch = validated.get("production_batch")
        if batch:
            test = services.create_test_for_batch(
                batch=batch,
                test_type=validated["test_type"],
                tested_by=validated.get("tested_by", request.user),
                sample_size_kg=validated["sample_size_kg"],
                sample_taken_by=validated.get("sample_taken_by"),
                lab_equipment=validated.get("lab_equipment", ""),
            )
            return Response(QualityTestSerializer(test).data, status=status.HTTP_201_CREATED)
        instance = serializer.save(
            test_number=QualityTest.generate_test_number(),
            created_by=request.user,
        )
        return Response(QualityTestSerializer(instance).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="evaluate")
    def evaluate(self, request, pk=None):
        """Evaluate all entered parameter results → set overall pass/fail and grade."""
        test = self.get_object()
        try:
            test = services.evaluate_test_results(test, request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityTestSerializer(test).data)

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        """Alias for evaluate — evaluate results and finalize."""
        test = self.get_object()
        try:
            test = services.evaluate_test_results(test, request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityTestSerializer(test).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        test = self.get_object()
        try:
            test = services.approve_test(test, request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityTestSerializer(test).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        serializer = RejectTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test = self.get_object()
        try:
            test = services.reject_test(test, serializer.validated_data["reason"], request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityTestSerializer(test).data)

    @action(detail=True, methods=["post"], url_path="issue-certificate")
    def issue_certificate(self, request, pk=None):
        serializer = IssueCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        test = self.get_object()
        try:
            cert = services.issue_certificate(
                test, request.user, serializer.validated_data.get("complies_with", "")
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityCertificateSerializer(cert).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="results/(?P<result_id>[^/.]+)")
    def update_result(self, request, pk=None, result_id=None):
        """Update a single parameter result by its UUID."""
        test = self.get_object()
        try:
            result = test.test_results.get(id=result_id)
        except Exception:
            return Response({"detail": "Natija topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        serializer = QualityTestResultUpdateSerializer(result, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(QualityTestResultSerializer(result).data)


class QualityCertificateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        QualityCertificate.objects.all()
        .select_related("production_batch", "product", "quality_test", "issued_by", "approved_by")
    )
    serializer_class = QualityCertificateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["quality_grade", "is_active"]
    search_fields = ["certificate_number", "product__name"]
    ordering_fields = ["issue_date", "created_at"]
    ordering = ["-issue_date"]
    lookup_field = "certificate_number"

    def get_permissions(self):
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, certificate_number=None):
        serializer = CancelCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cert = self.get_object()
        try:
            cert = services.cancel_certificate(cert, serializer.validated_data["reason"], request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityCertificateSerializer(cert).data)


class DefectTypeViewSet(viewsets.ModelViewSet):
    queryset = DefectType.objects.all()
    serializer_class = DefectTypeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["severity", "applies_to", "auto_reject", "is_active"]
    search_fields = ["defect_code", "defect_name_uz", "defect_name_en"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]


class QualityDefectViewSet(viewsets.ModelViewSet):
    queryset = (
        QualityDefect.objects.all()
        .select_related("production_batch", "defect_type", "detected_by", "resolved_by")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "detection_stage", "defect_type__severity"]
    search_fields = ["defect_number", "description"]
    ordering_fields = ["detected_date", "created_at"]
    ordering = ["-detected_date"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return QualityDefectCreateSerializer
        return QualityDefectSerializer

    def create(self, request, *args, **kwargs):
        serializer = QualityDefectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            defect = services.log_defect(
                batch=v["production_batch"],
                defect_type=v["defect_type"],
                quantity_kg=v["quantity_affected_kg"],
                detected_by=v.get("detected_by", request.user),
                description=v.get("description", ""),
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        defect.photo = v.get("photo")
        if defect.photo:
            defect.save(update_fields=["photo"])
        return Response(QualityDefectSerializer(defect).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        serializer = ResolveDefectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        defect = self.get_object()
        try:
            defect = services.resolve_defect(
                defect,
                disposition=serializer.validated_data["disposition"],
                root_cause=serializer.validated_data["root_cause"],
                corrective_action=serializer.validated_data["corrective_action"],
                user=request.user,
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(QualityDefectSerializer(defect).data)


class QualityAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_dates(self, request):
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        return start, end

    @action(detail=False, methods=["get"], url_path="pass-rate")
    def pass_rate(self, request):
        start, end = self._get_dates(request)
        return Response(services.get_pass_rate(start, end))

    @action(detail=False, methods=["get"], url_path="defects-by-type")
    def defects_by_type(self, request):
        start, end = self._get_dates(request)
        return Response(services.get_defects_by_type(start, end))

    @action(detail=False, methods=["get"], url_path="grade-distribution")
    def grade_distribution(self, request):
        start, end = self._get_dates(request)
        return Response(services.get_grade_distribution(start, end))

    @action(detail=False, methods=["get"], url_path="compliance-score")
    def compliance_score(self, request):
        return Response(services.get_compliance_score())
