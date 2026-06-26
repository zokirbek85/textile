import logging
from django.db.models.deletion import ProtectedError
from django.db.utils import IntegrityError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        blockers = ", ".join(
            sorted({obj._meta.verbose_name for obj in exc.protected_objects[:5]})
        )
        return Response(
            {
                "status": "error",
                "status_code": 400,
                "errors": {
                    "detail": f"Cannot delete: still referenced by {blockers}."
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {
                "status": "error",
                "status_code": 400,
                "errors": {"detail": "Cannot complete: this would violate data integrity."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "status": "error",
            "status_code": response.status_code,
            "errors": response.data,
        }
        response.data = error_data
        return response

    logger.exception("Unhandled exception in view %s", context.get("view"))
    return Response(
        {
            "status": "error",
            "status_code": 500,
            "errors": {"detail": "Internal server error. Please contact support."},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


class BusinessLogicError(Exception):
    """Raised by service layer for domain violations."""

    def __init__(self, message: str, code: str = "business_logic_error"):
        self.message = message
        self.code = code
        super().__init__(message)


class InsufficientStockError(BusinessLogicError):
    def __init__(self, product: str, available: float, requested: float):
        super().__init__(
            f"Insufficient stock for {product}: available={available:.3f}, requested={requested:.3f}",
            code="insufficient_stock",
        )


class CostingError(BusinessLogicError):
    pass
