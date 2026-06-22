def register_signals():
    from django.db.models.signals import post_save, post_delete
    from django.dispatch import receiver
    from apps.records.models import MedicalRecord
    from .models import DocumentOCRStatus

    @receiver(post_save, sender=MedicalRecord, weak=False)
    def trigger_ocr_on_upload(sender, instance, created, **kwargs):
        """Queue OCR + embedding pipeline immediately after a record is created."""
        if created:
            DocumentOCRStatus.objects.get_or_create(record=instance)
            # Import here to avoid circular at module load
            from .tasks import process_document_ocr
            process_document_ocr.delay(instance.id)

    @receiver(post_delete, sender=MedicalRecord, weak=False)
    def cleanup_qdrant_on_delete(sender, instance, **kwargs):
        """
        Django cascades the FK and removes DocumentChunk rows automatically.
        We still need to remove the Qdrant points manually.
        """
        try:
            from .qdrant_utils import delete_record_chunks
            delete_record_chunks(record_id=instance.id)
        except Exception:
            pass   # Non-fatal — Qdrant points orphaned at worst