from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "username", "first_name", "last_name", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "email", "username", "first_name", "last_name", "date_joined"]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    user  = UserSerializer(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = Profile
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]