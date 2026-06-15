import os
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

ALLOWED_EXTENSIONS = {"pdf", "png", "jpeg", "jpg"}
MAX_FILE_SIZE      = 20 * 1024 * 1024  # 20 MB

MAGIC_SIGNATURES = {
    b"%PDF":               "application/pdf",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"\xff\xd8\xff":       "image/jpeg",
}


def detect_mime(file_obj):
    """Validate by magic bytes — cannot be spoofed by renaming."""
    header = file_obj.read(8)
    file_obj.seek(0)
    for magic, mime in MAGIC_SIGNATURES.items():
        if header[: len(magic)] == magic:
            return mime
    return None


def record_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"records/{instance.owner.id}/{uuid.uuid4().hex}.{ext}"


class MedicalRecord(models.Model):
    CATEGORY_CHOICES = [
        ("lab_report",   "Lab Report"),
        ("prescription", "Prescription"),
        ("mri",          "MRI Scan"),
        ("ct_scan",      "CT Scan"),
        ("xray",         "X-Ray"),
        ("vaccination",  "Vaccination Record"),
        ("other",        "Other"),
    ]

    owner             = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medical_records")
    title             = models.CharField(max_length=255)
    category          = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    description       = models.TextField(blank=True)
    file              = models.FileField(upload_to=record_upload_path)
    original_filename = models.CharField(max_length=255)
    mime_type         = models.CharField(max_length=100)
    file_size         = models.PositiveIntegerField(help_text="Bytes")
    tags              = models.CharField(max_length=500, blank=True, help_text="Comma-separated")
    version           = models.PositiveSmallIntegerField(default=1)
    # Phase 7: ocr_text + embedding status go here
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.title} [{self.get_category_display()}]"

    @property
    def file_size_display(self):
        if self.file_size < 1024:
            return f"{self.file_size} B"
        if self.file_size < 1024 ** 2:
            return f"{self.file_size / 1024:.1f} KB"
        return f"{self.file_size / 1024 ** 2:.1f} MB"

    @property
    def tags_list(self):
        return [t.strip() for t in self.tags.split(",") if t.strip()]


# ── Cleanup file on record deletion ──────────────────────────────────────────
from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=MedicalRecord)
def delete_file_on_record_delete(sender, instance, **kwargs):
    if instance.file and os.path.isfile(instance.file.path):
        os.remove(instance.file.path)