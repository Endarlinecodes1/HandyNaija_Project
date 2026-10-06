"""Authentication Token and TokenPayload schemas."""

from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Access token response payload."""

    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class TokenPayload(BaseModel):
    """Decoded JWT claims payload."""

    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
