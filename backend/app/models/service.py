"""ServiceCategory and ProviderService SQLAlchemy ORM models."""

from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ServiceCategory(Base):
    """Platform service categories (e.g., Plumbing, Electrical, Cleaning)."""

    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), unique=True, index=True, nullable=False)
    slug = Column(String(128), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon_url = Column(String(255), nullable=True)

    # Relationships
    provider_services = relationship(
        "ProviderService",
        back_populates="category",
        cascade="all, delete-orphan",
    )
    service_requests = relationship(
        "ServiceRequest",
        back_populates="category",
    )


class ProviderService(Base):
    """Specific artisan service catalog item and pricing."""

    __tablename__ = "provider_services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(
        Integer,
        ForeignKey("provider_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        Integer,
        ForeignKey("service_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0, nullable=False)

    # Table arguments: composite index for finding providers by category
    __table_args__ = (
        Index("ix_provider_service_category_provider", "category_id", "provider_id"),
    )

    # Relationships
    provider = relationship("ProviderProfile", back_populates="services")
    category = relationship("ServiceCategory", back_populates="provider_services")
