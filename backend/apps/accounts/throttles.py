from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """5 login attempts per minute per IP."""
    scope = "login"


class UploadRateThrottle(UserRateThrottle):
    """30 uploads per hour per authenticated user."""
    scope = "upload"


class EmergencyAccessThrottle(AnonRateThrottle):
    """10 emergency page hits per minute per IP — prevents token enumeration."""
    scope = "emergency_access"