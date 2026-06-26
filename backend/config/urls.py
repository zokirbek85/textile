from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

API_V1 = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),

    # API v1
    path(API_V1 + "auth/", include("apps.authentication.urls")),
    path(API_V1 + "users/", include("apps.users.urls")),
    path(API_V1 + "warehouse/", include("apps.warehouse.urls")),
    path(API_V1 + "cotton-production/", include("apps.cotton_production.urls")),
    path(API_V1 + "yarn-production/", include("apps.yarn_production.urls")),
    path(API_V1 + "costing/", include("apps.costing_engine.urls")),
    path(API_V1 + "finance/", include("apps.finance.urls")),
    path(API_V1 + "dashboard/", include("apps.dashboard.urls")),
    path(API_V1 + "reports/", include("apps.reporting.urls")),
    path(API_V1 + "analytics/", include("apps.analytics.urls")),
    path(API_V1 + "tolling/", include("apps.tolling.urls")),
    path(API_V1 + "production/", include("apps.production.urls")),
    path(API_V1 + "quality/", include("apps.quality.urls")),
    path(API_V1 + "maintenance/", include("apps.maintenance.urls")),

    # API Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
