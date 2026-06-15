from rest_framework import serializers
from .models import MedicalRecord, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, detect_mime


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Used for LIST and RETRIEVE."""
    file_size_display = serializers.ReadOnlyField()
    tags_list         = serializers.ReadOnlyField()
    category_display  = serializers.CharField(source="get_category_display", read_only=True)
    download_url      = serializers.SerializerMethodField()

    class Meta:
        model  = MedicalRecord
        fields = [
            "id", "title", "category", "category_display", "description",
            "original_filename", "mime_type", "file_size", "file_size_display",
            "tags", "tags_list", "version", "download_url",
            "uploaded_at", "updated_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/records/{obj.id}/download/"
        return request.build_absolute_uri(url) if request else url


class RecordCreateSerializer(serializers.ModelSerializer):
    """Handles multipart file upload with full validation."""

    class Meta:
        model  = MedicalRecord
        fields = ["title", "category", "description", "file", "tags"]

    def validate_tags(self, value):
        if value:
            cleaned = sorted({t.strip().lower() for t in value.split(",") if t.strip()})
            return ", ".join(cleaned)
        return value

    def validate_file(self, file):
        ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Extension .{ext} not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File must be under 20 MB.")

        mime = detect_mime(file)
        if not mime:
            raise serializers.ValidationError(
                "File content doesn't match allowed types (PDF, PNG, JPEG)."
            )
        # attach for use in create()
        file._detected_mime = mime
        return file

    def create(self, validated_data):
        file = validated_data["file"]
        return MedicalRecord.objects.create(
            owner=self.context["request"].user,
            original_filename=file.name,
            mime_type=getattr(file, "_detected_mime", "application/octet-stream"),
            file_size=file.size,
            **validated_data,
        )


class RecordUpdateSerializer(serializers.ModelSerializer):
    """PATCH — metadata only; file is immutable after upload."""

    class Meta:
        model  = MedicalRecord
        fields = ["title", "category", "description", "tags"]

    def validate_tags(self, value):
        if value:
            cleaned = sorted({t.strip().lower() for t in value.split(",") if t.strip()})
            return ", ".join(cleaned)
        return value

    def update(self, instance, validated_data):
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.version += 1   # increment version on every metadata update
        instance.save()
        return instance