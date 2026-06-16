from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdmin, IsResponderOrAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class MyAuditLogView(generics.ListAPIView):
    """Returns current user's last 100 audit entries."""
    permission_classes = [IsAuthenticated]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user).order_by("-timestamp")[:100]


class RecentAuditLogView(generics.ListAPIView):
    """Admin/SuperAdmin only — last 50 audit entries across all users. Used by Admin dashboard."""
    permission_classes = [IsAdmin]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.all().order_by("-timestamp")[:50]


class EmergencyAccessLogView(generics.ListAPIView):
    """Responder/Admin/SuperAdmin — recent EMERGENCY_ACCESS events. Used by Responder dashboard."""
    permission_classes = [IsResponderOrAdmin]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(
            action=AuditLog.ACTION_EMERGENCY_ACCESS
        ).order_by("-timestamp")[:30]