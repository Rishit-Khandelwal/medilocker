from django.contrib import admin
from .models import Appointment, Medication


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display  = ["patient", "doctor_name", "hospital", "date", "status", "doctor_user"]
    list_filter   = ["status", "date"]
    search_fields = ["patient__email", "doctor_name", "hospital"]
    ordering      = ["-date"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display  = ["patient", "medicine", "dose", "frequency", "is_active", "start_date"]
    list_filter   = ["is_active", "start_date"]
    search_fields = ["patient__email", "medicine"]
    ordering      = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]