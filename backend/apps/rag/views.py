import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class SemanticSearchView(APIView):
    """
    GET /api/search/?q=<query>&limit=5
    Returns semantically relevant chunks from the requesting user's records.
    Qdrant filters results to only that user's data — no cross-user leakage.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q     = request.query_params.get("q", "").strip()
        limit = min(int(request.query_params.get("limit", 5)), 20)

        if not q:
            return Response({"results": [], "query": ""})

        try:
            from .embeddings import embed_texts
            from .qdrant_utils import search_chunks

            query_vector = embed_texts([q])[0]
            hits         = search_chunks(query_vector, user_id=request.user.id, limit=limit)

            results = []
            for hit in hits:
                payload = hit.payload or {}
                results.append({
                    "record_id":    payload.get("record_id"),
                    "record_title": payload.get("title", "Unknown"),
                    "category":     payload.get("category", ""),
                    "chunk_text":   payload.get("text", ""),
                    "score":        round(hit.score, 4),
                })

            return Response({"results": results, "query": q})

        except Exception as exc:
            logger.error(f"Semantic search failed: {exc}", exc_info=True)
            return Response(
                {"error": str(exc), "results": [], "query": q},
                status=503,
            )


class OCRStatusView(APIView):
    """
    GET /api/search/status/<record_id>/
    Returns OCR processing status for one of the current user's records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, record_id):
        from apps.records.models import MedicalRecord
        from .models import DocumentOCRStatus

        try:
            record = MedicalRecord.objects.get(id=record_id, owner=request.user)
        except MedicalRecord.DoesNotExist:
            return Response({"error": "Record not found."}, status=404)

        try:
            s = DocumentOCRStatus.objects.get(record=record)
            return Response({
                "status":       s.status,
                "method":       s.method,
                "chunk_count":  s.chunk_count,
                "text_length":  s.text_length,
                "error":        s.error_message,
                "processed_at": s.processed_at,
            })
        except DocumentOCRStatus.DoesNotExist:
            return Response({"status": "NOT_STARTED"})


class ReindexView(APIView):
    """
    POST /api/search/reindex/<record_id>/
    Manually re-trigger OCR + indexing for a record (e.g. after a failure).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, record_id):
        from apps.records.models import MedicalRecord
        from .models import DocumentOCRStatus
        from .tasks import process_document_ocr

        try:
            record = MedicalRecord.objects.get(id=record_id, owner=request.user)
        except MedicalRecord.DoesNotExist:
            return Response({"error": "Record not found."}, status=404)

        status_obj, _ = DocumentOCRStatus.objects.get_or_create(record=record)
        status_obj.status        = DocumentOCRStatus.STATUS_PENDING
        status_obj.error_message = ""
        status_obj.save(update_fields=["status", "error_message"])

        process_document_ocr.delay(record.id)
        return Response({"queued": True, "record_id": record_id})