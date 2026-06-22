from django.contrib import admin
from .models import Notification, ReminderLog


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display    = ["recipient", "type", "title", "is_read", "created_at"]
    list_filter     = ["type", "is_read"]
    search_fields   = ["recipient__email", "title"]
    readonly_fields = ["recipient", "type", "title", "body", "link", "extra", "created_at"]


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ["appointment", "medication", "sent_at"]