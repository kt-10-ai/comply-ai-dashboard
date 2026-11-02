"""
Supabase JWT verification for the API.

Every protected request must carry `Authorization: Bearer <supabase access token>`.
The token must be signed by the project's Supabase Auth and have `aal == "aal2"`,
i.e. the user completed the authenticator-app (TOTP) second factor.

Config (env):
  SUPABASE_URL         https://<ref>.supabase.co  — enables auth; JWKS is fetched from it
  SUPABASE_JWT_SECRET  optional; only for projects still on the legacy HS256 shared secret

If SUPABASE_URL is unset, auth is disabled for local development — but never on Vercel.
"""
import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_URL and os.getenv("VERCEL"):
    raise RuntimeError("SUPABASE_URL must be set in production; refusing to start with auth disabled.")

_jwks = jwt.PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", cache_keys=True) if SUPABASE_URL else None


def _decode(token: str) -> dict:
    alg = jwt.get_unverified_header(token).get("alg")
    common = dict(audience="authenticated", issuer=f"{SUPABASE_URL}/auth/v1")
    if alg == "HS256":
        if not JWT_SECRET:
            raise HTTPException(401, "HS256 token but SUPABASE_JWT_SECRET is not configured")
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"], **common)
    key = _jwks.get_signing_key_from_jwt(token).key
    return jwt.decode(token, key, algorithms=["ES256", "RS256"], **common)


def require_user(authorization: str | None = Header(default=None)) -> dict:
    if _jwks is None:  # local dev without Supabase
        return {"sub": "local", "aal": "aal2"}

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    try:
        claims = _decode(authorization.split(" ", 1)[1])
    except HTTPException:
        raise
    except jwt.PyJWTError as e:
        raise HTTPException(401, f"Invalid token: {e}")

    if claims.get("aal") != "aal2":
        raise HTTPException(403, "Two-factor verification required")
    return claims
