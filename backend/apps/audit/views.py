from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer


class MyAuditLogView(generics.ListAPIView):
    """Returns current user's last 100 audit entries. Phase 3 admin view can extend this."""
    permission_classes = [IsAuthenticated]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user).order_by("-timestamp")[:100]