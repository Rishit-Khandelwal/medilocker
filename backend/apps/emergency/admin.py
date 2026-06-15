from django.contrib import admin
from .models import EmergencyContact, EmergencyToken


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display  = ["name", "patient", "relationship", "phone", "is_primary"]
    list_filter   = ["relationship", "is_primary"]
    search_fields = ["name", "patient__email", "phone"]


@admin.register(EmergencyToken)
class EmergencyTokenAdmin(admin.ModelAdmin):
    list_display  = ["patient", "label", "status", "created_at", "expires_at", "used_at", "accessed_by_ip"]
    list_filter   = ["is_revoked"]
    search_fields = ["patient__email", "label"]
    readonly_fields = ["token", "created_at", "expires_at", "used_at", "accessed_by_ip"]

    def status(self, obj):
        return obj.status
    status.short_description = "Status"