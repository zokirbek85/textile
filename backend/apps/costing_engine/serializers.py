from rest_framework import serializers
from .models import CostSnapshot


class CostSnapshotSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = CostSnapshot
        fields = [
            "id", "stage", "stage_display", "reference_type", "reference_id",
            "snapshot_date", "input_kg", "input_cost",
            "output_kg", "output_cost_per_kg", "total_output_cost",
            "expenses_breakdown", "yield_pct", "waste_pct",
            "product", "product_name", "created_at",
        ]
        read_only_fields = fields
