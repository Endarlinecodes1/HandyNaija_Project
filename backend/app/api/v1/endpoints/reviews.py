"""Review and feedback rating API endpoints."""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_review import crud_review
from app.models.request import RequestStatus, ServiceRequest
from app.models.review import Review
from app.models.user import CustomerProfile
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
)

router = APIRouter()


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_service_review(
    *,
    db: Session = Depends(deps.get_db),
    review_in: ReviewCreate,
    current_customer: CustomerProfile = Depends(deps.get_current_customer),
) -> Any:
    """Submit a rating (1-5) and review for a completed service request."""
    service_request = db.query(ServiceRequest).get(review_in.request_id)
    if not service_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found.",
        )
    if service_request.customer_id != current_customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review services requested by your account.",
        )
    if not service_request.provider_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No service provider is assigned to this request.",
        )

    try:
        return crud_review.create_review(
            db,
            obj_in=review_in,
            customer_id=current_customer.id,
            provider_id=service_request.provider_id,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.get("/provider/{provider_id}", response_model=List[ReviewResponse])
def get_provider_reviews(
    provider_id: int,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Retrieve ratings and customer reviews for a given artisan with pagination."""
    return crud_review.get_by_provider(
        db, provider_id=provider_id, skip=skip, limit=limit
    )
