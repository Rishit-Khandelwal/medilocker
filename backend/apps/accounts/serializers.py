from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Role, VerificationRequest, SELF_SELECTABLE_ROLES, ROLES_REQUIRING_VERIFICATION

User = get_user_model()

# Allowed document extensions for verification uploads
_ALLOWED_DOC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    role      = serializers.ChoiceField(
        choices=[(r, r) for r in SELF_SELECTABLE_ROLES],
        default=Role.PATIENT,
        required=False,
    )
    document  = serializers.FileField(
        required=False, allow_null=True,
        help_text="Required when role is DOCTOR or RESPONDER.",
    )

    class Meta:
        model  = User
        fields = [
            "email", "username", "first_name", "last_name",
            "password", "password2", "role", "document",
        ]

    def validate_document(self, doc):
        if doc is None:
            return doc
        import os
        ext = os.path.splitext(doc.name)[1].lower()
        if ext not in _ALLOWED_DOC_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type '{ext}'. Accepted: PDF, PNG, JPG."
            )
        if doc.size > 10 * 1024 * 1024:   # 10 MB cap
            raise serializers.ValidationError("Document must be under 10 MB.")
        return doc

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        role = data.get("role", Role.PATIENT)
        if role in ROLES_REQUIRING_VERIFICATION and not data.get("document"):
            raise serializers.ValidationError({
                "document": (
                    "A professional proof document (license, hospital ID, certificate) "
                    "is required for Doctor and Emergency Responder registration."
                )
            })
        return data

    def create(self, validated_data):
        role     = validated_data.pop("role", Role.PATIENT)
        document = validated_data.pop("document", None)
        validated_data.pop("password2")

        needs_verification = role in ROLES_REQUIRING_VERIFICATION

        # All accounts start active so the user can log in immediately.
        # Unverified DOCTOR/RESPONDER registrants are given PATIENT role
        # until an admin approves their verification request.
        user = User.objects.create_user(
            role        = Role.PATIENT if needs_verification else role,
            is_verified = not needs_verification,
            **validated_data,
        )
        Profile.objects.create(user=user)

        if needs_verification and document:
            VerificationRequest.objects.create(
                applicant      = user,
                requested_role = role,
                document       = document,
                document_name  = document.name,
            )

        return user


class UserSerializer(serializers.ModelSerializer):
    # Pending role is the role the user applied for but hasn't been granted yet.
    # None means no pending request (either verified, or PATIENT with no request).
    pending_role = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "role", "is_verified", "pending_role", "date_joined",
        ]
        read_only_fields = fields

    def get_pending_role(self, obj):
        req = obj.verification_requests.filter(status="PENDING").first()
        return req.requested_role if req else None


class ProfileSerializer(serializers.ModelSerializer):
    user  = UserSerializer(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = Profile
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]


class VerificationRequestSerializer(serializers.ModelSerializer):
    applicant_email   = serializers.CharField(source="applicant.email",    read_only=True)
    requested_role_display = serializers.SerializerMethodField()
    status_display    = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = VerificationRequest
        fields = [
            "id", "applicant_email", "requested_role", "requested_role_display",
            "status", "status_display", "reviewer_notes",
            "submitted_at", "reviewed_at",
        ]
        read_only_fields = fields

    def get_requested_role_display(self, obj):
        return dict(Role.choices).get(obj.requested_role, obj.requested_role)