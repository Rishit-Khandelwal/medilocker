from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer
from .throttles import LoginRateThrottle

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
                "user": UserSerializer(user).data,
                "tokens": {
                    "access":  str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class RateLimitedLoginView(TokenObtainPairView):
    """
    JWT login — rate-limited to 5 attempts/minute per IP.
    Emits LOGIN audit log on success.
    """
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                from apps.audit.utils import log_action
                user = User.objects.get(email=request.data.get("email", ""))
                log_action(user, "LOGIN", request=request)
            except Exception:
                pass  # never block login on audit failure
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
        return self.request.user.profile