"""ProviderProfile and ProviderService Pydantic validation & serialization schemas."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# --- Provider Service Schemas ---
class ProviderServiceBase(BaseModel):
    """Base fields for an individual service offering by a provider."""

    category_id: int = Field(..., description="Service Category ID")
    description: Optional[str] = Field(None, max_length=1000, description="Service scope and details")
    price: float = Field(default=0.0, ge=0.0, description="Base or starting price in NGN")


class ProviderServiceCreate(ProviderServiceBase):
    """Schema for adding a new service listing to a provider profile."""

    pass


class ProviderServiceUpdate(BaseModel):
    """Schema for updating a service listing."""

    category_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, ge=0.0)


class ProviderServiceResponse(ProviderServiceBase):
    """Schema for serializing a provider's service listing."""

    id: int
    provider_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Provider Profile Schemas ---
class ProviderProfileBase(BaseModel):
    """Base fields for artisan / provider profile."""

    business_name: str = Field(..., min_length=2, max_length=128, description="Artisan or Business name")
    bio: Optional[str] = Field(None, max_length=2000, description="Short professional bio and experience")
    location: str = Field(..., min_length=2, max_length=128, description="Primary location / city (e.g. Lagos, Ikeja)")
    service_area: Optional[str] = Field(None, max_length=255, description="Areas served (e.g. Ikeja, Maryland, Ojota)")
    experience_years: int = Field(default=1, ge=0, description="Years of professional experience")
    starting_price: float = Field(default=0.0, ge=0.0, description="Starting service charge in NGN")
    availability_status: bool = Field(default=True, description="Whether artisan is currently accepting jobs")


class ProviderProfileCreate(ProviderProfileBase):
    """Schema for creating a provider profile."""

    pass


class ProviderProfileUpdate(BaseModel):
    """Schema for updating a provider profile."""

    business_name: Optional[str] = Field(None, min_length=2, max_length=128)
    bio: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, min_length=2, max_length=128)
    service_area: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[int] = Field(None, ge=0)
    starting_price: Optional[float] = Field(None, ge=0.0)
    availability_status: Optional[bool] = None


class ProviderRegisterRequest(BaseModel):
    """Schema for artisan registration with complete user and profile validation."""

    full_name: str = Field(..., min_length=2, max_length=128, description="Artisan full name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")
    phone_number: str = Field(..., min_length=7, max_length=32, description="Active phone number")
    business_name: str = Field(..., min_length=2, max_length=128, description="Business or Brand name")
    bio: Optional[str] = Field(None, max_length=2000, description="Bio / description")
    location: str = Field(..., min_length=2, max_length=128, description="State/City in Nigeria (e.g. Lagos, Ikeja)")
    service_area: Optional[str] = Field(None, max_length=255, description="Service coverage areas")
    experience_years: int = Field(default=1, ge=0, description="Years of experience")
    starting_price: float = Field(default=0.0, ge=0.0, description="Starting service fee")
    category_id: Optional[int] = Field(None, description="Primary service category ID")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("phone_number")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        return v.strip()


class ProviderUserSummary(BaseModel):
    """Summary of User entity associated with provider."""

    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class ProviderProfileResponse(ProviderProfileBase):
    """Schema for serializing a complete provider profile with metrics."""

    id: int
    user_id: int
    is_verified: bool
    rating_avg: float
    review_count: int
    user: Optional[ProviderUserSummary] = None
    services: List[ProviderServiceResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Provider Filter / Search Parameters ---
class ProviderFilter(BaseModel):
    """Query filter parameters for provider discovery with pagination."""

    category_id: Optional[int] = Field(None, description="Filter by service category ID")
    location: Optional[str] = Field(None, description="Filter by state or city location")
    min_rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="Minimum average rating")
    availability_status: Optional[bool] = Field(None, description="Filter by availability")
    is_verified: Optional[bool] = Field(None, description="Filter by verification badge")
    search: Optional[str] = Field(None, description="Keyword search across name, bio, and service areas")
    skip: int = Field(default=0, ge=0, description="Pagination offset")
    limit: int = Field(default=20, ge=1, le=100, description="Pagination page size limit")
