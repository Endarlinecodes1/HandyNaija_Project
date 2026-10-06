"""ServiceRequest Pydantic validation & serialization schemas with lifecycle transition rules."""

from datetime import datetime
from typing import Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.request import RequestStatus
from app.schemas.service import ServiceCategoryResponse

# Explicit state transition graph for service requests
ALLOWED_STATUS_TRANSITIONS: Dict[RequestStatus, Set[RequestStatus]] = {
    RequestStatus.PENDING: {
        RequestStatus.ACCEPTED,
        RequestStatus.DECLINED,
        RequestStatus.PROPOSED_CHANGE,
        RequestStatus.CANCELLED,
    },
    RequestStatus.PROPOSED_CHANGE: {
        RequestStatus.CONFIRMED,
        RequestStatus.DECLINED,
        RequestStatus.CANCELLED,
    },
    RequestStatus.ACCEPTED: {
        RequestStatus.CONFIRMED,
        RequestStatus.IN_PROGRESS,
        RequestStatus.CANCELLED,
        RequestStatus.DECLINED,
    },
    RequestStatus.CONFIRMED: {
        RequestStatus.IN_PROGRESS,
        RequestStatus.CANCELLED,
    },
    RequestStatus.IN_PROGRESS: {
        RequestStatus.COMPLETED,
        RequestStatus.CANCELLED,
    },
    RequestStatus.COMPLETED: set(),  # Terminal state
    RequestStatus.CANCELLED: set(),  # Terminal state
    RequestStatus.DECLINED: set(),   # Terminal state
}


def validate_status_transition(current_status: RequestStatus, new_status: RequestStatus) -> None:
    """Validate if transitioning from current_status to new_status is allowed.

    Raises:
        ValueError: If the transition is illegal according to lifecycle rules.
    """
    if current_status == new_status:
        return
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        allowed_names = [s.value for s in allowed] or ["None (Terminal State)"]
        raise ValueError(
            f"Invalid status transition from '{current_status.value}' to '{new_status.value}'. "
            f"Allowed next states: {', '.join(allowed_names)}."
        )


class ServiceRequestBase(BaseModel):
    """Base fields for service request."""

    job_description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Detailed description of the issue or job requirement",
    )
    service_location: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Physical location or residential address for service delivery",
    )
    preferred_datetime: Optional[datetime] = Field(
        None,
        description="Customer preferred date and time for service",
    )
    image_attachments: Optional[str] = Field(
        None,
        description="JSON array string or comma-separated URLs of issue photos",
    )
    category_id: Optional[int] = Field(None, description="Service Category ID")


class ServiceRequestCreate(ServiceRequestBase):
    """Schema for customer job request submission."""

    provider_id: Optional[int] = Field(
        None,
        description="Target artisan ID (optional; if omitted, open request)",
    )

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Job description must be at least 10 characters long.")
        return v

    @field_validator("service_location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Service location must be at least 3 characters long.")
        return v


class ServiceRequestUpdate(BaseModel):
    """Schema for updating details of a pending service request."""

    job_description: Optional[str] = Field(None, min_length=10, max_length=5000)
    service_location: Optional[str] = Field(None, min_length=3, max_length=255)
    preferred_datetime: Optional[datetime] = None
    image_attachments: Optional[str] = None
    category_id: Optional[int] = None


class ServiceRequestStatusUpdate(BaseModel):
    """Schema for transitioning request status with notes."""

    status: RequestStatus = Field(..., description="Target status state")
    notes: Optional[str] = Field(None, max_length=500, description="Reason or notes for status change")


class ServiceRequestResponse(ServiceRequestBase):
    """Schema for serializing a service request entity."""

    id: int
    customer_id: int
    provider_id: Optional[int] = None
    status: RequestStatus
    created_at: datetime
    category: Optional[ServiceCategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)
