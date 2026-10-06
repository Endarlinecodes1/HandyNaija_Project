"""Message Pydantic validation and serialization schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MessageBase(BaseModel):
    """Base message content fields."""

    content: str = Field(..., min_length=1, max_length=5000, description="Chat message body")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message content cannot be empty.")
        return v


class MessageCreate(MessageBase):
    """Schema for sending a new message within a service request."""

    request_id: int = Field(..., description="Associated Service Request ID")


class MessageResponse(MessageBase):
    """Schema for serializing a message entity."""

    id: int
    request_id: int
    sender_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
