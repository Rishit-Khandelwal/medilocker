from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/",      include("apps.accounts.urls")),
    path("api/records/",   include("apps.records.urls")),      # Phase 2
    path("api/security/",  include("apps.audit.urls")),        # Phase 3
    path("api/emergency/", include("apps.emergency.urls")),    # Phase 4
    # path("api/timeline/",  include("apps.timeline.urls")),     # Phase 5
    # path("api/notify/",    include("apps.notifications.urls")),# Phase 6
    # path("api/search/",    include("apps.rag.urls")),          # Phase 7
    # path("api/ai/",        include("apps.ai_assistant.urls")), # Phase 8
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)