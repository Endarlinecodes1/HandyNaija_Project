"""CRUD operations for ProviderProfile, ProviderService, and Artisan search with pagination."""

from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.core.security import get_password_hash
from app.crud.base import CRUDBase
from app.models.service import ProviderService
from app.models.user import ProviderProfile, User, UserRole
from app.schemas.provider import (
    ProviderFilter,
    ProviderProfileCreate,
    ProviderProfileUpdate,
    ProviderRegisterRequest,
    ProviderServiceCreate,
    ProviderServiceUpdate,
)


class CRUDProvider(CRUDBase[ProviderProfile, ProviderProfileCreate, ProviderProfileUpdate]):
    """Artisan and ProviderProfile database operations with filtering and pagination."""

    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[ProviderProfile]:
        """Fetch provider profile associated with a user ID."""
        return (
            db.query(ProviderProfile)
            .options(joinedload(ProviderProfile.services))
            .filter(ProviderProfile.user_id == user_id)
            .first()
        )

    def get_with_details(self, db: Session, *, provider_id: int) -> Optional[ProviderProfile]:
        """Fetch provider profile by ID including related services and user info."""
        return (
            db.query(ProviderProfile)
            .options(
                joinedload(ProviderProfile.services),
                joinedload(ProviderProfile.user),
            )
            .filter(ProviderProfile.id == provider_id)
            .first()
        )

    def register_provider(self, db: Session, *, obj_in: ProviderRegisterRequest) -> ProviderProfile:
        """Atomic artisan registration creating User, ProviderProfile, and initial service listing."""
        # 1. Create base user
        user = User(
            email=obj_in.email.lower().strip(),
            hashed_password=get_password_hash(obj_in.password),
            role=UserRole.PROVIDER,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Create provider profile
        profile = ProviderProfile(
            user_id=user.id,
            business_name=obj_in.business_name.strip(),
            bio=obj_in.bio.strip() if obj_in.bio else None,
            location=obj_in.location.strip(),
            service_area=obj_in.service_area.strip() if obj_in.service_area else None,
            experience_years=obj_in.experience_years,
            starting_price=obj_in.starting_price,
            availability_status=True,
            is_verified=False,
            rating_avg=5.0,
            review_count=0,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # 3. Create initial service if category_id provided
        if obj_in.category_id:
            service = ProviderService(
                provider_id=profile.id,
                category_id=obj_in.category_id,
                description=f"Standard service offering by {obj_in.business_name}",
                price=obj_in.starting_price,
            )
            db.add(service)
            db.commit()
            db.refresh(profile)

        return profile

    def filter_providers(
        self,
        db: Session,
        *,
        filters: ProviderFilter,
    ) -> List[ProviderProfile]:
        """Filter and search provider profiles by category, location, rating with pagination."""
        query = (
            db.query(ProviderProfile)
            .options(
                joinedload(ProviderProfile.services),
                joinedload(ProviderProfile.user),
            )
        )

        # Filter by Category ID (via joined ProviderService)
        if filters.category_id is not None:
            query = query.join(ProviderService, ProviderProfile.id == ProviderService.provider_id).filter(
                ProviderService.category_id == filters.category_id
            )

        # Filter by Location (case-insensitive contains match)
        if filters.location:
            loc_term = f"%{filters.location.strip()}%"
            query = query.filter(
                or_(
                    ProviderProfile.location.ilike(loc_term),
                    ProviderProfile.service_area.ilike(loc_term),
                )
            )

        # Filter by Minimum Average Rating
        if filters.min_rating is not None:
            query = query.filter(ProviderProfile.rating_avg >= filters.min_rating)

        # Filter by Availability Status
        if filters.availability_status is not None:
            query = query.filter(ProviderProfile.availability_status == filters.availability_status)

        # Filter by Verification Badge
        if filters.is_verified is not None:
            query = query.filter(ProviderProfile.is_verified == filters.is_verified)

        # Keyword text search in business name, bio, or service area
        if filters.search:
            search_term = f"%{filters.search.strip()}%"
            query = query.filter(
                or_(
                    ProviderProfile.business_name.ilike(search_term),
                    ProviderProfile.bio.ilike(search_term),
                    ProviderProfile.service_area.ilike(search_term),
                )
            )

        # Order by rating and verified status, then paginate
        return (
            query.distinct()
            .order_by(ProviderProfile.is_verified.desc(), ProviderProfile.rating_avg.desc())
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )

    # --- Provider Service Management ---
    def add_service(
        self,
        db: Session,
        *,
        provider_id: int,
        obj_in: ProviderServiceCreate,
    ) -> ProviderService:
        """Add a service listing to a provider profile."""
        service = ProviderService(
            provider_id=provider_id,
            category_id=obj_in.category_id,
            description=obj_in.description,
            price=obj_in.price,
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        return service

    def update_service(
        self,
        db: Session,
        *,
        service: ProviderService,
        obj_in: ProviderServiceUpdate,
    ) -> ProviderService:
        """Update an existing service listing."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(service, field, value)
        db.add(service)
        db.commit()
        db.refresh(service)
        return service

    def delete_service(self, db: Session, *, service_id: int, provider_id: int) -> bool:
        """Delete a service offering owned by provider."""
        service = (
            db.query(ProviderService)
            .filter(ProviderService.id == service_id, ProviderService.provider_id == provider_id)
            .first()
        )
        if service:
            db.delete(service)
            db.commit()
            return True
        return False


crud_provider = CRUDProvider(ProviderProfile)
