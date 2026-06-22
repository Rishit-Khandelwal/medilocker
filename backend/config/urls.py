from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/",         admin.site.urls),
    path("api/auth/",      include("apps.accounts.urls")),
    path("api/records/",   include("apps.records.urls")),
    path("api/security/",  include("apps.audit.urls")),
    path("api/emergency/", include("apps.emergency.urls")),
    path("api/timeline/",  include("apps.timeline.urls")),
    path("api/notify/",    include("apps.notifications.urls")),
    path("api/search/",    include("apps.rag.urls")),
    path("api/ai/",        include("apps.ai_assistant.urls")),  # Phase 8
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)