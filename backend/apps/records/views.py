from django.http import FileResponse
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

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
        # Phase 3: extend this to include shared records (doctor/family roles)
        return MedicalRecord.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return RecordCreateSerializer
        if self.action in ("update", "partial_update"):
            return RecordUpdateSerializer
        return MedicalRecordSerializer

    # ── Custom actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """Authenticated file download — Phase 3 will add role-based access."""
        record = self.get_object()
        response = FileResponse(
            record.file.open("rb"),
            content_type=record.mime_type,
            as_attachment=True,
            filename=record.original_filename,
        )
        # Phase 3: log to AuditLog here
        return response

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Returns total count + breakdown by category — used by Dashboard."""
        qs = self.get_queryset()
        by_cat = dict(
            qs.values_list("category").annotate(n=Count("id")).order_by()
        )
        return Response({"total": qs.count(), "by_category": by_cat})