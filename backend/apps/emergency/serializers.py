from django.utils import timezone
from rest_framework import serializers
from .models import EmergencyContact, EmergencyToken


class EmergencyContactSerializer(serializers.ModelSerializer):
    relationship_display = serializers.CharField(source="get_relationship_display", read_only=True)

    class Meta:
        model  = EmergencyContact
        fields = [
            "id", "name", "phone", "email",
            "relationship", "relationship_display",
            "is_primary", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EmergencyTokenSerializer(serializers.ModelSerializer):
    status         = serializers.ReadOnlyField()
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model  = EmergencyToken
        fields = [
            "id", "label", "token", "status", "time_remaining",
            "created_at", "expires_at", "used_at", "accessed_by_ip",
        ]
        read_only_fields = ["id", "token", "created_at", "expires_at", "used_at", "accessed_by_ip"]

    def get_time_remaining(self, obj):
        if obj.status != "active":
            return None
        return max(0, int((obj.expires_at - timezone.now()).total_seconds()))


class GenerateTokenInputSerializer(serializers.Serializer):
    label            = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    frontend_base_url = serializers.URLField(required=False, default="http://localhost:5173")