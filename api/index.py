"""Vercel serverless entrypoint: serves the FastAPI app under /backend/*."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app as _app  # noqa: E402

PREFIX = "/backend"


async def app(scope, receive, send):
    # vercel.json rewrites /backend/* here; strip the prefix so FastAPI routes match.
    if scope["type"] in ("http", "websocket") and scope["path"].startswith(PREFIX):
        scope = dict(scope, path=scope["path"][len(PREFIX):] or "/", root_path="")
    await _app(scope, receive, send)
