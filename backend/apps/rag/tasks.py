import uuid
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_ocr(self, record_id):
    """
    Full OCR → chunk → embed → upsert pipeline for one MedicalRecord.
    Called automatically via signal on upload and on manual reindex.
    """
    from apps.records.models import MedicalRecord
    from .models import DocumentOCRStatus, DocumentChunk
    from .ocr import extract_text, chunk_text
    from .embeddings import embed_texts
    from .qdrant_utils import ensure_collection, upsert_chunks, delete_record_chunks

    try:
        record = MedicalRecord.objects.get(id=record_id)
    except MedicalRecord.DoesNotExist:
        logger.warning(f"process_document_ocr: record {record_id} not found.")
        return

    status_obj, _ = DocumentOCRStatus.objects.get_or_create(record=record)
    status_obj.status = DocumentOCRStatus.STATUS_PROCESSING
    status_obj.save(update_fields=["status"])

    try:
        # ── 1. Extract text ────────────────────────────────────────────────────
        text, method = extract_text(record.file.path, record.mime_type)

        if not text.strip():
            status_obj.status     = DocumentOCRStatus.STATUS_SKIPPED
            status_obj.method     = method
            status_obj.text_length = 0
            status_obj.chunk_count = 0
            status_obj.processed_at = timezone.now()
            status_obj.save()
            return

        # ── 2. Chunk ───────────────────────────────────────────────────────────
        chunks = chunk_text(text)
        if not chunks:
            status_obj.status      = DocumentOCRStatus.STATUS_SKIPPED
            status_obj.method      = method
            status_obj.processed_at = timezone.now()
            status_obj.save()
            return

        # ── 3. Embed ───────────────────────────────────────────────────────────
        vectors = embed_texts(chunks)

        # ── 4. Clear old data for this record ─────────────────────────────────
        DocumentChunk.objects.filter(record=record).delete()
        delete_record_chunks(record_id=record.id)

        # ── 5. Upsert to Qdrant + save to DB ──────────────────────────────────
        ensure_collection()
        qdrant_points = []
        db_chunks     = []

        for i, (chunk_str, vector) in enumerate(zip(chunks, vectors)):
            point_id = str(uuid.uuid4())
            qdrant_points.append({
                "id":      point_id,
                "vector":  vector,
                "payload": {
                    "record_id":   record.id,
                    "user_id":     record.owner_id,
                    "title":       record.title,
                    "category":    record.category,
                    "chunk_index": i,
                    "text":        chunk_str[:1500],   # cap stored payload
                },
            })
            db_chunks.append(DocumentChunk(
                record          = record,
                chunk_index     = i,
                text            = chunk_str,
                qdrant_point_id = point_id,
                word_count      = len(chunk_str.split()),
            ))

        upsert_chunks(qdrant_points)
        DocumentChunk.objects.bulk_create(db_chunks)

        # ── 6. Update status ───────────────────────────────────────────────────
        status_obj.status      = DocumentOCRStatus.STATUS_COMPLETED
        status_obj.method      = method
        status_obj.text_length = len(text)
        status_obj.chunk_count = len(chunks)
        status_obj.processed_at = timezone.now()
        status_obj.error_message = ""
        status_obj.save()

        logger.info(
            f"OCR complete: record {record_id} → {len(chunks)} chunks "
            f"via {method} ({len(text)} chars)"
        )

    except Exception as exc:
        logger.error(f"OCR task failed for record {record_id}: {exc}", exc_info=True)
        try:
            status_obj.status        = DocumentOCRStatus.STATUS_FAILED
            status_obj.error_message = str(exc)
            status_obj.save(update_fields=["status", "error_message"])
        except Exception:
            pass
        raise self.retry(exc=exc)