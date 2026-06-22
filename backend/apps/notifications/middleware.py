from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token):
    from rest_framework_simplejwt.tokens import AccessToken
    from django.contrib.auth import get_user_model
    try:
        validated = AccessToken(token)
        User = get_user_model()
        return User.objects.get(id=validated["user_id"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Channels has no built-in DRF-style auth — the same JWT access token used
    for REST calls is passed as ?token=<access_token> on the WS URL instead
    of an Authorization header (browsers don't allow custom headers on the
    native WebSocket constructor).
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token", [None])[0]
        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)