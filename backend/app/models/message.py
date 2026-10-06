"""Message SQLAlchemy ORM model for service request messaging."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Message(Base):
    """Direct chat message between Customer and Artisan concerning a Service Request."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(
        Integer,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Composite index for chronologically retrieving messages in a request thread
    __table_args__ = (
        Index("ix_message_request_timestamp", "request_id", "timestamp"),
    )

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="messages")
    sender = relationship("User", back_populates="messages_sent")
