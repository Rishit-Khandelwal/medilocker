from datetime import date
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.accounts.permissions import IsDoctor
from .models import Appointment, Medication
from .serializers import AppointmentSerializer, MedicationSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = AppointmentSerializer
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ["status"]
    search_fields      = ["doctor_name", "hospital", "notes"]
    ordering_fields    = ["date", "created_at"]
    ordering           = ["-date"]

    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class MedicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = MedicationSerializer
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ["is_active"]
    search_fields      = ["medicine", "dose", "frequency"]
    ordering_fields    = ["start_date", "created_at"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Medication.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class TimelineView(APIView):
    """
    Merged chronological feed of records, appointments, and medications.
    GET /api/timeline/feed/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = []

        try:
            from apps.records.models import MedicalRecord
            for r in MedicalRecord.objects.filter(owner=request.user):
                items.append({
                    "type":     "record",
                    "id":       r.id,
                    "title":    r.title,
                    "subtitle": r.get_category_display(),
                    "date":     r.uploaded_at.isoformat(),
                    "meta":     {"category": r.category},
                })
        except Exception:
            pass

        for a in Appointment.objects.filter(patient=request.user):
            items.append({
                "type":     "appointment",
                "id":       a.id,
                "title":    f"Appointment with Dr. {a.doctor_name}",
                "subtitle": a.hospital or "No hospital specified",
                "date":     a.date.isoformat(),
                "meta":     {"status": a.status},
            })

        for m in Medication.objects.filter(patient=request.user):
            items.append({
                "type":     "medication",
                "id":       m.id,
                "title":    m.medicine,
                "subtitle": f"{m.dose} · {m.frequency}",
                "date":     m.start_date.isoformat() if m.start_date else "",
                "meta":     {"is_active": str(m.is_active)},
            })

        items.sort(key=lambda x: x.get("date") or "", reverse=True)
        return Response(items)


class PatientTimelineStatsView(APIView):
    """
    Patient dashboard: live counts and next 3 upcoming appointments.
    GET /api/timeline/patient-stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        upcoming = Appointment.objects.filter(
            patient=request.user,
            date__gt=now,
            status=Appointment.Status.SCHEDULED,
        ).order_by("date")[:3]

        return Response({
            "total_appointments": Appointment.objects.filter(patient=request.user).count(),
            "upcoming":           AppointmentSerializer(upcoming, many=True).data,
            "total_medications":  Medication.objects.filter(patient=request.user).count(),
            "active_medications": Medication.objects.filter(patient=request.user, is_active=True).count(),
        })


class DoctorDashboardView(APIView):
    """
    DOCTOR only. Today's appointments, recent consultations,
    upcoming appointments, prescriptions, emergency cases.
    GET /api/timeline/doctor-dashboard/
    """
    permission_classes = [IsDoctor]

    def get(self, request):
        today = date.today()

        today_appts = Appointment.objects.filter(
            doctor_user=request.user,
            date__date=today,
        ).select_related("patient").order_by("date")

        recent = Appointment.objects.filter(
            doctor_user=request.user,
            date__date__lt=today,
        ).select_related("patient").order_by("-date")[:6]

        upcoming = Appointment.objects.filter(
            doctor_user=request.user,
            date__date__gt=today,
            status=Appointment.Status.SCHEDULED,
        ).select_related("patient").order_by("date")[:5]

        prescriptions = Medication.objects.filter(
            prescribed_by=request.user,
        ).select_related("patient").order_by("-created_at")[:8]

        emergency_cases = []
        try:
            from apps.audit.models import AuditLog
            rows = AuditLog.objects.filter(
                action=AuditLog.ACTION_EMERGENCY_ACCESS,
            ).order_by("-timestamp").values(
                "id", "timestamp", "ip_address", "resource_id", "extra",
            )[:5]
            emergency_cases = [
                {**r, "timestamp": r["timestamp"].isoformat()}
                for r in rows
            ]
        except Exception:
            pass

        return Response({
            "today_count":    today_appts.count(),
            "today":          AppointmentSerializer(today_appts, many=True).data,
            "recent":         AppointmentSerializer(recent,      many=True).data,
            "upcoming":       AppointmentSerializer(upcoming,    many=True).data,
            "prescriptions":  MedicationSerializer(prescriptions, many=True).data,
            "emergency_cases": emergency_cases,
            "total_patients": Appointment.objects.filter(
                doctor_user=request.user
            ).values("patient").distinct().count(),
        })