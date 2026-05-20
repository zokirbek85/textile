from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
    """Adds read-only audit fields to any serializer that inherits from it."""

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request and request.method in ("GET",):
            for field in fields.values():
                field.read_only = getattr(field, "read_only", False)
        return fields


class MoneyField(serializers.DecimalField):
    def __init__(self, **kwargs):
        kwargs.setdefault("max_digits", 20)
        kwargs.setdefault("decimal_places", 4)
        kwargs.setdefault("coerce_to_string", False)
        super().__init__(**kwargs)


class WeightField(serializers.DecimalField):
    """Represents KG values with 3 decimal precision."""

    def __init__(self, **kwargs):
        kwargs.setdefault("max_digits", 14)
        kwargs.setdefault("decimal_places", 3)
        kwargs.setdefault("coerce_to_string", False)
        super().__init__(**kwargs)
