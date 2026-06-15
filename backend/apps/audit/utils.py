from typing import Optional


def get_client_ip(request) -> Optional[str]:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")


def log_action(
    user,
    action: str,
    resource_type: str = "",
    resource_id: str = "",
    request=None,
    extra: dict = None,
):
    """
    Safe to call from any view — never raises, so audit failures never block
    user-facing responses.
    """
    try:
        from .models import AuditLog
        AuditLog.objects.create(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            ip_address=get_client_ip(request) if request else None,
            user_agent=(request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""),
            extra=extra or {},
        )
    except Exception:
        pass