from django.urls import path
from .views import MyAuditLogView, RecentAuditLogView, EmergencyAccessLogView

urlpatterns = [
    path("my/",                 MyAuditLogView.as_view(),        name="my-audit-log"),
    path("recent/",             RecentAuditLogView.as_view(),    name="audit-recent"),
    path("emergency-accesses/", EmergencyAccessLogView.as_view(), name="audit-emergency-accesses"),
]