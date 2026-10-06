"""Review and VerificationRecord SQLAlchemy ORM models."""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    """Artisan credential verification status."""

    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class Review(Base):
    """Customer rating and review for an artisan upon service request completion."""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(
        Integer,
        ForeignKey("service_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    customer_id = Column(
        Integer,
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider_id = Column(
        Integer,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = Column(Float, nullable=False, index=True)
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Constraints & composite indexes
    __table_args__ = (
        CheckConstraint("rating >= 1.0 AND rating <= 5.0", name="chk_review_rating_range"),
        Index("ix_review_provider_rating", "provider_id", "rating"),
    )

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="review")
    customer = relationship("CustomerProfile", back_populates="reviews")
    provider = relationship("ProviderProfile", back_populates="reviews")


class VerificationRecord(Base):
    """Artisan identity or business credential document verification submission."""

    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(
        Integer,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type = Column(String(64), nullable=False)  # e.g., 'NIN', 'Driver License', 'Voters Card', 'CAC'
    document_url = Column(String(512), nullable=False)
    status = Column(
        Enum(VerificationStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Composite index for querying verification requests by status
    __table_args__ = (
        Index("ix_verification_provider_status", "provider_id", "status"),
    )

    # Relationships
    provider = relationship("ProviderProfile", back_populates="verification_records")
