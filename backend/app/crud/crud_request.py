"""CRUD operations for ServiceRequest with strict status transition enforcement."""

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.crud.base import CRUDBase
from app.models.request import RequestStatus, ServiceRequest
from app.schemas.request import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    validate_status_transition,
)


class CRUDRequest(CRUDBase[ServiceRequest, ServiceRequestCreate, ServiceRequestUpdate]):
    """ServiceRequest database operations and lifecycle state transitions."""

    def create_request(
        self,
        db: Session,
        *,
        obj_in: ServiceRequestCreate,
        customer_id: int,
    ) -> ServiceRequest:
        """Create a new service request with initial 'Pending' status."""
        request_obj = ServiceRequest(
            customer_id=customer_id,
            provider_id=obj_in.provider_id,
            category_id=obj_in.category_id,
            job_description=obj_in.job_description,
            service_location=obj_in.service_location,
            preferred_datetime=obj_in.preferred_datetime,
            image_attachments=obj_in.image_attachments,
            status=RequestStatus.PENDING,
        )
        db.add(request_obj)
        db.commit()
        db.refresh(request_obj)
        return request_obj

    def get_with_details(self, db: Session, *, request_id: int) -> Optional[ServiceRequest]:
        """Fetch request by ID with joined customer, provider, and category."""
        return (
            db.query(ServiceRequest)
            .options(
                joinedload(ServiceRequest.customer),
                joinedload(ServiceRequest.provider),
                joinedload(ServiceRequest.category),
            )
            .filter(ServiceRequest.id == request_id)
            .first()
        )

    def update_status(
        self,
        db: Session,
        *,
        request_obj: ServiceRequest,
        new_status: RequestStatus,
    ) -> ServiceRequest:
        """Validate and transition service request to next lifecycle status.

        Allowed workflow:
            Pending -> Accepted / Declined / Proposed Change / Cancelled
            Proposed Change -> Confirmed / Declined / Cancelled
            Accepted -> Confirmed / In Progress / Cancelled / Declined
            Confirmed -> In Progress / Cancelled
            In Progress -> Completed / Cancelled

        Raises:
            ValueError: If status transition violates lifecycle rules.
        """
        # Validate transition before modifying model
        validate_status_transition(request_obj.status, new_status)

        request_obj.status = new_status
        db.add(request_obj)
        db.commit()
        db.refresh(request_obj)
        return request_obj

    def get_by_customer(
        self,
        db: Session,
        *,
        customer_id: int,
        status: Optional[RequestStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ServiceRequest]:
        """Fetch paginated requests submitted by a customer."""
        query = (
            db.query(ServiceRequest)
            .options(
                joinedload(ServiceRequest.provider),
                joinedload(ServiceRequest.category),
            )
            .filter(ServiceRequest.customer_id == customer_id)
        )
        if status:
            query = query.filter(ServiceRequest.status == status)

        return query.order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_provider(
        self,
        db: Session,
        *,
        provider_id: int,
        status: Optional[RequestStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ServiceRequest]:
        """Fetch paginated requests assigned to an artisan provider."""
        query = (
            db.query(ServiceRequest)
            .options(
                joinedload(ServiceRequest.customer),
                joinedload(ServiceRequest.category),
            )
            .filter(ServiceRequest.provider_id == provider_id)
        )
        if status:
            query = query.filter(ServiceRequest.status == status)

        return query.order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit).all()


crud_request = CRUDRequest(ServiceRequest)
