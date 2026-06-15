from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Email is the login credential, not username.
    username kept for admin display / future username lookup.
    Phase 3: add role field here.
    """
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email


class Profile(models.Model):
    BLOOD_GROUPS = [
        ("A+", "A+"), ("A-", "A-"), ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"), ("O+", "O+"), ("O-", "O-"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    # Phase 4: these feed the public emergency page
    allergies = models.TextField(blank=True, help_text="Comma-separated")
    conditions = models.TextField(blank=True, help_text="Chronic conditions")
    medications = models.TextField(blank=True, help_text="Current medications")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return f"Profile({self.user.email})"