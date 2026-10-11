import jwt
import logging
from typing import Optional
from fastapi import Request, Header, HTTPException, status, Depends
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("genomeai.auth")

class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    name: str
    session_id: Optional[str] = None

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    """
    Extracts and cryptographically verifies the authenticated user from the Next.js session token.
    Accepts:
    1. 'Authorization: Bearer <token>' header
    2. 'genome_session_token' HTTP cookie
    """
    token = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

    if not token:
        token = request.cookies.get("genome_session_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No session token provided in Authorization header or cookie.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "userId"]}
        )

        user_id = payload.get("userId")
        email = payload.get("email", "")
        name = payload.get("name", "")
        session_id = payload.get("sessionId")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing userId claim."
            )

        return AuthenticatedUser(
            user_id=user_id,
            email=email,
            name=name,
            session_id=session_id
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Rejected invalid JWT token: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered session credentials."
        )
