from django.http import FileResponse
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.accounts.throttles import UploadRateThrottle  # Phase 3
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer, RecordCreateSerializer, RecordUpdateSerializer


class MedicalRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields   = ["category"]
    search_fields      = ["title", "description", "tags"]
    ordering_fields    = ["uploaded_at", "title", "file_size"]
    ordering           = ["-uploaded_at"]

    def get_queryset(self):
        return MedicalRecord.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return RecordCreateSerializer
        if self.action in ("update", "partial_update"):
            return RecordUpdateSerializer
        return MedicalRecordSerializer

    # Phase 3: throttle uploads to 30/hour per user
    def get_throttles(self):
        if self.action == "create":
            return [UploadRateThrottle()]
        return super().get_throttles()

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        record = self.get_object()
        # Phase 3: audit log download
        from apps.audit.utils import log_action
        log_action(request.user, "DOWNLOAD", "MedicalRecord", str(record.id), request,
                   extra={"filename": record.original_filename})
        return FileResponse(
            record.file.open("rb"),
            content_type=record.mime_type,
            as_attachment=True,
            filename=record.original_filename,
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs    = self.get_queryset()
        by_cat = dict(qs.values_list("category").annotate(n=Count("id")).order_by())
        return Response({"total": qs.count(), "by_category": by_cat})