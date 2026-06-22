from django.urls import path
from .views import SemanticSearchView, OCRStatusView, ReindexView

urlpatterns = [
    path("",                            SemanticSearchView.as_view(), name="semantic-search"),
    path("status/<int:record_id>/",     OCRStatusView.as_view(),      name="ocr-status"),
    path("reindex/<int:record_id>/",    ReindexView.as_view(),        name="reindex-record"),
]