from django.contrib import admin
from .models import ChatSession, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model           = ChatMessage
    extra           = 0
    readonly_fields = ["role", "content", "created_at"]
    can_delete      = False
    max_num         = 0
    fields          = ["role", "content", "created_at"]


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display    = ["user", "title", "model_used", "created_at", "updated_at"]
    list_filter     = ["model_used"]
    search_fields   = ["user__email", "title"]
    readonly_fields = ["user", "model_used", "created_at", "updated_at"]
    inlines         = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display    = ["session", "role", "created_at"]
    list_filter     = ["role"]
    search_fields   = ["session__user__email", "content"]
    readonly_fields = ["session", "role", "content", "context_chunks", "created_at"]