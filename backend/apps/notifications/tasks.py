from datetime import timedelta

from asgiref.sync import async_to_sync
from celery import shared_task
from celery.utils.log import get_task_logger
from channels.layers import get_channel_layer
from django.utils import timezone

logger = get_task_logger(__name__)


@shared_task
def send_notification(user_id, notif_type, title, body="", link="", extra=None):
    """
    Creates a Notification row and pushes it over the user's WebSocket group
    in the same call — the single entry point every event source (signals,
    beat tasks) goes through.
    """
    from .models import Notification
    from .serializers import NotificationSerializer

    notification = Notification.objects.create(
        recipient_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        link=link,
        extra=extra or {},
    )

    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}_notifications",
            {"type": "notify", "data": NotificationSerializer(notification).data},
        )
    return notification.id


@shared_task
def check_appointment_reminders():
    """
    Runs every 15 minutes. Notifies patients of SCHEDULED appointments
    starting within the next hour — once per appointment, via ReminderLog.
    """
    from apps.timeline.models import Appointment
    from .models import Notification, ReminderLog

    now    = timezone.now()
    window = now + timedelta(hours=1)

    candidates = Appointment.objects.filter(
        status=Appointment.Status.SCHEDULED,
        date__gte=now,
        date__lte=window,
    ).exclude(
        id__in=ReminderLog.objects.filter(
            appointment__isnull=False
        ).values_list("appointment_id", flat=True)
    )

    sent = 0
    for appt in candidates:
        send_notification.delay(
            user_id=appt.patient_id,
            notif_type=Notification.Type.APPOINTMENT_REMINDER,
            title="Upcoming appointment",
            body=f"Appointment with Dr. {appt.doctor_name} at {appt.date.strftime('%I:%M %p')}.",
            link="/appointments",
        )
        ReminderLog.objects.create(appointment=appt)
        sent += 1
    return f"{sent} appointment reminder(s) sent"


@shared_task
def check_medicine_reminders():
    """
    Runs once daily at 08:00 UTC. Sends one reminder per active medication
    per day. NOTE: frequency text ("Twice daily") is not parsed into exact
    dose times in this pass — see scope note in the response above.
    """
    from apps.timeline.models import Medication
    from .models import Notification, ReminderLog

    today = timezone.localdate()

    active = Medication.objects.filter(
        is_active=True,
        start_date__lte=today,
    ).exclude(end_date__lt=today)

    already_sent = set(
        ReminderLog.objects.filter(
            medication__isnull=False, sent_at__date=today,
        ).values_list("medication_id", flat=True)
    )

    sent = 0
    for med in active:
        if med.id in already_sent:
            continue
        send_notification.delay(
            user_id=med.patient_id,
            notif_type=Notification.Type.MEDICINE_REMINDER,
            title="Medication reminder",
            body=f"Time to take {med.medicine} ({med.dose}) — {med.frequency}.",
            link="/medications",
        )
        ReminderLog.objects.create(medication=med)
        sent += 1
    return f"{sent} medicine reminder(s) sent"