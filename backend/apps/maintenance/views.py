from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions import IsAdminOrDirector
from core.exceptions import BusinessLogicError
from .models import (
    Equipment, SparePart, MaintenanceSchedule, MaintenanceRecord,
    EquipmentDowntime, OEEMeasurement,
)
from .serializers import (
    EquipmentSerializer, EquipmentListSerializer, UpdateEquipmentStatusSerializer,
    SparePartSerializer, RestockSerializer,
    MaintenanceScheduleSerializer,
    MaintenanceRecordSerializer, MaintenanceRecordListSerializer, MaintenanceRecordCreateSerializer,
    CompleteMaintSerializer, UsePartSerializer,
    EquipmentDowntimeSerializer, DowntimeCreateSerializer, ResolveDowntimeSerializer,
    OEEMeasurementSerializer, CalculateOEESerializer,
)
from . import services


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = (
        Equipment.objects.all()
        .select_related("production_line")
        .order_by("equipment_code")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "equipment_type", "production_line", "is_active"]
    search_fields = ["equipment_code", "equipment_name", "manufacturer", "model"]
    ordering_fields = ["equipment_code", "next_maintenance_due"]

    def get_serializer_class(self):
        if self.action == "list":
            return EquipmentListSerializer
        return EquipmentSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        equip = self.get_object()
        ser = UpdateEquipmentStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            equip = services.update_equipment_status(equip, ser.validated_data["status"], request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(EquipmentSerializer(equip).data)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        equip = self.get_object()
        records = equip.maintenance_records.all().order_by("-scheduled_date")[:20]
        return Response(MaintenanceRecordListSerializer(records, many=True).data)

    @action(detail=True, methods=["get"], url_path="oee")
    def oee_trend(self, request, pk=None):
        equip = self.get_object()
        measurements = equip.oee_measurements.all().order_by("-measurement_date")[:30]
        return Response(OEEMeasurementSerializer(measurements, many=True).data)

    @action(detail=True, methods=["get"], url_path="downtime")
    def downtime_list(self, request, pk=None):
        equip = self.get_object()
        downtimes = equip.downtimes.all().order_by("-start_time")[:20]
        return Response(EquipmentDowntimeSerializer(downtimes, many=True).data)


class SparePartViewSet(viewsets.ModelViewSet):
    queryset = SparePart.objects.all().order_by("category", "part_code")
    serializer_class = SparePartSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["category", "is_critical", "is_active"]
    search_fields = ["part_code", "part_name", "category"]

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAdminOrDirector()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        parts = SparePart.objects.filter(
            current_stock__lte=__import__("django.db.models", fromlist=["F"]).F("minimum_stock"),
            is_active=True
        ).order_by("is_critical", "part_code")
        return Response(SparePartSerializer(parts, many=True).data)

    @action(detail=True, methods=["post"], url_path="restock")
    def restock(self, request, pk=None):
        part = self.get_object()
        ser = RestockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        part = services.restock_spare_part(part, ser.validated_data["quantity"], request.user)
        return Response(SparePartSerializer(part).data)


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceSchedule.objects.all().select_related("equipment")
    serializer_class = MaintenanceScheduleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["equipment", "maintenance_type", "is_active"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming(self, request):
        from django.utils import timezone
        from datetime import timedelta
        days = int(request.query_params.get("days", 30))
        cutoff = timezone.now().date() + timedelta(days=days)
        equipment_qs = Equipment.objects.filter(
            is_active=True,
            next_maintenance_due__lte=cutoff,
        ).select_related("production_line").order_by("next_maintenance_due")
        return Response(EquipmentListSerializer(equipment_qs, many=True).data)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        MaintenanceRecord.objects.all()
        .select_related("equipment", "assigned_technician", "approved_by")
        .prefetch_related("part_usages__spare_part")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "maintenance_type", "equipment"]
    search_fields = ["record_number", "equipment__equipment_code"]
    ordering_fields = ["scheduled_date", "created_at"]
    ordering = ["-scheduled_date"]

    def get_serializer_class(self):
        if self.action == "list":
            return MaintenanceRecordListSerializer
        if self.action == "create":
            return MaintenanceRecordCreateSerializer
        return MaintenanceRecordSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        ser = MaintenanceRecordCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            record = services.create_maintenance_record(
                equipment=v["equipment"],
                maintenance_type=v["maintenance_type"],
                scheduled_date=v["scheduled_date"],
                scheduled_duration_hours=v["scheduled_duration_hours"],
                assigned_technician=v["assigned_technician"],
                user=request.user,
                work_description=v.get("work_description", ""),
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MaintenanceRecordSerializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="start")
    def start(self, request, pk=None):
        record = self.get_object()
        try:
            record = services.start_maintenance(record, request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MaintenanceRecordSerializer(record).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        record = self.get_object()
        ser = CompleteMaintSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            record = services.complete_maintenance(
                record,
                work_description=v["work_description"],
                equipment_status_after=v["equipment_status_after"],
                test_run_successful=v["test_run_successful"],
                labor_cost=v["labor_cost_uzs"],
                user=request.user,
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MaintenanceRecordSerializer(record).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        record = self.get_object()
        try:
            record = services.approve_maintenance(record, request.user)
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MaintenanceRecordSerializer(record).data)

    @action(detail=True, methods=["post"], url_path="use-part")
    def use_part(self, request, pk=None):
        record = self.get_object()
        ser = UsePartSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            part = SparePart.objects.get(id=v["spare_part"])
        except SparePart.DoesNotExist:
            return Response({"detail": "Ehtiyot qism topilmadi."}, status=status.HTTP_404_NOT_FOUND)
        try:
            usage = services.use_spare_part(
                record, part, v["quantity"], v["removed_part_condition"], request.user
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        from .serializers import MaintenancePartUsageSerializer
        return Response(MaintenancePartUsageSerializer(usage).data, status=status.HTTP_201_CREATED)


class EquipmentDowntimeViewSet(viewsets.ModelViewSet):
    queryset = (
        EquipmentDowntime.objects.all()
        .select_related("equipment", "reported_by", "resolved_by")
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "downtime_type", "equipment"]
    search_fields = ["downtime_number", "reason"]
    ordering_fields = ["start_time", "created_at"]
    ordering = ["-start_time"]

    def get_serializer_class(self):
        if self.action == "create":
            return DowntimeCreateSerializer
        return EquipmentDowntimeSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        ser = DowntimeCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            downtime = services.report_downtime(
                equipment=v["equipment"],
                downtime_type=v["downtime_type"],
                reason=v["reason"],
                reported_by=v.get("reported_by", request.user),
                start_time=v.get("start_time"),
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if v.get("problem_description"):
            downtime.problem_description = v["problem_description"]
            downtime.save(update_fields=["problem_description"])
        return Response(EquipmentDowntimeSerializer(downtime).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request, pk=None):
        downtime = self.get_object()
        ser = ResolveDowntimeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        try:
            downtime = services.resolve_downtime(
                downtime, v["action_taken"], v["production_loss_kg"], request.user
            )
        except BusinessLogicError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(EquipmentDowntimeSerializer(downtime).data)

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        return Response(services.get_downtime_analytics(start, end))


class OEEViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OEEMeasurement.objects.all().select_related("equipment")
    serializer_class = OEEMeasurementSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["equipment", "shift"]
    ordering_fields = ["measurement_date"]
    ordering = ["-measurement_date"]

    def get_permissions(self):
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], url_path="calculate")
    def calculate(self, request):
        ser = CalculateOEESerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            equipment = Equipment.objects.get(id=ser.validated_data["equipment_id"])
            from apps.production.models import ProductionShiftReport
            shift_report = ProductionShiftReport.objects.get(id=ser.validated_data["shift_report_id"])
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        try:
            measurement = services.calculate_oee_for_shift(equipment, shift_report, request.user)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OEEMeasurementSerializer(measurement).data)

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        return Response(services.get_oee_dashboard())


class MaintenanceCostViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="cost-summary")
    def cost_summary(self, request):
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        return Response(services.get_maintenance_cost_summary(start, end))
