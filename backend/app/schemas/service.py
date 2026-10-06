"""ServiceCategory Pydantic validation & serialization schemas."""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ServiceCategoryBase(BaseModel):
    """Base fields for platform service category."""

    name: str = Field(..., min_length=2, max_length=128, description="Category name (e.g. Plumbing)")
    slug: str = Field(..., min_length=2, max_length=128, description="URL-friendly slug (e.g. plumbing)")
    description: Optional[str] = Field(None, description="Category overview")
    icon_url: Optional[str] = Field(None, max_length=255, description="Icon asset path or URL")


class ServiceCategoryCreate(ServiceCategoryBase):
    """Schema for creating a service category."""

    pass


class ServiceCategoryUpdate(BaseModel):
    """Schema for updating a service category."""

    name: Optional[str] = Field(None, min_length=2, max_length=128)
    slug: Optional[str] = Field(None, min_length=2, max_length=128)
    description: Optional[str] = None
    icon_url: Optional[str] = Field(None, max_length=255)


class ServiceCategoryResponse(ServiceCategoryBase):
    """Schema for serializing a service category."""

    id: int

    model_config = ConfigDict(from_attributes=True)
