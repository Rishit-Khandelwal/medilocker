from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AppointmentViewSet, MedicationViewSet,
    TimelineView, PatientTimelineStatsView, DoctorDashboardView,
)

router = DefaultRouter()
router.register("appointments", AppointmentViewSet, basename="appointments")
router.register("medications",  MedicationViewSet,  basename="medications")

urlpatterns = [
    path("", include(router.urls)),
    path("feed/",             TimelineView.as_view(),             name="timeline-feed"),
    path("patient-stats/",    PatientTimelineStatsView.as_view(), name="timeline-patient-stats"),
    path("doctor-dashboard/", DoctorDashboardView.as_view(),      name="doctor-dashboard"),
]
# Endpoints:
#   GET/POST          /api/timeline/appointments/
#   GET/PATCH/DELETE  /api/timeline/appointments/{id}/
#   GET/POST          /api/timeline/medications/
#   GET/PATCH/DELETE  /api/timeline/medications/{id}/
#   GET               /api/timeline/feed/
#   GET               /api/timeline/patient-stats/
#   GET               /api/timeline/doctor-dashboard/    (DOCTOR role only)