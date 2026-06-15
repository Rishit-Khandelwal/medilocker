import secrets
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


class EmergencyContact(models.Model):
    RELATIONSHIP_CHOICES = [
        ("spouse",  "Spouse"),
        ("parent",  "Parent"),
        ("child",   "Child"),
        ("sibling", "Sibling"),
        ("friend",  "Friend"),
        ("doctor",  "Doctor"),
        ("other",   "Other"),
    ]

    patient      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="emergency_contacts",
    )
    name         = models.CharField(max_length=100)
    phone        = models.CharField(max_length=20)
    email        = models.EmailField(blank=True)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default="other")
    is_primary   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_primary", "name"]

    def save(self, *args, **kwargs):
        if self.is_primary:
            # Enforce single primary per patient
            EmergencyContact.objects.filter(
                patient=self.patient, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()}) → {self.patient.email}"


class EmergencyToken(models.Model):
    LIFETIME_MINUTES = 15
    TOKEN_BYTES      = 32   # 256-bit URL-safe random

    patient    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="emergency_tokens",
    )
    token      = models.CharField(max_length=64, unique=True, db_index=True)
    label      = models.CharField(max_length=100, blank=True, help_text="e.g. Wallet card")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    used_at    = models.DateTimeField(null=True, blank=True)
    accessed_by_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    # ── Factory ────────────────────────────────────────────────────────────────
    @classmethod
    def generate(cls, patient, label=""):
        return cls.objects.create(
            patient=patient,
            token=secrets.token_urlsafe(cls.TOKEN_BYTES),
            label=label,
            expires_at=timezone.now() + timedelta(minutes=cls.LIFETIME_MINUTES),
        )

    # ── Computed state ─────────────────────────────────────────────────────────
    @property
    def status(self) -> str:
        if self.is_revoked:       return "revoked"
        if self.used_at:          return "used"
        if timezone.now() >= self.expires_at: return "expired"
        return "active"

    @property
    def is_valid(self) -> bool:
        return self.status == "active"

    # ── Mutations ──────────────────────────────────────────────────────────────
    def use(self, ip_address=None):
        self.used_at       = timezone.now()
        self.accessed_by_ip = ip_address
        self.save(update_fields=["used_at", "accessed_by_ip"])

    def revoke(self):
        self.is_revoked = True
        self.save(update_fields=["is_revoked"])

    def __str__(self):
        return f"Token({self.status}) → {self.patient.email}"