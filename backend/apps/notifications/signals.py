"""
Django signals that trigger WebSocket pushes when key events happen.
Wire these up in apps.py ready() method.
"""
import json
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def push_notification_to_user(user_id: str, title: str, message: str,
                               level: str = "info", event_type: str = "system",
                               reference_type: str = "", reference_id: str = ""):
    """Create a DB notification and push it live over WebSocket."""
    from .models import Notification
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
        notif = Notification.objects.create(
            recipient=user,
            level=level,
            event_type=event_type,
            title=title,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id,
        )
        channel_layer = get_channel_layer()
        group_name = f"notifications_{user_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notification_message",
                "data": {
                    "id": str(notif.id),
                    "level": level,
                    "event_type": event_type,
                    "title": title,
                    "message": message,
                    "created_at": notif.created_at.isoformat(),
                },
            },
        )
    except Exception as exc:
        logger.error("Failed to push notification: %s", exc)


def push_production_update(event_data: dict):
    """Broadcast a production update to all connected dashboard clients."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "production_updates",
            {"type": "production_update", "data": event_data},
        )
    except Exception as exc:
        logger.error("Failed to push production update: %s", exc)


def on_cotton_batch_completed(sender, instance, **kwargs):
    if instance.status == "completed":
        push_production_update({
            "event": "cotton_batch_completed",
            "batch_code": instance.batch_code,
            "fiber_kg": float(instance.fiber_output_kg),
            "fiber_cost_per_kg": float(instance.calculated_fiber_cost_per_kg),
        })


def on_yarn_batch_completed(sender, instance, **kwargs):
    if instance.status == "completed":
        push_production_update({
            "event": "yarn_batch_completed",
            "batch_code": instance.batch_code,
            "yarn_kg": float(instance.yarn_output_kg),
            "yarn_cost_per_kg": float(instance.calculated_yarn_cost_per_kg),
        })
