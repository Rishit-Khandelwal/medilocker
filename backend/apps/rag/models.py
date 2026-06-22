from django.db import models


class DocumentOCRStatus(models.Model):
    """
    One-to-one companion for MedicalRecord, lives in the rag app so Phase 2
    models stay completely untouched.
    """
    STATUS_PENDING    = "PENDING"
    STATUS_PROCESSING = "PROCESSING"
    STATUS_COMPLETED  = "COMPLETED"
    STATUS_FAILED     = "FAILED"
    STATUS_SKIPPED    = "SKIPPED"    # e.g. unsupported mime type

    STATUS_CHOICES = [
        (STATUS_PENDING,    "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED,  "Completed"),
        (STATUS_FAILED,     "Failed"),
        (STATUS_SKIPPED,    "Skipped"),
    ]

    record        = models.OneToOneField(
        "records.MedicalRecord", on_delete=models.CASCADE, related_name="ocr_status",
    )
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    method        = models.CharField(max_length=20, blank=True, help_text="direct / tesseract / skipped / failed")
    text_length   = models.PositiveIntegerField(default=0)
    chunk_count   = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    processed_at  = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "OCR Status"

    def __str__(self):
        return f"{self.record.title} [{self.status}]"


class DocumentChunk(models.Model):
    """
    Each row is one text chunk extracted from a MedicalRecord.
    The corresponding Qdrant point is identified by qdrant_point_id.
    """
    record          = models.ForeignKey(
        "records.MedicalRecord", on_delete=models.CASCADE, related_name="chunks",
    )
    chunk_index     = models.PositiveIntegerField()
    text            = models.TextField()
    qdrant_point_id = models.CharField(max_length=36, db_index=True)  # UUID string
    word_count      = models.PositiveIntegerField(default=0)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering         = ["record", "chunk_index"]
        unique_together  = [("record", "chunk_index")]

    def __str__(self):
        return f"Chunk {self.chunk_index} of record {self.record_id}"