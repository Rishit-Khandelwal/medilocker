import os
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    PATIENT    = "PATIENT",    "Patient"
    DOCTOR     = "DOCTOR",     "Doctor"
    RESPONDER  = "RESPONDER",  "Emergency Responder"
    ADMIN      = "ADMIN",      "Administrator"
    SUPERADMIN = "SUPERADMIN", "Super Administrator"


# Roles a user can self-select at registration
SELF_SELECTABLE_ROLES = [Role.PATIENT, Role.DOCTOR, Role.RESPONDER]

# Roles that require admin verification before being granted
ROLES_REQUIRING_VERIFICATION = frozenset({Role.DOCTOR, Role.RESPONDER})


def _verification_doc_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f"verification_docs/{instance.applicant.id}/{uuid.uuid4().hex}{ext}"


class User(AbstractUser):
    email       = models.EmailField(unique=True)
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]
    role        = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    is_verified = models.BooleanField(
        default=True,
        help_text="Always True for PATIENT. False for DOCTOR/RESPONDER until admin approval.",
    )

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def is_admin_role(self):
        return self.role in [Role.ADMIN, Role.SUPERADMIN]

    @property
    def pending_verification_role(self):
        """Returns the requested role if there's an open PENDING request, else None."""
        req = self.verification_requests.filter(status="PENDING").first()
        return req.requested_role if req else None


class Profile(models.Model):
    BLOOD_GROUPS = [
        ("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-"),
    ]
    user          = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group   = models.CharField(max_length=5, choices=BLOOD_GROUPS, blank=True)
    phone         = models.CharField(max_length=20, blank=True)
    allergies     = models.TextField(blank=True, help_text="Comma-separated")
    conditions    = models.TextField(blank=True, help_text="Chronic conditions")
    medications   = models.TextField(blank=True, help_text="Current medications")
    avatar        = models.ImageField(upload_to="avatars/", null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return f"Profile({self.user.email})"


class VerificationRequest(models.Model):
    """
    Stores identity/credential documents submitted by DOCTOR and RESPONDER
    registrants. The status field drives the approval workflow.

    extra_verification is intentionally a free-form JSONField so that stronger
    tamper-proof methods — blockchain hashes, certificate serial numbers,
    digital signatures, issuer DIDs — can be attached later without any
    schema migration.
    """

    class Status(models.TextChoices):
        PENDING  = "PENDING",  "Pending Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    applicant      = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="verification_requests"
    )
    requested_role = models.CharField(max_length=20, choices=Role.choices)
    document       = models.FileField(upload_to=_verification_doc_path)
    document_name  = models.CharField(max_length=255, blank=True)  # original filename for display
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    reviewer       = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_verifications",
    )
    reviewer_notes = models.TextField(blank=True)
    submitted_at   = models.DateTimeField(auto_now_add=True)
    reviewed_at    = models.DateTimeField(null=True, blank=True)

    # Extensibility: attach any future tamper-proof verification metadata here.
    # Examples (none required now):
    #   { "blockchain_hash": "0xabc...", "chain": "polygon" }
    #   { "cert_serial": "SN-12345", "issuer": "MCI" }
    #   { "digital_signature": "base64...", "algorithm": "RSA-SHA256" }
    #   { "issuer_did": "did:ethr:0x..." }
    extra_verification = models.JSONField(
        default=dict, blank=True,
        help_text=(
            "Future-proof slot for tamper-proof verification data: "
            "blockchain_hash, cert_serial, digital_signature, issuer_did, etc."
        ),
    )

    class Meta:
        ordering = ["-submitted_at"]
        indexes  = [models.Index(fields=["status", "submitted_at"])]

    def __str__(self):
        return f"{self.applicant.email} → {self.requested_role} [{self.status}]"

    # ── State machine ─────────────────────────────────────────────────────────

    def approve(self, reviewer, notes=""):
        from django.utils import timezone
        self.status         = self.Status.APPROVED
        self.reviewer       = reviewer
        self.reviewer_notes = notes
        self.reviewed_at    = timezone.now()
        self.save(update_fields=["status", "reviewer", "reviewer_notes", "reviewed_at"])
        # Promote the user to their requested role
        self.applicant.role        = self.requested_role
        self.applicant.is_verified = True
        self.applicant.save(update_fields=["role", "is_verified"])

    def reject(self, reviewer, notes=""):
        from django.utils import timezone
        self.status         = self.Status.REJECTED
        self.reviewer       = reviewer
        self.reviewer_notes = notes
        self.reviewed_at    = timezone.now()
        self.save(update_fields=["status", "reviewer", "reviewer_notes", "reviewed_at"])
        # User stays as PATIENT with is_verified=False