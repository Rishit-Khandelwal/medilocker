from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmergencyContactViewSet, EmergencyTokenViewSet, EmergencyPublicAccessView

router = DefaultRouter()
router.register("contacts", EmergencyContactViewSet, basename="emergency-contacts")
router.register("tokens",   EmergencyTokenViewSet,   basename="emergency-tokens")

urlpatterns = [
    path("", include(router.urls)),
    # Public — no auth token required
    path("access/<str:token_str>/", EmergencyPublicAccessView.as_view(), name="emergency-access"),
]
# Registered:
#   GET/POST          /api/emergency/contacts/
#   GET/PATCH/DELETE  /api/emergency/contacts/{id}/
#   GET/POST          /api/emergency/tokens/
#   POST              /api/emergency/tokens/{id}/revoke/
#   GET (public)      /api/emergency/access/{token}/