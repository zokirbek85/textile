from django.db import models
from core.models import TimeStampedModel


class Notification(TimeStampedModel):
    class Level(models.TextChoices):
        INFO = "info", "Info"
        SUCCESS = "success", "Success"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"

    class EventType(models.TextChoices):
        BATCH_COMPLETED = "batch_completed", "Batch Completed"
        BATCH_STARTED = "batch_started", "Batch Started"
        LOW_STOCK = "low_stock", "Low Stock Alert"
        COST_SPIKE = "cost_spike", "Cost Spike Alert"
        MACHINE_DOWNTIME = "machine_downtime", "Machine Downtime"
        SYSTEM = "system", "System"

    recipient = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="notifications"
    )
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.INFO)
    event_type = models.CharField(max_length=30, choices=EventType.choices, default=EventType.SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read", "created_at"])]

    def __str__(self):
        return f"[{self.level}] {self.title} → {self.recipient.email}"
