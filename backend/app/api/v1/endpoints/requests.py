"""Service Request lifecycle management & in-app messaging API endpoints."""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_provider import crud_provider
from app.crud.crud_request import crud_request
from app.crud.crud_user import crud_user
from app.models.message import Message
from app.models.request import RequestStatus, ServiceRequest
from app.models.user import CustomerProfile, ProviderProfile, User, UserRole
from app.schemas.message import MessageBase, MessageResponse
from app.schemas.request import (
    ServiceRequestCreate,
    ServiceRequestResponse,
    ServiceRequestStatusUpdate,
    ServiceRequestUpdate,
)
from app.services.notification import notification_service

router = APIRouter()


@router.get(
    "/",
    response_model=List[ServiceRequestResponse],
    summary="List service requests for current user based on role",
)
def list_my_requests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    status: Optional[RequestStatus] = Query(None, description="Filter by request status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """Retrieve service requests for current authenticated user based on role:

    - Customer: Customer bookings and job requests
    - Provider: Incoming job requests assigned to artisan
    - Admin: All platform requests with pagination
    """
    if current_user.role == UserRole.CUSTOMER:
        if not current_user.customer_profile:
            return []
        return crud_request.get_by_customer(
            db,
            customer_id=current_user.customer_profile.id,
            status=status,
            skip=skip,
            limit=limit,
        )
    elif current_user.role == UserRole.PROVIDER:
        if not current_user.provider_profile:
            return []
        return crud_request.get_by_provider(
            db,
            provider_id=current_user.provider_profile.id,
            status=status,
            skip=skip,
            limit=limit,
        )
    elif crud_user.is_superuser(current_user):
        query = db.query(ServiceRequest)
        if status:
            query = query.filter(ServiceRequest.status == status)
        return query.order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit).all()

    return []


@router.post(
    "/",
    response_model=ServiceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new service request",
)
def create_service_request(
    *,
    db: Session = Depends(deps.get_db),
    request_in: ServiceRequestCreate,
    current_customer: CustomerProfile = Depends(deps.get_current_customer),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Customer submits a new service request with job description, preferred time, and location."""
    if request_in.provider_id:
        provider = crud_provider.get(db, id=request_in.provider_id)
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected provider was not found.",
            )

    new_request = crud_request.create_request(
        db, obj_in=request_in, customer_id=current_customer.id
    )

    # Dispatch notification alert
    notification_service.send_request_status_notification(
        recipient_email=current_user.email,
        recipient_phone=current_customer.phone_number,
        request_title=new_request.job_description[:40],
        new_status=new_request.status.value,
    )

    return new_request


@router.get(
    "/customer/me",
    response_model=List[ServiceRequestResponse],
    summary="List customer bookings",
)
def get_my_customer_requests(
    db: Session = Depends(deps.get_db),
    current_customer: CustomerProfile = Depends(deps.get_current_customer),
    status: Optional[RequestStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """List service requests submitted by the current authenticated customer."""
    return crud_request.get_by_customer(
        db, customer_id=current_customer.id, status=status, skip=skip, limit=limit
    )


@router.get(
    "/provider/me",
    response_model=List[ServiceRequestResponse],
    summary="List provider incoming requests",
)
def get_my_provider_requests(
    db: Session = Depends(deps.get_db),
    current_provider: ProviderProfile = Depends(deps.get_current_provider),
    status: Optional[RequestStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """List service requests assigned to the current authenticated artisan."""
    return crud_request.get_by_provider(
        db, provider_id=current_provider.id, status=status, skip=skip, limit=limit
    )


@router.get(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="View request details",
)
def get_service_request(
    request_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve details of a service request."""
    request_obj = crud_request.get_with_details(db, request_id=request_id)
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found.",
        )

    # Permission check: Customer owner, Assigned provider, or Admin
    is_admin = crud_user.is_superuser(current_user)
    is_owner = current_user.customer_profile and current_user.customer_profile.id == request_obj.customer_id
    is_assigned_provider = current_user.provider_profile and current_user.provider_profile.id == request_obj.provider_id

    if not (is_admin or is_owner or is_assigned_provider):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this service request.",
        )

    return request_obj


@router.patch(
    "/{request_id}/status",
    response_model=ServiceRequestResponse,
    summary="Update request status",
)
def update_service_request_status(
    *,
    db: Session = Depends(deps.get_db),
    request_id: int,
    status_in: ServiceRequestStatusUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Provider or customer updates request status: accept, decline, propose change, confirm, in progress, complete, cancel."""
    request_obj = crud_request.get(db, id=request_id)
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found.",
        )

    is_admin = crud_user.is_superuser(current_user)
    is_owner = current_user.customer_profile and current_user.customer_profile.id == request_obj.customer_id
    is_assigned_provider = current_user.provider_profile and current_user.provider_profile.id == request_obj.provider_id

    if not (is_admin or is_owner or is_assigned_provider):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this request status.",
        )

    try:
        updated_request = crud_request.update_status(
            db,
            request_obj=request_obj,
            new_status=status_in.status,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    return updated_request


@router.put(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Update request details",
)
def update_service_request_details(
    *,
    db: Session = Depends(deps.get_db),
    request_id: int,
    request_in: ServiceRequestUpdate,
    current_customer: CustomerProfile = Depends(deps.get_current_customer),
) -> Any:
    """Update editable details of a pending service request."""
    request_obj = crud_request.get(db, id=request_id)
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found.",
        )
    if request_obj.customer_id != current_customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit requests you submitted.",
        )
    if request_obj.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit requests that have already been accepted or progressed.",
        )

    return crud_request.update(db, db_obj=request_obj, obj_in=request_in)


# --- In-App Messages within Service Request ---
@router.get(
    "/{request_id}/messages",
    response_model=List[MessageResponse],
    summary="Get in-app messages for a service request",
)
def get_request_messages(
    request_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve chat history and direct messages for a specific service request."""
    service_request = db.query(ServiceRequest).get(request_id)
    if not service_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    is_admin = crud_user.is_superuser(current_user)
    is_customer = current_user.customer_profile and current_user.customer_profile.id == service_request.customer_id
    is_provider = current_user.provider_profile and current_user.provider_profile.id == service_request.provider_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")

    return (
        db.query(Message)
        .filter(Message.request_id == request_id)
        .order_by(Message.timestamp.asc())
        .all()
    )


@router.post(
    "/{request_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send in-app message within a service request",
)
def send_request_message(
    *,
    db: Session = Depends(deps.get_db),
    request_id: int,
    message_in: MessageBase,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Send a direct message related to a service request."""
    service_request = db.query(ServiceRequest).get(request_id)
    if not service_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    is_admin = crud_user.is_superuser(current_user)
    is_customer = current_user.customer_profile and current_user.customer_profile.id == service_request.customer_id
    is_provider = current_user.provider_profile and current_user.provider_profile.id == service_request.provider_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to send messages for this request.")

    msg = Message(
        request_id=request_id,
        sender_id=current_user.id,
        content=message_in.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Determine recipient email for alert
    recipient_email = None
    if is_customer and service_request.provider and service_request.provider.user:
        recipient_email = service_request.provider.user.email
    elif is_provider and service_request.customer and service_request.customer.user:
        recipient_email = service_request.customer.user.email

    if recipient_email:
        sender_name = (
            current_user.customer_profile.full_name
            if current_user.customer_profile
            else (
                current_user.provider_profile.business_name
                if current_user.provider_profile
                else current_user.email
            )
        )
        notification_service.send_message_alert(
            recipient_email=recipient_email,
            sender_name=sender_name,
            snippet=msg.content,
        )

    return msg
