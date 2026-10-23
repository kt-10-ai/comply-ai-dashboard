# Vercel serverless entrypoint: serves the FastAPI backend under /api/*.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app as backend_app  # noqa: E402


async def app(scope, receive, send):
    # vercel.json rewrites /api/* here; strip the prefix so backend routes
    # (/nbfc/..., /compliance/..., /api/chat) match unchanged.
    if scope["type"] in ("http", "websocket") and scope["path"].startswith("/api/"):
        scope = dict(scope, path=scope["path"][4:], raw_path=scope["path"][4:].encode())
    await backend_app(scope, receive, send)
