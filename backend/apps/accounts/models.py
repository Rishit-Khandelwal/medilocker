from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    PATIENT    = "PATIENT",    "Patient"
    DOCTOR     = "DOCTOR",     "Doctor"
    RESPONDER  = "RESPONDER",  "Emergency Responder"
    ADMIN      = "ADMIN",      "Administrator"
    SUPERADMIN = "SUPERADMIN", "Super Administrator"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    role  = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def is_admin_role(self):
        return self.role in [Role.ADMIN, Role.SUPERADMIN]


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