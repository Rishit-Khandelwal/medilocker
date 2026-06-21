from rest_framework import serializers
from .models import Appointment, Medication


class AppointmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_upcoming    = serializers.ReadOnlyField()
    patient_name   = serializers.SerializerMethodField()
    doctor_linked  = serializers.SerializerMethodField()
    # Write-only: auto-resolves to doctor_user FK if a verified DOCTOR matches
    doctor_email   = serializers.EmailField(
        required=False, allow_blank=True, write_only=True,
    )

    class Meta:
        model  = Appointment
        fields = [
            "id", "doctor_name", "doctor_email", "doctor_user", "doctor_linked",
            "hospital", "date", "notes", "status", "status_display",
            "is_upcoming", "patient_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "doctor_user", "created_at", "updated_at"]

    def get_patient_name(self, obj):
        name = f"{obj.patient.first_name} {obj.patient.last_name}".strip()
        return name or obj.patient.email

    def get_doctor_linked(self, obj):
        return obj.doctor_user_id is not None

    def validate(self, data):
        email = data.pop("doctor_email", None)
        if email:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                doctor = User.objects.get(email=email, role="DOCTOR", is_verified=True)
                data["doctor_user"] = doctor
                if not data.get("doctor_name"):
                    name = f"{doctor.first_name} {doctor.last_name}".strip() or doctor.username
                    data["doctor_name"] = name
            except User.DoesNotExist:
                pass  # Store name only — no account link
        return data


class MedicationSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Medication
        fields = [
            "id", "medicine", "dose", "frequency",
            "start_date", "end_date", "notes", "is_active",
            "prescribed_by", "prescribed_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "prescribed_by", "created_at", "updated_at"]

    def get_prescribed_by_name(self, obj):
        if not obj.prescribed_by:
            return None
        name = f"{obj.prescribed_by.first_name} {obj.prescribed_by.last_name}".strip()
        return f"Dr. {name}" if name else f"Dr. {obj.prescribed_by.username}"