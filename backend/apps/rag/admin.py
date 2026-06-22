from django.contrib import admin
from .models import DocumentOCRStatus, DocumentChunk


@admin.register(DocumentOCRStatus)
class DocumentOCRStatusAdmin(admin.ModelAdmin):
    list_display   = ["record", "status", "method", "chunk_count", "text_length", "processed_at"]
    list_filter    = ["status", "method"]
    search_fields  = ["record__title", "record__owner__email"]
    readonly_fields = ["record", "status", "method", "text_length", "chunk_count",
                       "error_message", "processed_at", "created_at"]

    def has_add_permission(self, request):
        return False


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display  = ["record", "chunk_index", "word_count", "qdrant_point_id", "created_at"]
    search_fields = ["record__title", "text"]
    readonly_fields = ["record", "chunk_index", "text", "qdrant_point_id", "word_count", "created_at"]

    def has_add_permission(self, request):
        return False