from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    label = "notifications"

    def ready(self):
        from django.db.models.signals import post_save
        from apps.cotton_production.models import CottonBatch
        from apps.yarn_production.models import YarnBatch
        from .signals import on_cotton_batch_completed, on_yarn_batch_completed

        post_save.connect(on_cotton_batch_completed, sender=CottonBatch)
        post_save.connect(on_yarn_batch_completed, sender=YarnBatch)
