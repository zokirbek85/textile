from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Disable throttling in development
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405

# Django Debug Toolbar (optional — install separately if needed)
INTERNAL_IPS = ["127.0.0.1"]

# Use console email backend in dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Relaxed CORS for local dev
CORS_ALLOW_ALL_ORIGINS = True
