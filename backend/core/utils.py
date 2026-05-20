from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
import uuid


def round_money(value: Decimal, places: int = 4) -> Decimal:
    quantize_str = Decimal(10) ** -places
    return value.quantize(quantize_str, rounding=ROUND_HALF_UP)


def round_weight(value: Decimal, places: int = 3) -> Decimal:
    quantize_str = Decimal(10) ** -places
    return value.quantize(quantize_str, rounding=ROUND_HALF_UP)


def safe_divide(numerator: Decimal, denominator: Decimal, default: Decimal = Decimal("0")) -> Decimal:
    """Division that returns `default` instead of raising ZeroDivisionError."""
    if not denominator:
        return default
    return numerator / denominator


def generate_batch_code(prefix: str = "B") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def percentage(part: Decimal, whole: Decimal) -> Optional[Decimal]:
    if not whole:
        return None
    return round_money((part / whole) * 100, 2)
