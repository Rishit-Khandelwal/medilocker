from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count
from .models import Profile  

from .serializers import (
    RegisterSerializer, UserSerializer, ProfileSerializer, VerificationRequestSerializer,
)
from .throttles import LoginRateThrottle
from .permissions import IsAdmin
from .models import Role, VerificationRequest

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user":               UserSerializer(user).data,
                "tokens": {
                    "access":  str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "needs_verification": not user.is_verified,
            },
            status=status.HTTP_201_CREATED,
        )


class RateLimitedLoginView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                from apps.audit.utils import log_action
                user = User.objects.get(email=request.data.get("email", ""))
                log_action(user, "LOGIN", request=request)
            except Exception:
                pass
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response({"error": "Refresh token required."}, status=400)
        try:
            RefreshToken(token).blacklist()
        except Exception:
            return Response({"error": "Invalid token."}, status=400)
        try:
            from apps.audit.utils import log_action
            log_action(request.user, "LOGOUT", request=request)
        except Exception:
            pass
        return Response({"message": "Logged out."})


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = UserSerializer

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = ProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class VerificationStatusView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = VerificationRequestSerializer

    def retrieve(self, request, *args, **kwargs):
        req = request.user.verification_requests.order_by("-submitted_at").first()
        if not req:
            return Response({"detail": "No verification request found."}, status=404)
        return Response(VerificationRequestSerializer(req).data)


class AdminStatsView(APIView):
    """
    Admin/SuperAdmin only — aggregate counts for the Admin & SuperAdmin dashboards.
    GET /api/auth/admin/stats/
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        role_counts = dict(User.objects.values_list("role").annotate(n=Count("id")).order_by())
        role_distribution = {r: role_counts.get(r, 0) for r in Role.values}

        pending_verifications = VerificationRequest.objects.filter(
            status=VerificationRequest.Status.PENDING
        ).count()

        # Lazy import — avoids a hard dependency between accounts <-> records apps
        try:
            from apps.records.models import MedicalRecord
            total_records = MedicalRecord.objects.count()
        except Exception:
            total_records = 0

        return Response({
            "total_users":           User.objects.count(),
            "role_distribution":     role_distribution,
            "pending_verifications": pending_verifications,
            "total_records":         total_records,
        })