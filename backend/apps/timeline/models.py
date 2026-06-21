from django.conf import settings
from django.db import models
from django.utils import timezone


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED   = "SCHEDULED",   "Scheduled"
        COMPLETED   = "COMPLETED",   "Completed"
        CANCELLED   = "CANCELLED",   "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    # Optional link to a registered DOCTOR — enables the doctor dashboard views.
    # Set automatically when patient enters the doctor's MediLocker email.
    doctor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="doctor_appointments",
    )
    doctor_name = models.CharField(max_length=200)
    hospital    = models.CharField(max_length=200, blank=True)
    date        = models.DateTimeField()
    notes       = models.TextField(blank=True)
    status      = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.patient.email} → Dr. {self.doctor_name} @ {self.date:%Y-%m-%d %H:%M}"

    @property
    def is_upcoming(self):
        return self.status == self.Status.SCHEDULED and self.date > timezone.now()


class Medication(models.Model):
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_medications",
    )
    # Set when a registered doctor prescribes via the app — Phase 6+
    prescribed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="prescribed_medications",
    )
    medicine   = models.CharField(max_length=200)
    dose       = models.CharField(max_length=100)
    frequency  = models.CharField(max_length=100, help_text="e.g. Once daily after meals")
    start_date = models.DateField()
    end_date   = models.DateField(null=True, blank=True)
    notes      = models.TextField(blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.medicine} ({self.dose}) — {self.patient.email}"