"""ServiceRequest SQLAlchemy ORM model and status enums."""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class RequestStatus(str, enum.Enum):
    """Lifecycle status states of a service request."""

    PENDING = "Pending"
    ACCEPTED = "Accepted"
    PROPOSED_CHANGE = "Proposed Change"
    CONFIRMED = "Confirmed"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    DECLINED = "Declined"


class ServiceRequest(Base):
    """Customer job request directed to an artisan or open category."""

    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(
        Integer,
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider_id = Column(
        Integer,
        ForeignKey("provider_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("service_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status = Column(
        Enum(RequestStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=RequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    job_description = Column(Text, nullable=False)
    preferred_datetime = Column(DateTime(timezone=True), nullable=True)
    service_location = Column(String(255), nullable=False)
    image_attachments = Column(Text, nullable=True)  # JSON-encoded array or comma-separated URLs
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Composite indexes for high-frequency dashboard and status tracking queries
    __table_args__ = (
        Index("ix_request_provider_status", "provider_id", "status"),
        Index("ix_request_customer_status", "customer_id", "status"),
        Index("ix_request_category_status", "category_id", "status"),
    )

    # Relationships
    customer = relationship("CustomerProfile", back_populates="service_requests")
    provider = relationship("ProviderProfile", back_populates="service_requests")
    category = relationship("ServiceCategory", back_populates="service_requests")
    messages = relationship(
        "Message",
        back_populates="service_request",
        cascade="all, delete-orphan",
    )
    review = relationship(
        "Review",
        back_populates="service_request",
        uselist=False,
        cascade="all, delete-orphan",
    )
