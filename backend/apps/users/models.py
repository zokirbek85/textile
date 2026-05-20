from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
import uuid


ROLE_CHOICES = [
    ("admin", "Admin"),
    ("director", "Director"),
    ("accountant", "Accountant"),
    ("production_manager", "Production Manager"),
    ("warehouse_manager", "Warehouse Manager"),
    ("lab_operator", "Lab Operator"),
    ("sales_manager", "Sales Manager"),
]

# Default module permissions per role
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": ["*"],
    "director": [
        "dashboard.view", "warehouse.view", "production.view",
        "costing.view", "finance.view", "reports.view", "users.view",
    ],
    "accountant": [
        "dashboard.view", "costing.view", "costing.edit",
        "finance.view", "finance.edit", "reports.view",
    ],
    "production_manager": [
        "dashboard.view", "warehouse.view", "production.view",
        "production.edit", "reports.view",
    ],
    "warehouse_manager": [
        "dashboard.view", "warehouse.view", "warehouse.edit", "reports.view",
    ],
    "lab_operator": [
        "dashboard.view", "production.view", "production.edit",
    ],
    "sales_manager": [
        "dashboard.view", "warehouse.view", "reports.view",
    ],
}


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str = None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="lab_operator")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)

    # Custom per-user permission overrides (JSON list of perm strings)
    custom_permissions = models.JSONField(default=list, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        db_table = "users"
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def has_module_permission(self, permission: str) -> bool:
        if self.role == "admin" or self.is_superuser:
            return True
        role_perms = ROLE_PERMISSIONS.get(self.role, [])
        if "*" in role_perms or permission in role_perms:
            return True
        return permission in (self.custom_permissions or [])


class ActivityLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="activity_logs")
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} | {self.action} | {self.model_name}"
