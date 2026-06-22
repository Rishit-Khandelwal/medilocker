from django.urls import path
from .views import ChatView, SessionListView, SessionDetailView, RenameSessionView, LLMStatusView

urlpatterns = [
    path("chat/",                     ChatView.as_view(),          name="ai-chat"),
    path("sessions/",                 SessionListView.as_view(),   name="ai-sessions"),
    path("sessions/<int:pk>/",        SessionDetailView.as_view(), name="ai-session-detail"),
    path("sessions/<int:pk>/rename/", RenameSessionView.as_view(), name="ai-session-rename"),
    path("status/",                   LLMStatusView.as_view(),     name="ai-status"),
]