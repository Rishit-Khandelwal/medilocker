from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_LOGIN            = "LOGIN"
    ACTION_LOGOUT           = "LOGOUT"
    ACTION_UPLOAD           = "UPLOAD"
    ACTION_DOWNLOAD         = "DOWNLOAD"
    ACTION_DELETE           = "DELETE"
    ACTION_SHARE            = "SHARE"
    ACTION_EMERGENCY_ACCESS = "EMERGENCY_ACCESS"
    ACTION_TOKEN_CREATED    = "TOKEN_CREATED"
    ACTION_TOKEN_REVOKED    = "TOKEN_REVOKED"

    ACTION_CHOICES = [
        (ACTION_LOGIN,            "Login"),
        (ACTION_LOGOUT,           "Logout"),
        (ACTION_UPLOAD,           "Upload"),
        (ACTION_DOWNLOAD,         "Download"),
        (ACTION_DELETE,           "Delete"),
        (ACTION_SHARE,            "Share"),
        (ACTION_EMERGENCY_ACCESS, "Emergency Access"),
        (ACTION_TOKEN_CREATED,    "Token Created"),
        (ACTION_TOKEN_REVOKED,    "Token Revoked"),
    ]

    user          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs",
    )
    action        = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    resource_type = models.CharField(max_length=50, blank=True, db_index=True)
    resource_id   = models.CharField(max_length=50, blank=True)
    ip_address    = models.GenericIPAddressField(null=True, blank=True)
    user_agent    = models.CharField(max_length=500, blank=True)
    extra         = models.JSONField(default=dict, blank=True)
    timestamp     = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes  = [models.Index(fields=["user", "action"])]

    def __str__(self):
        return f"{self.action} | {self.user} | {self.timestamp:%Y-%m-%d %H:%M}"