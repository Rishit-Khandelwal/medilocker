from rest_framework.permissions import BasePermission
from .models import Role


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.PATIENT)


class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.DOCTOR)


class IsResponder(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.RESPONDER)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.ADMIN, Role.SUPERADMIN])


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == Role.SUPERADMIN)


class IsMedicalStaff(BasePermission):
    """Doctor or above."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.DOCTOR, Role.ADMIN, Role.SUPERADMIN])


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level: passes if the request user owns the object (via `owner`, `patient`,
    or `user` attribute) OR has an admin role.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in [Role.ADMIN, Role.SUPERADMIN]:
            return True
        owner = (
            getattr(obj, "owner",   None)
            or getattr(obj, "patient", None)
            or getattr(obj, "user",    None)
        )
        return owner == request.user
    
class IsResponderOrAdmin(BasePermission):
    """Responder, Admin, or SuperAdmin — used for emergency-access reporting views."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in [Role.RESPONDER, Role.ADMIN, Role.SUPERADMIN])