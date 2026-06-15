def register_signals():
    """
    Called from AuditConfig.ready() — deferred import avoids circular dependency
    between audit ↔ records at module load time.
    """
    from django.db.models.signals import post_save, post_delete
    from django.dispatch import receiver
    from apps.records.models import MedicalRecord
    from .models import AuditLog

    @receiver(post_save, sender=MedicalRecord, weak=False)
    def log_record_upload(sender, instance, created, **kwargs):
        if created:
            AuditLog.objects.create(
                user=instance.owner,
                action=AuditLog.ACTION_UPLOAD,
                resource_type="MedicalRecord",
                resource_id=str(instance.id),
                extra={"title": instance.title, "category": instance.category},
            )

    @receiver(post_delete, sender=MedicalRecord, weak=False)
    def log_record_delete(sender, instance, **kwargs):
        AuditLog.objects.create(
            user=instance.owner,
            action=AuditLog.ACTION_DELETE,
            resource_type="MedicalRecord",
            resource_id=str(instance.id),
            extra={"title": instance.title},
        )