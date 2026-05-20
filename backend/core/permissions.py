from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsAdminOrDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "director")


class IsAccountant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "admin", "director", "accountant"
        )


class IsProductionManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "admin", "director", "production_manager"
        )


class IsWarehouseManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            "admin", "director", "warehouse_manager", "production_manager"
        )


class ReadOnlyOrAdmin(BasePermission):
    """Read access for all authenticated users; write only for admins."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ("admin", "director")


class HasModulePermission(BasePermission):
    """
    Check granular module permissions stored on the user's role.
    Usage: set `required_permission = "warehouse.view_stock"` on the view.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        required = getattr(view, "required_permission", None)
        if not required:
            return True
        return request.user.has_module_permission(required)
