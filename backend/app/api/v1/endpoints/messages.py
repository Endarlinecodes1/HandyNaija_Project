"""In-app job communication and messaging API endpoints."""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_user import crud_user
from app.models.message import Message
from app.models.request import ServiceRequest
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse
from app.services.notification import notification_service

router = APIRouter()


@router.get("/request/{request_id}", response_model=List[MessageResponse])
def get_request_messages(
    request_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve chat history and messages for a specific service request."""
    service_request = db.query(ServiceRequest).get(request_id)
    if not service_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    is_admin = crud_user.is_superuser(current_user)
    is_customer = current_user.customer_profile and current_user.customer_profile.id == service_request.customer_id
    is_provider = current_user.provider_profile and current_user.provider_profile.id == service_request.provider_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")

    messages = (
        db.query(Message)
        .filter(Message.request_id == request_id)
        .order_by(Message.timestamp.asc())
        .all()
    )

    return messages


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    *,
    db: Session = Depends(deps.get_db),
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Send a direct message related to a service request."""
    service_request = db.query(ServiceRequest).get(message_in.request_id)
    if not service_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")

    is_admin = crud_user.is_superuser(current_user)
    is_customer = current_user.customer_profile and current_user.customer_profile.id == service_request.customer_id
    is_provider = current_user.provider_profile and current_user.provider_profile.id == service_request.provider_id

    if not (is_admin or is_customer or is_provider):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to send messages for this request.")

    msg = Message(
        request_id=message_in.request_id,
        sender_id=current_user.id,
        content=message_in.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Determine recipient notification email
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
