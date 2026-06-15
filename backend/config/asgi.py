import os
from django.core.asgi import get_asgi_application
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
# Phase 6: replace with channels ProtocolTypeRouter
application = get_asgi_application()