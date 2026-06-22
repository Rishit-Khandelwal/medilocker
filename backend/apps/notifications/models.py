from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        UPLOAD_COMPLETE      = "UPLOAD_COMPLETE",      "Upload Complete"
        APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER", "Appointment Reminder"
        MEDICINE_REMINDER    = "MEDICINE_REMINDER",    "Medicine Reminder"
        EMERGENCY_TOKEN_USED = "EMERGENCY_TOKEN_USED", "Emergency Token Used"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications",
    )
    type    = models.CharField(max_length=30, choices=Type.choices, db_index=True)
    title   = models.CharField(max_length=200)
    body    = models.TextField(blank=True)
    link    = models.CharField(max_length=300, blank=True, help_text="Frontend route to open on click")
    is_read = models.BooleanField(default=False, db_index=True)
    # Future-proof slot — e.g. richer payloads if email/push channels are added later
    extra      = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self):
        return f"{self.type} → {self.recipient_id} ({'read' if self.is_read else 'unread'})"


class ReminderLog(models.Model):
    """
    Dedup guard so beat tasks never re-send the same reminder twice. Kept as
    its own model — rather than a field on Appointment/Medication — so the
    Phase 5 models stay completely untouched.
    """
    appointment = models.ForeignKey(
        "timeline.Appointment", on_delete=models.CASCADE,
        null=True, blank=True, related_name="reminder_logs",
    )
    medication = models.ForeignKey(
        "timeline.Medication", on_delete=models.CASCADE,
        null=True, blank=True, related_name="reminder_logs",
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["appointment"]),
            models.Index(fields=["medication", "sent_at"]),
        ]