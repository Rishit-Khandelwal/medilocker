from django.contrib import admin
from .models import MedicalRecord


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display   = ["title", "owner", "category", "file_size_display", "version", "uploaded_at"]
    list_filter    = ["category", "uploaded_at"]
    search_fields  = ["title", "owner__email", "tags"]
    readonly_fields = ["original_filename", "mime_type", "file_size", "version", "uploaded_at", "updated_at"]