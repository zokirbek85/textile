import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Each authenticated user joins their personal group: notifications_<user_id>.
    Dashboard clients can additionally subscribe to the global production channel.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = str(user.id)
        self.user_group = f"notifications_{self.user_id}"
        self.production_group = "production_updates"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.channel_layer.group_add(self.production_group, self.channel_name)
        await self.accept()

        # Send unread count on connect
        unread = await self._get_unread_count()
        await self.send(json.dumps({"type": "unread_count", "count": unread}))
        logger.info("WS connect: user=%s", self.user_id)

    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
            await self.channel_layer.group_discard(self.production_group, self.channel_name)
        logger.info("WS disconnect: user=%s code=%s", getattr(self, "user_id", "?"), close_code)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get("action")
        if action == "mark_read":
            notification_id = data.get("id")
            if notification_id:
                await self._mark_read(notification_id)
                unread = await self._get_unread_count()
                await self.send(json.dumps({"type": "unread_count", "count": unread}))

    # ── Handlers for group messages ──────────────────────────────────────────

    async def notification_message(self, event):
        await self.send(json.dumps({
            "type": "notification",
            "data": event["data"],
        }))

    async def production_update(self, event):
        await self.send(json.dumps({
            "type": "production_update",
            "data": event["data"],
        }))

    # ── DB helpers ───────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_unread_count(self) -> int:
        from .models import Notification
        return Notification.objects.filter(recipient_id=self.user_id, is_read=False).count()

    @database_sync_to_async
    def _mark_read(self, notification_id: str):
        from .models import Notification
        Notification.objects.filter(id=notification_id, recipient_id=self.user_id).update(is_read=True)
