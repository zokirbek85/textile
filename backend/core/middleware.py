import logging
import json
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)

AUDIT_EXCLUDED_PATHS = {"/api/schema/", "/swagger/", "/redoc/", "/admin/jsi18n/"}
WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditLogMiddleware:
    """Logs all mutating API requests for audit trail."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.method in WRITE_METHODS
            and request.path.startswith("/api/")
            and request.path not in AUDIT_EXCLUDED_PATHS
        ):
            user = getattr(request, "user", None)
            user_repr = str(user) if user and user.is_authenticated else "anonymous"
            body_preview = ""
            try:
                if request.content_type == "application/json" and request.body:
                    body = json.loads(request.body)
                    body_preview = json.dumps(body)[:200]
            except Exception:
                pass

            logger.info(
                "AUDIT | user=%s | method=%s | path=%s | status=%s | body=%s",
                user_repr,
                request.method,
                request.path,
                response.status_code,
                body_preview,
            )

        return response


@database_sync_to_async
def get_user_from_token(token_key: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        token = AccessToken(token_key)
        user_id = token["user_id"]
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Attach authenticated user to WebSocket scope via JWT query param."""

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        token_key = token_list[0] if token_list else None

        scope["user"] = (
            await get_user_from_token(token_key)
            if token_key
            else AnonymousUser()
        )
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
