from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet

router = DefaultRouter()
router.register("", MedicalRecordViewSet, basename="records")

urlpatterns = router.urls
# Registered routes:
#   GET/POST  /api/records/
#   GET       /api/records/stats/
#   GET/PATCH /api/records/{id}/
#   DELETE    /api/records/{id}/
#   GET       /api/records/{id}/download/