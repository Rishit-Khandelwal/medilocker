from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin
from django.http import HttpResponseRedirect
from django.utils.html import format_html

from .models import User, Profile, VerificationRequest


# ── User ──────────────────────────────────────────────────────────────────────

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display   = [
        "email", "username", "first_name", "last_name",
        "role", "is_verified", "is_active", "date_joined",
    ]
    list_filter    = ["role", "is_verified", "is_active", "is_staff", "date_joined"]
    search_fields  = ["email", "username", "first_name", "last_name"]
    ordering       = ["-date_joined"]
    list_editable  = ["role"]   # quick role assignment directly from the list page

    # Extend the default UserAdmin fieldsets with a MediLocker section
    fieldsets = UserAdmin.fieldsets + (
        ("MediLocker", {
            "fields": ("role", "is_verified"),
            "description": (
                "Change role directly only for ADMIN/SUPERADMIN assignment. "
                "For DOCTOR/RESPONDER, use the Verification Requests workflow instead."
            ),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2"),
        }),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display  = ["user", "blood_group", "phone", "created_at"]
    search_fields = ["user__email"]


# ── Verification Requests ─────────────────────────────────────────────────────

@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    # List view
    list_display   = [
        "applicant_email", "requested_role", "status_badge",
        "document_link", "submitted_at", "reviewer", "reviewed_at",
    ]
    list_filter    = ["status", "requested_role", "submitted_at"]
    search_fields  = ["applicant__email", "applicant__username", "reviewer_notes"]
    ordering       = ["-submitted_at"]
    date_hierarchy = "submitted_at"

    # Change view — readonly fields + editable reviewer_notes
    readonly_fields = [
        "applicant_info", "requested_role_display", "document_preview",
        "status", "reviewer", "submitted_at", "reviewed_at",
        "extra_verification",
    ]
    fieldsets = (
        ("Applicant", {
            "fields": ("applicant_info", "requested_role_display", "document_preview"),
        }),
        ("Decision", {
            "fields": ("status", "reviewer_notes"),
            "description": (
                "Enter any notes below, then use the Approve or Reject buttons. "
                "Approval immediately grants the requested role to the user."
            ),
        }),
        ("Audit trail", {
            "classes": ("collapse",),
            "fields": ("reviewer", "submitted_at", "reviewed_at"),
        }),
        ("Extended verification data", {
            "classes": ("collapse",),
            "fields": ("extra_verification",),
            "description": "Future slot for blockchain hashes, certificate serials, digital signatures, etc.",
        }),
    )

    def has_add_permission(self, request):
        return False   # requests are created only via registration API

    # ── Custom readonly display fields ─────────────────────────────────────────

    def applicant_info(self, obj):
        return format_html(
            "<strong>{}</strong><br>"
            "<small>@{} · joined {}</small>",
            obj.applicant.email,
            obj.applicant.username,
            obj.applicant.date_joined.strftime("%d %b %Y"),
        )
    applicant_info.short_description = "Applicant"

    def requested_role_display(self, obj):
        colours = {"DOCTOR": "#0d6efd", "RESPONDER": "#fd7e14"}
        colour  = colours.get(obj.requested_role, "#6c757d")
        return format_html(
            '<span style="color:{}; font-weight:600;">{}</span>',
            colour,
            obj.get_requested_role_display(),
        )
    requested_role_display.short_description = "Requested role"

    def document_preview(self, obj):
        if not obj.document:
            return "—"
        name = obj.document_name or obj.document.name.split("/")[-1]
        return format_html(
            '<a href="{}" target="_blank" download="{}">'
            '📄 {} <small style="color:#888">(click to download / open)</small>'
            "</a>",
            obj.document.url, name, name,
        )
    document_preview.short_description = "Submitted document"

    # ── List display helpers ───────────────────────────────────────────────────

    def applicant_email(self, obj):
        return obj.applicant.email
    applicant_email.short_description = "Applicant"
    applicant_email.admin_order_field = "applicant__email"

    def document_link(self, obj):
        if not obj.document:
            return "—"
        name = obj.document_name or obj.document.name.split("/")[-1]
        return format_html('<a href="{}" download>📄 {}</a>', obj.document.url, name)
    document_link.short_description = "Document"

    def status_badge(self, obj):
        colours = {
            "PENDING":  ("#fff3cd", "#856404"),
            "APPROVED": ("#d1e7dd", "#0f5132"),
            "REJECTED": ("#f8d7da", "#842029"),
        }
        bg, fg = colours.get(obj.status, ("#e9ecef", "#212529"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">{}</span>',
            bg, fg, obj.get_status_display(),
        )
    status_badge.short_description = "Status"

    # ── Approve / Reject via custom submit buttons ─────────────────────────────

    def response_change(self, request, obj):
        if "_approve" in request.POST:
            if obj.status != VerificationRequest.Status.PENDING:
                self.message_user(request, "Only PENDING requests can be approved.", level=messages.WARNING)
                return HttpResponseRedirect(".")
            notes = request.POST.get("reviewer_notes", "")
            obj.approve(reviewer=request.user, notes=notes)
            self.message_user(
                request,
                f"✓ Approved — {obj.applicant.email} has been granted the {obj.requested_role} role.",
                level=messages.SUCCESS,
            )
            return HttpResponseRedirect("../")

        if "_reject" in request.POST:
            if obj.status != VerificationRequest.Status.PENDING:
                self.message_user(request, "Only PENDING requests can be rejected.", level=messages.WARNING)
                return HttpResponseRedirect(".")
            notes = request.POST.get("reviewer_notes", "")
            obj.reject(reviewer=request.user, notes=notes)
            self.message_user(
                request,
                f"✗ Rejected — {obj.applicant.email}'s {obj.requested_role} request has been rejected.",
                level=messages.WARNING,
            )
            return HttpResponseRedirect("../")

        return super().response_change(request, obj)

    # ── Bulk list actions ──────────────────────────────────────────────────────

    @admin.action(description="Approve selected pending requests")
    def approve_selected(self, request, queryset):
        approved = 0
        skipped  = 0
        for obj in queryset:
            if obj.status == VerificationRequest.Status.PENDING:
                obj.approve(reviewer=request.user)
                approved += 1
            else:
                skipped += 1
        if approved:
            self.message_user(request, f"✓ Approved {approved} request(s).", level=messages.SUCCESS)
        if skipped:
            self.message_user(request, f"{skipped} request(s) skipped (not PENDING).", level=messages.WARNING)

    @admin.action(description="Reject selected pending requests")
    def reject_selected(self, request, queryset):
        rejected = 0
        skipped  = 0
        for obj in queryset:
            if obj.status == VerificationRequest.Status.PENDING:
                obj.reject(reviewer=request.user)
                rejected += 1
            else:
                skipped += 1
        if rejected:
            self.message_user(request, f"✗ Rejected {rejected} request(s).", level=messages.WARNING)
        if skipped:
            self.message_user(request, f"{skipped} request(s) skipped (not PENDING).", level=messages.WARNING)

    actions = [approve_selected, reject_selected]