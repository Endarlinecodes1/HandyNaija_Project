"""Provider / Artisan directory and profile management API endpoints."""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_provider import crud_provider
from app.models.service import ProviderService
from app.models.user import ProviderProfile, User
from app.models.review import VerificationRecord, VerificationStatus
from app.schemas.provider import (
    ProviderFilter,
    ProviderProfileResponse,
    ProviderProfileUpdate,
    ProviderServiceCreate,
    ProviderServiceResponse,
)
from app.schemas.review import (
    VerificationRecordCreate,
    VerificationRecordResponse,
)

router = APIRouter()


@router.get("/", response_model=List[ProviderProfileResponse], summary="Search and list providers")
def search_providers(
    db: Session = Depends(deps.get_db),
    category_id: Optional[int] = Query(None, description="Filter by service category ID"),
    location: Optional[str] = Query(None, description="Filter by Nigerian state or city"),
    search: Optional[str] = Query(None, description="Search keyword in business name, bio, or service area"),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0, description="Filter by minimum rating (1-5)"),
    availability_status: Optional[bool] = Query(None, description="Filter by availability"),
    is_verified: Optional[bool] = Query(None, description="Only show verified artisans"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Browse and filter registered artisans across Nigerian cities and categories with pagination."""
    filters = ProviderFilter(
        category_id=category_id,
        location=location,
        search=search,
        min_rating=min_rating,
        availability_status=availability_status,
        is_verified=is_verified,
        skip=skip,
        limit=limit,
    )
    return crud_provider.filter_providers(db, filters=filters)


@router.get("/{provider_id}", response_model=ProviderProfileResponse)
def get_provider_profile(
    provider_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Retrieve full profile, portfolio services, and ratings of an artisan."""
    provider = crud_provider.get_with_details(db, provider_id=provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan provider profile not found.",
        )
    return provider


@router.put("/me/profile", response_model=ProviderProfileResponse)
def update_provider_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: ProviderProfileUpdate,
    current_provider: ProviderProfile = Depends(deps.get_current_provider),
) -> Any:
    """Update artisan business info, rates, experience, and service areas."""
    return crud_provider.update(db, db_obj=current_provider, obj_in=profile_in)


@router.post("/me/services", response_model=ProviderServiceResponse, status_code=status.HTTP_201_CREATED)
def create_provider_service(
    *,
    db: Session = Depends(deps.get_db),
    service_in: ProviderServiceCreate,
    current_provider: ProviderProfile = Depends(deps.get_current_provider),
) -> Any:
    """Add a new specialized service offering to artisan profile."""
    return crud_provider.add_service(db, provider_id=current_provider.id, obj_in=service_in)


@router.delete("/me/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_service(
    service_id: int,
    db: Session = Depends(deps.get_db),
    current_provider: ProviderProfile = Depends(deps.get_current_provider),
) -> None:
    """Delete a service offering from provider profile."""
    success = crud_provider.delete_service(db, service_id=service_id, provider_id=current_provider.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service listing not found.")


@router.post("/me/verification", response_model=VerificationRecordResponse, status_code=status.HTTP_201_CREATED)
def submit_verification_request(
    *,
    db: Session = Depends(deps.get_db),
    verification_in: VerificationRecordCreate,
    current_provider: ProviderProfile = Depends(deps.get_current_provider),
) -> Any:
    """Submit document for KYC badge verification."""
    existing = (
        db.query(VerificationRecord)
        .filter(VerificationRecord.provider_id == current_provider.id, VerificationRecord.status == VerificationStatus.PENDING)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A verification request is already pending review.",
        )

    v_record = VerificationRecord(
        provider_id=current_provider.id,
        document_type=verification_in.document_type,
        document_url=verification_in.document_url,
        status=VerificationStatus.PENDING,
    )
    db.add(v_record)
    db.commit()
    db.refresh(v_record)
    return v_record
