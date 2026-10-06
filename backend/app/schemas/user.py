"""User, CustomerProfile, and UserProfileUpdate Pydantic validation & serialization schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.models.user import UserRole


# --- Customer Profile Schemas ---
class CustomerProfileBase(BaseModel):
    """Base fields for customer profile."""

    full_name: str = Field(..., min_length=2, max_length=128, description="Customer full name")
    phone_number: Optional[str] = Field(None, max_length=32, description="Phone number")
    address: Optional[str] = Field(None, max_length=500, description="Customer delivery / residential address")


class CustomerProfileCreate(CustomerProfileBase):
    """Schema for creating a customer profile."""

    pass


class CustomerProfileUpdate(BaseModel):
    """Schema for updating a customer profile."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=128)
    phone_number: Optional[str] = Field(None, max_length=32)
    address: Optional[str] = Field(None, max_length=500)


class CustomerProfileResponse(CustomerProfileBase):
    """Schema for serializing customer profile data."""

    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Provider Profile Summary (For UserProfileResponse) ---
class ProviderProfileSummary(BaseModel):
    """Summary of provider profile attached to user details."""

    id: int
    business_name: str
    bio: Optional[str] = None
    location: str
    service_area: Optional[str] = None
    experience_years: int
    starting_price: float
    availability_status: bool
    is_verified: bool
    rating_avg: float
    review_count: int

    model_config = ConfigDict(from_attributes=True)


# --- User Base & Registration Schemas ---
class UserBase(BaseModel):
    """Base user fields."""

    email: EmailStr = Field(..., description="Unique email address")
    role: UserRole = Field(default=UserRole.CUSTOMER, description="User role (customer, provider, admin)")


class UserCreate(UserBase):
    """Schema for creating a basic user with password."""

    password: str = Field(..., min_length=6, max_length=128, description="Plain text password (min 6 chars)")


class UserRegisterCustomer(BaseModel):
    """Schema for customer registration with profile information."""

    full_name: str = Field(..., min_length=2, max_length=128, description="Customer full name")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")
    phone_number: Optional[str] = Field(None, max_length=32, description="Phone number")
    address: Optional[str] = Field(None, max_length=500, description="Address / Location in Nigeria")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        return v


class UserRegisterRequest(BaseModel):
    """Unified registration schema supporting customer and service provider accounts."""

    role: UserRole = Field(default=UserRole.CUSTOMER, description="Role to register: 'customer' or 'provider'")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")
    full_name: Optional[str] = Field(None, min_length=2, max_length=128, description="User / Artisan full name")
    phone_number: Optional[str] = Field(None, max_length=32, description="Phone number")
    address: Optional[str] = Field(None, max_length=500, description="Address (for customers)")
    
    # Provider-specific fields (used when role is 'provider')
    business_name: Optional[str] = Field(None, max_length=128, description="Business name for provider")
    bio: Optional[str] = Field(None, max_length=2000, description="Bio / description for provider")
    location: Optional[str] = Field(None, max_length=128, description="State/City in Nigeria (e.g. Lagos, Ikeja)")
    service_area: Optional[str] = Field(None, max_length=255, description="Service coverage areas")
    experience_years: Optional[int] = Field(default=1, ge=0, description="Years of experience")
    starting_price: Optional[float] = Field(default=0.0, ge=0.0, description="Starting service fee")
    category_id: Optional[int] = Field(None, description="Primary service category ID")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    """Schema for updating user account credentials."""

    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserProfileUpdate(BaseModel):
    """Unified schema for updating authenticated user profile details (Customer or Provider)."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=128)
    phone_number: Optional[str] = Field(None, max_length=32)
    address: Optional[str] = Field(None, max_length=500)
    
    # Provider fields
    business_name: Optional[str] = Field(None, min_length=2, max_length=128)
    bio: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, min_length=2, max_length=128)
    service_area: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[int] = Field(None, ge=0)
    starting_price: Optional[float] = Field(None, ge=0.0)
    availability_status: Optional[bool] = None


class UserPasswordUpdate(BaseModel):
    """Schema for changing user password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    """Schema for JSON authentication payload."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """Schema for serializing User entity."""

    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    customer_profile: Optional[CustomerProfileResponse] = None
    provider_profile: Optional[ProviderProfileSummary] = None

    model_config = ConfigDict(from_attributes=True)
