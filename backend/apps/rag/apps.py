from django.apps import AppConfig


class RagConfig(AppConfig):
    name               = "apps.rag"
    label              = "rag"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from .signals import register_signals
        register_signals()