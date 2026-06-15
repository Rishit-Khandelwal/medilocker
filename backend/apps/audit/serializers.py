from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email     = serializers.CharField(source="user.email",              read_only=True)
    action_display = serializers.CharField(source="get_action_display",      read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            "id", "user_email", "action", "action_display",
            "resource_type", "resource_id", "ip_address",
            "user_agent", "extra", "timestamp",
        ]