from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name               = "apps.notifications"
    label              = "notifications"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from .signals import register_signals
        register_signals()