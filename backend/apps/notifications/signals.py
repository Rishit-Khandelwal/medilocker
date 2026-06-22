def register_signals():
    """
    Called from NotificationsConfig.ready(). Deferred imports avoid circular
    dependencies between notifications ↔ records/emergency at module load.
    """
    from django.db.models.signals import post_save
    from django.dispatch import receiver
    from apps.records.models import MedicalRecord
    from apps.emergency.models import EmergencyToken
    from .models import Notification
    from .tasks import send_notification

    @receiver(post_save, sender=MedicalRecord, weak=False)
    def notify_record_uploaded(sender, instance, created, **kwargs):
        if created:
            send_notification.delay(
                user_id=instance.owner_id,
                notif_type=Notification.Type.UPLOAD_COMPLETE,
                title="Upload complete",
                body=f'"{instance.title}" has been uploaded successfully.',
                link=f"/records/{instance.id}",
            )

    @receiver(post_save, sender=EmergencyToken, weak=False)
    def notify_emergency_token_used(sender, instance, created, **kwargs):
        # EmergencyToken.use() does save(update_fields=["used_at", "accessed_by_ip"]),
        # so checking update_fields here distinguishes "just got scanned" from
        # any other save (e.g. revoke(), which only updates is_revoked).
        update_fields = kwargs.get("update_fields")
        if not created and update_fields and "used_at" in update_fields and instance.used_at:
            label_part = f" ({instance.label})" if instance.label else ""
            send_notification.delay(
                user_id=instance.patient_id,
                notif_type=Notification.Type.EMERGENCY_TOKEN_USED,
                title="Emergency access used",
                body=f"Your emergency QR code{label_part} was scanned.",
                link="/emergency/manage",
            )