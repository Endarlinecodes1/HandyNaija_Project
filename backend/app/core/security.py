"""Security utilities: password hashing, verification, and JWT token generation."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing context with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check plain text password against hashed database password.

    Args:
        plain_password: User entered plain password.
        hashed_password: Stored bcrypt hashed password.

    Returns:
        bool: True if passwords match, False otherwise.
    """
    return pwd_context.verify(plain_password[:72], hashed_password)


def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a plain password string.

    Args:
        password: Plain password string.

    Returns:
        str: Bcrypt hashed string.
    """
    return pwd_context.hash(password[:72])


def create_access_token(
    subject: Union[str, Any],
    role: str = "customer",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate encoded JWT access token with subject and claims.

    Args:
        subject: Subject identifier (e.g. user_id or email).
        role: User role (customer, provider, admin).
        expires_delta: Optional custom duration before expiration.
        extra_claims: Additional dictionary claims to encode.

    Returns:
        str: Encoded JWT token string.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "iat": now,
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token.

    Args:
        token: Raw JWT string.

    Returns:
        Optional[Dict[str, Any]]: Decoded payload claims dictionary, or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None
