"""User, CustomerProfile, and ProviderProfile SQLAlchemy ORM models."""

import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
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


class UserRole(str, enum.Enum):
    """User account roles."""

    CUSTOMER = "customer"
    PROVIDER = "provider"
    ADMIN = "admin"


class User(Base):
    """Core User entity representing authentication credentials and base profile."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]),
        default=UserRole.CUSTOMER,
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    customer_profile = relationship(
        "CustomerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    provider_profile = relationship(
        "ProviderProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    messages_sent = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan",
    )


class CustomerProfile(Base):
    """Customer profile containing personal details and service delivery address."""

    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name = Column(String(128), nullable=False)
    phone_number = Column(String(32), index=True, nullable=True)
    address = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="customer_profile")
    service_requests = relationship(
        "ServiceRequest",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    reviews = relationship(
        "Review",
        back_populates="customer",
        cascade="all, delete-orphan",
    )


class ProviderProfile(Base):
    """Artisan and service provider profile for discovery, ratings, and quotes."""

    __tablename__ = "provider_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    business_name = Column(String(128), nullable=False, index=True)
    bio = Column(Text, nullable=True)
    location = Column(String(128), nullable=False, index=True)  # e.g., "Lagos, Ikeja"
    service_area = Column(String(255), nullable=True)  # e.g., "Ikeja, Maryland, Ojota"
    experience_years = Column(Integer, default=1, nullable=False)
    starting_price = Column(Float, default=0.0, nullable=False)
    availability_status = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    rating_avg = Column(Float, default=5.0, nullable=False, index=True)
    review_count = Column(Integer, default=0, nullable=False)

    # Table arguments: composite indexes for high-frequency queries
    __table_args__ = (
        Index("ix_provider_location_verified", "location", "is_verified"),
        Index("ix_provider_rating_verified", "rating_avg", "is_verified"),
    )

    # Relationships
    user = relationship("User", back_populates="provider_profile")
    services = relationship(
        "ProviderService",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
    service_requests = relationship(
        "ServiceRequest",
        back_populates="provider",
    )
    reviews = relationship(
        "Review",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
    verification_records = relationship(
        "VerificationRecord",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
