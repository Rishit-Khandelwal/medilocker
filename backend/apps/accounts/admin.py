from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Profile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display   = ["email", "username", "first_name", "last_name", "is_active", "date_joined"]
    search_fields  = ["email", "username"]
    ordering       = ["-date_joined"]
    add_fieldsets  = (
        (None, {"classes": ("wide",), "fields": ("email", "username", "password1", "password2")}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display  = ["user", "blood_group", "phone", "created_at"]
    search_fields = ["user__email"]