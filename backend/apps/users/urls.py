from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ActivityLogListView

router = DefaultRouter()
router.register("", UserViewSet, basename="users")

urlpatterns = [
    path("activity-logs/", ActivityLogListView.as_view(), name="activity-logs"),
    path("", include(router.urls)),
]
