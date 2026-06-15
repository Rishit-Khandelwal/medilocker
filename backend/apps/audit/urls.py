from django.urls import path
from .views import MyAuditLogView

urlpatterns = [
    path("my/", MyAuditLogView.as_view(), name="my-audit-log"),
]