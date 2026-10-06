"""Admin dashboard, verification approval, and platform reports API endpoints."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_user import crud_user
from app.models.request import RequestStatus, ServiceRequest
from app.models.review import Review, VerificationRecord, VerificationStatus
from app.models.service import ServiceCategory
from app.models.user import CustomerProfile, ProviderProfile, User, UserRole
from app.schemas.review import VerificationRecordResponse, VerificationRecordUpdate
from app.schemas.user import UserResponse

router = APIRouter()


@router.get(
    "/dashboard",
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="Admin overview metrics",
)
@router.get(
    "/dashboard-stats",
    dependencies=[Depends(deps.get_current_active_superuser)],
    include_in_schema=False,
)
def get_admin_dashboard(
    db: Session = Depends(deps.get_db),
) -> Dict[str, Any]:
    """Retrieve high-level overview metrics for administrator portal."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.CUSTOMER).scalar() or 0
    total_providers = db.query(func.count(ProviderProfile.id)).scalar() or 0
    verified_providers = (
        db.query(func.count(ProviderProfile.id))
        .filter(ProviderProfile.is_verified == True)  # noqa: E712
        .scalar() or 0
    )
    pending_verifications = (
        db.query(func.count(VerificationRecord.id))
        .filter(VerificationRecord.status == VerificationStatus.PENDING)
        .scalar() or 0
    )
    total_requests = db.query(func.count(ServiceRequest.id)).scalar() or 0
    completed_requests = (
        db.query(func.count(ServiceRequest.id))
        .filter(ServiceRequest.status == RequestStatus.COMPLETED)
        .scalar() or 0
    )
    active_categories = db.query(func.count(ServiceCategory.id)).scalar() or 0
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    avg_rating = db.query(func.avg(Review.rating)).scalar() or 5.0

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_providers": total_providers,
        "verified_providers": verified_providers,
        "pending_verifications": pending_verifications,
        "total_requests": total_requests,
        "completed_requests": completed_requests,
        "active_categories": active_categories,
        "total_reviews": total_reviews,
        "avg_platform_rating": round(float(avg_rating), 1),
    }


@router.get(
    "/verifications",
    response_model=List[VerificationRecordResponse],
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="List verification requests",
)
def list_verifications(
    db: Session = Depends(deps.get_db),
    status_filter: Optional[VerificationStatus] = Query(None, description="Filter by status (Pending, Approved, Rejected)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """List artisan identity verification records filtered by status with pagination."""
    query = db.query(VerificationRecord)
    if status_filter:
        query = query.filter(VerificationRecord.status == status_filter)
    return query.order_by(VerificationRecord.id.desc()).offset(skip).limit(limit).all()


@router.patch(
    "/verifications/{verification_id}",
    response_model=VerificationRecordResponse,
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="Approve or reject verification record",
)
@router.post(
    "/verifications/{verification_id}/action",
    response_model=VerificationRecordResponse,
    dependencies=[Depends(deps.get_current_active_superuser)],
    include_in_schema=False,
)
def review_verification(
    *,
    db: Session = Depends(deps.get_db),
    verification_id: int,
    action: VerificationRecordUpdate,
    current_admin: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Admin approves or rejects an artisan credential verification record."""
    v_record = db.query(VerificationRecord).get(verification_id)
    if not v_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification record not found.")

    v_record.status = action.status
    if action.status == VerificationStatus.APPROVED:
        v_record.verified_at = datetime.now(timezone.utc)
        provider = db.query(ProviderProfile).get(v_record.provider_id)
        if provider:
            provider.is_verified = True
            provider.user.is_verified = True
            db.add(provider)
    elif action.status == VerificationStatus.REJECTED:
        provider = db.query(ProviderProfile).get(v_record.provider_id)
        if provider:
            provider.is_verified = False
            provider.user.is_verified = False
            db.add(provider)

    db.add(v_record)
    db.commit()
    db.refresh(v_record)
    return v_record


@router.get(
    "/reports",
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="View platform analytics, reports, and moderation summary",
)
def get_platform_reports(
    db: Session = Depends(deps.get_db),
) -> Dict[str, Any]:
    """Comprehensive analytics reports and user moderation breakdown."""
    # 1. Requests by status breakdown
    status_counts = (
        db.query(ServiceRequest.status, func.count(ServiceRequest.id))
        .group_by(ServiceRequest.status)
        .all()
    )
    requests_by_status = {status.value: count for status, count in status_counts}

    # 2. Category distribution
    categories = db.query(ServiceCategory).all()
    category_breakdown = []
    for cat in categories:
        prov_count = db.query(func.count(ProviderProfile.id)).join(
            ProviderProfile.services
        ).filter(ProviderProfile.services.any(category_id=cat.id)).scalar() or 0
        req_count = db.query(func.count(ServiceRequest.id)).filter(
            ServiceRequest.category_id == cat.id
        ).scalar() or 0
        category_breakdown.append({
            "id": cat.id,
            "name": cat.name,
            "providers_count": prov_count,
            "requests_count": req_count,
        })

    # 3. Top performing artisans
    top_providers_query = (
        db.query(ProviderProfile)
        .order_by(ProviderProfile.rating_avg.desc(), ProviderProfile.review_count.desc())
        .limit(10)
        .all()
    )
    top_providers = [
        {
            "id": p.id,
            "business_name": p.business_name,
            "location": p.location,
            "rating_avg": p.rating_avg,
            "review_count": p.review_count,
            "is_verified": p.is_verified,
        }
        for p in top_providers_query
    ]

    # 4. User Moderation Overview
    total_active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0  # noqa: E712
    total_suspended_users = db.query(func.count(User.id)).filter(User.is_active == False).scalar() or 0  # noqa: E712

    return {
        "requests_by_status": requests_by_status,
        "category_breakdown": category_breakdown,
        "top_rated_providers": top_providers,
        "moderation_summary": {
            "active_users": total_active_users,
            "suspended_users": total_suspended_users,
        },
    }


@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="Activate or deactivate user account for moderation",
)
def toggle_user_status(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    is_active: bool = Query(..., description="Target active status (true=active, false=suspended)"),
) -> Any:
    """Activate or suspend a user account."""
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
