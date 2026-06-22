import json
import logging

from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatSessionDetailSerializer

logger = logging.getLogger(__name__)


def _get_rag_context(query, user_id):
    """Returns a list of relevant chunk dicts, silently returns [] if RAG fails."""
    try:
        from apps.rag.embeddings import embed_texts
        from apps.rag.qdrant_utils import search_chunks
        vector = embed_texts([query])[0]
        hits   = search_chunks(vector, user_id=user_id, limit=3)
        return [
            {
                "record_title": h.payload.get("title",    "Unknown"),
                "chunk_text":   h.payload.get("text",     "")[:800],
                "score":        round(h.score, 3),
                "category":     h.payload.get("category", ""),
            }
            for h in hits if h.score > 0.35
        ]
    except Exception as exc:
        logger.warning(f"RAG context failed: {exc}")
        return []


class ChatView(APIView):
    """
    POST /api/ai/chat/
    Body: { message, session_id (optional) }

    Returns text/event-stream SSE. Each data event is a JSON object with a
    `type` field:
        {type: "session",  session_id, session_title}
        {type: "token",    token}
        {type: "done",     session_id}
        {type: "error",    error}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message    = (request.data.get("message") or "").strip()
        session_id = request.data.get("session_id")

        if not message:
            return Response({"error": "Message is required."}, status=400)

        # ── Session ────────────────────────────────────────────────────────────
        session = None
        if session_id:
            session = ChatSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            title   = (message[:57] + "…") if len(message) > 57 else message
            session = ChatSession.objects.create(user=request.user, title=title)

        # ── Save user turn ─────────────────────────────────────────────────────
        user_msg = ChatMessage.objects.create(
            session=session, role=ChatMessage.Role.USER, content=message,
        )

        # ── RAG retrieval ──────────────────────────────────────────────────────
        rag_chunks = _get_rag_context(message, request.user.id)

        # ── Build LLM messages ─────────────────────────────────────────────────
        from .prompts import SYSTEM_PROMPT, build_messages
        history = list(
            ChatMessage.objects.filter(session=session)
            .exclude(id=user_msg.id)
            .order_by("created_at")
        )
        llm_messages = build_messages(message, history, rag_chunks)

        # ── SSE generator ──────────────────────────────────────────────────────
        def generate():
            from .llm import stream_response
            tokens = []

            try:
                yield f"data: {json.dumps({'type': 'session', 'session_id': session.id, 'session_title': session.title})}\n\n"

                token_stream, provider = stream_response(llm_messages, SYSTEM_PROMPT)

                for token in token_stream:
                    tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

                full_text = "".join(tokens)
                ChatMessage.objects.create(
                    session=session,
                    role=ChatMessage.Role.ASSISTANT,
                    content=full_text,
                    context_chunks=rag_chunks,
                )
                session.model_used = provider
                session.save(update_fields=["model_used", "updated_at"])

                yield f"data: {json.dumps({'type': 'done', 'session_id': session.id})}\n\n"

            except Exception as exc:
                logger.error(f"AI chat error: {exc}", exc_info=True)
                if tokens:
                    partial = "".join(tokens) + "\n\n*[Response interrupted]*"
                    ChatMessage.objects.create(
                        session=session,
                        role=ChatMessage.Role.ASSISTANT,
                        content=partial,
                        context_chunks=rag_chunks,
                    )
                yield f"data: {json.dumps({'type': 'error', 'error': str(exc)})}\n\n"

        resp = StreamingHttpResponse(generate(), content_type="text/event-stream")
        resp["Cache-Control"]     = "no-cache"
        resp["X-Accel-Buffering"] = "no"
        return resp


class SessionListView(generics.ListAPIView):
    """GET /api/ai/sessions/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = ChatSessionSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class SessionDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/ai/sessions/<id>/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = ChatSessionDetailSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class RenameSessionView(APIView):
    """PATCH /api/ai/sessions/<pk>/rename/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        session = get_object_or_404(ChatSession, id=pk, user=request.user)
        title   = (request.data.get("title") or "").strip()
        if title:
            session.title = title[:200]
            session.save(update_fields=["title"])
        return Response(ChatSessionSerializer(session).data)


class LLMStatusView(APIView):
    """GET /api/ai/status/ — which backend is live"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .llm import is_ollama_available, OLLAMA_MODEL, OLLAMA_BASE_URL, GEMINI_API_KEY, GEMINI_MODEL
        ollama_ok = is_ollama_available()
        gemini_ok = bool(GEMINI_API_KEY)
        return Response({
            "ollama":     {"available": ollama_ok, "model": OLLAMA_MODEL, "url": OLLAMA_BASE_URL},
            "gemini":     {"available": gemini_ok, "model": GEMINI_MODEL},
            "active":     "ollama" if ollama_ok else ("gemini" if gemini_ok else None),
            "setup_hint": (
                "" if (ollama_ok or gemini_ok) else
                "No AI backend found. Start Ollama (ollama serve) or add GEMINI_API_KEY to .env "
                "(free at https://aistudio.google.com/app/apikey)"
            ),
        })