from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display    = ["action", "user", "resource_type", "resource_id", "ip_address", "timestamp"]
    list_filter     = ["action", "resource_type"]
    search_fields   = ["user__email", "resource_id", "ip_address"]
    readonly_fields = ["user", "action", "resource_type", "resource_id",
                       "ip_address", "user_agent", "extra", "timestamp"]
    ordering        = ["-timestamp"]

    def has_add_permission(self, request):    return False
    def has_change_permission(self, request, obj=None): return False