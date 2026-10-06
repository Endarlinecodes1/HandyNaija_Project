"""CRUD operations for Review ratings and VerificationRecord entities."""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.request import RequestStatus, ServiceRequest
from app.models.review import Review, VerificationRecord, VerificationStatus
from app.models.user import ProviderProfile
from app.schemas.review import (
    ReviewCreate,
    VerificationRecordCreate,
    VerificationRecordUpdate,
)


class CRUDReview(CRUDBase[Review, ReviewCreate, ReviewCreate]):
    """Review operations and dynamic rating recalculation."""

    def create_review(
        self,
        db: Session,
        *,
        obj_in: ReviewCreate,
        customer_id: int,
        provider_id: int,
    ) -> Review:
        """Create a new review and recalculate the provider's average rating."""
        # 1. Ensure request is completed
        service_request = db.query(ServiceRequest).get(obj_in.request_id)
        if not service_request:
            raise ValueError("Service request not found.")
        if service_request.status != RequestStatus.COMPLETED:
            raise ValueError("Reviews can only be submitted for completed service requests.")

        # 2. Prevent duplicate review
        existing = db.query(Review).filter(Review.request_id == obj_in.request_id).first()
        if existing:
            raise ValueError("A review has already been submitted for this request.")

        # 3. Create review record
        review = Review(
            request_id=obj_in.request_id,
            customer_id=customer_id,
            provider_id=provider_id,
            rating=obj_in.rating,
            comment=obj_in.comment.strip() if obj_in.comment else None,
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        # 4. Recalculate provider rating metrics
        stats = (
            db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.provider_id == provider_id)
            .first()
        )
        if stats:
            avg_rating, count = stats
            provider = db.query(ProviderProfile).get(provider_id)
            if provider:
                provider.rating_avg = round(float(avg_rating or 5.0), 1)
                provider.review_count = int(count or 0)
                db.add(provider)
                db.commit()

        return review

    def get_by_provider(
        self,
        db: Session,
        *,
        provider_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Review]:
        """Fetch paginated customer reviews for a given artisan."""
        return (
            db.query(Review)
            .filter(Review.provider_id == provider_id)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # --- Verification Record Handlers ---
    def create_verification(
        self,
        db: Session,
        *,
        provider_id: int,
        obj_in: VerificationRecordCreate,
    ) -> VerificationRecord:
        """Submit a new verification document for KYC review."""
        record = VerificationRecord(
            provider_id=provider_id,
            document_type=obj_in.document_type.strip(),
            document_url=obj_in.document_url.strip(),
            status=VerificationStatus.PENDING,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def update_verification_status(
        self,
        db: Session,
        *,
        record: VerificationRecord,
        obj_in: VerificationRecordUpdate,
    ) -> VerificationRecord:
        """Update verification status (Approved / Rejected) and update provider profile."""
        record.status = obj_in.status
        if obj_in.status == VerificationStatus.APPROVED:
            record.verified_at = datetime.now(timezone.utc)
            provider = db.query(ProviderProfile).get(record.provider_id)
            if provider:
                provider.is_verified = True
                provider.user.is_verified = True
                db.add(provider)

        db.add(record)
        db.commit()
        db.refresh(record)
        return record


crud_review = CRUDReview(Review)
