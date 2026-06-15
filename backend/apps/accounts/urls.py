from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, RateLimitedLoginView, LogoutView, MeView, ProfileView

urlpatterns = [
    path("register/",      RegisterView.as_view(),          name="auth-register"),
    path("login/",         RateLimitedLoginView.as_view(),  name="auth-login"),
    path("token/refresh/", TokenRefreshView.as_view(),      name="auth-refresh"),
    path("logout/",        LogoutView.as_view(),            name="auth-logout"),
    path("me/",            MeView.as_view(),                name="auth-me"),
    path("profile/",       ProfileView.as_view(),           name="auth-profile"),
]