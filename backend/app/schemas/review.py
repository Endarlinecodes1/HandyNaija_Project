"""Review and VerificationRecord Pydantic validation & serialization schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.review import VerificationStatus


# --- Review Schemas ---
class ReviewBase(BaseModel):
    """Base fields for customer review and ratings."""

    rating: float = Field(
        ...,
        ge=1.0,
        le=5.0,
        description="Rating from 1.0 to 5.0 stars",
    )
    comment: Optional[str] = Field(
        None,
        max_length=2000,
        description="Detailed review feedback",
    )

    @field_validator("rating")
    @classmethod
    def round_rating(cls, v: float) -> float:
        if v < 1.0 or v > 5.0:
            raise ValueError("Rating must be between 1.0 and 5.0.")
        return round(v, 1)


class ReviewCreate(ReviewBase):
    """Schema for submitting a customer review for a completed service request."""

    request_id: int = Field(..., description="Completed Service Request ID")


class ReviewResponse(ReviewBase):
    """Schema for serializing a review entity."""

    id: int
    request_id: int
    customer_id: int
    provider_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Verification Record Schemas ---
class VerificationRecordBase(BaseModel):
    """Base fields for artisan identity verification document."""

    document_type: str = Field(
        ...,
        min_length=2,
        max_length=64,
        description="Type of ID document (e.g. NIN, Driver License, Voters Card, CAC)",
    )
    document_url: str = Field(
        ...,
        min_length=5,
        max_length=512,
        description="Secure document image URL or storage reference",
    )


class VerificationRecordCreate(VerificationRecordBase):
    """Schema for artisan submitting a KYC verification document."""

    pass


class VerificationRecordUpdate(BaseModel):
    """Schema for administrator reviewing and updating verification status."""

    status: VerificationStatus = Field(..., description="Approved or Rejected status")


class VerificationRecordResponse(VerificationRecordBase):
    """Schema for serializing verification record entity."""

    id: int
    provider_id: int
    status: VerificationStatus
    verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
