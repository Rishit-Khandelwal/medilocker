from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.utils import log_action
from apps.accounts.throttles import EmergencyAccessThrottle
from .models import EmergencyContact, EmergencyToken
from .serializers import (
    EmergencyContactSerializer,
    EmergencyTokenSerializer,
    GenerateTokenInputSerializer,
)
from .utils import generate_qr_base64


class EmergencyContactViewSet(viewsets.ModelViewSet):
    """Full CRUD for a patient's emergency contacts."""
    permission_classes = [IsAuthenticated]
    serializer_class   = EmergencyContactSerializer

    def get_queryset(self):
        return EmergencyContact.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class EmergencyTokenViewSet(viewsets.ModelViewSet):
    """Generate, list, and revoke one-time emergency access tokens."""
    permission_classes = [IsAuthenticated]
    serializer_class   = EmergencyTokenSerializer
    http_method_names  = ["get", "post", "head", "options"]  # tokens are immutable after creation

    def get_queryset(self):
        return EmergencyToken.objects.filter(patient=self.request.user)

    def create(self, request, *args, **kwargs):
        inp = GenerateTokenInputSerializer(data=request.data)
        inp.is_valid(raise_exception=True)

        token = EmergencyToken.generate(
            patient=request.user,
            label=inp.validated_data.get("label", ""),
        )

        base_url    = inp.validated_data.get("frontend_base_url", "http://localhost:5173").rstrip("/")
        emergency_url = f"{base_url}/emergency/{token.token}"
        qr_b64      = generate_qr_base64(emergency_url)

        log_action(
            user=request.user,
            action="TOKEN_CREATED",
            resource_type="EmergencyToken",
            resource_id=str(token.id),
            request=request,
            extra={"label": token.label},
        )

        return Response(
            {
                **EmergencyTokenSerializer(token).data,
                "emergency_url":   emergency_url,
                "qr_code_base64": qr_b64,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, pk=None):
        token = self.get_object()
        if token.is_revoked:
            return Response({"detail": "Token is already revoked."}, status=400)
        token.revoke()
        log_action(
            user=request.user,
            action="TOKEN_REVOKED",
            resource_type="EmergencyToken",
            resource_id=str(token.id),
            request=request,
        )
        return Response({"detail": "Token revoked.", "id": token.id})


class EmergencyPublicAccessView(APIView):
    """
    Public — no authentication required.
    Validates the one-time token and returns the patient's emergency info.
    Token is marked used immediately; subsequent requests with the same token return 410.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [EmergencyAccessThrottle]

    def get(self, request, token_str):
        try:
            token = EmergencyToken.objects.select_related(
                "patient", "patient__profile"
            ).get(token=token_str)
        except EmergencyToken.DoesNotExist:
            return Response({"detail": "Invalid emergency code."}, status=404)

        if not token.is_valid:
            return Response(
                {"detail": f"Emergency code is {token.status}."},
                status=410,
            )

        patient = token.patient
        ip      = self._get_ip(request)

        # Mark used — one-time access
        token.use(ip_address=ip)

        try:
            profile = patient.profile
        except ObjectDoesNotExist:
            profile = None

        log_action(
            user=None,
            action="EMERGENCY_ACCESS",
            resource_type="EmergencyToken",
            resource_id=str(token.id),
            request=request,
            extra={"patient_id": patient.id, "ip": ip},
        )

        contacts = EmergencyContact.objects.filter(
            patient=patient
        ).order_by("-is_primary", "name")

        return Response({
            "patient_name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
            "blood_group":  getattr(profile, "blood_group",  "") if profile else "",
            "allergies":    getattr(profile, "allergies",    "") if profile else "",
            "conditions":   getattr(profile, "conditions",   "") if profile else "",
            "medications":  getattr(profile, "medications",  "") if profile else "",
            "contacts": [
                {
                    "name":         c.name,
                    "phone":        c.phone,
                    "email":        c.email,
                    "relationship": c.get_relationship_display(),
                    "is_primary":   c.is_primary,
                }
                for c in contacts
            ],
        })

    @staticmethod
    def _get_ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")