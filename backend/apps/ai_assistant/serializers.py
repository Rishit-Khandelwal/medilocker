from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model        = ChatMessage
        fields       = ["id", "role", "content", "context_chunks", "created_at"]
        read_only_fields = fields


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message  = serializers.SerializerMethodField()

    class Meta:
        model        = ChatSession
        fields       = ["id", "title", "model_used", "message_count", "last_message", "created_at", "updated_at"]
        read_only_fields = ["id", "model_used", "message_count", "last_message", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        msg = obj.messages.filter(role=ChatMessage.Role.ASSISTANT).last()
        if msg:
            return msg.content[:120]
        msg = obj.messages.last()
        return msg.content[:120] if msg else None


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model  = ChatSession
        fields = ["id", "title", "model_used", "messages", "created_at", "updated_at"]