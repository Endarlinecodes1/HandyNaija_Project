"""User profile and account management API endpoints."""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import get_password_hash, verify_password
from app.crud.crud_provider import crud_provider
from app.crud.crud_user import crud_user
from app.models.user import CustomerProfile, ProviderProfile, User, UserRole
from app.schemas.user import (
    CustomerProfileResponse,
    CustomerProfileUpdate,
    UserPasswordUpdate,
    UserProfileUpdate,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve current authenticated user profile",
)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve complete profile details of the current authenticated active user."""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current authenticated user profile details",
)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: UserProfileUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update personal and role-specific profile details of the logged-in active user."""
    # 1. Update basic User fields (e.g. email) if changed
    if profile_in.email and profile_in.email != current_user.email:
        existing = crud_user.get_by_email(db, email=profile_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use by another account.",
            )
        current_user.email = profile_in.email
        db.add(current_user)

    # 2. Update Customer profile if user is a customer
    if current_user.role == UserRole.CUSTOMER:
        customer_profile = current_user.customer_profile
        if not customer_profile:
            customer_profile = CustomerProfile(
                user_id=current_user.id,
                full_name=profile_in.full_name or "Customer",
            )
            db.add(customer_profile)
            db.commit()
            db.refresh(customer_profile)

        if profile_in.full_name is not None:
            customer_profile.full_name = profile_in.full_name.strip()
        if profile_in.phone_number is not None:
            customer_profile.phone_number = profile_in.phone_number.strip()
        if profile_in.address is not None:
            customer_profile.address = profile_in.address.strip()
        db.add(customer_profile)

    # 3. Update Provider profile if user is a provider
    elif current_user.role == UserRole.PROVIDER:
        provider_profile = current_user.provider_profile
        if not provider_profile:
            provider_profile = ProviderProfile(
                user_id=current_user.id,
                business_name=profile_in.business_name or "Artisan",
                location=profile_in.location or "Lagos",
            )
            db.add(provider_profile)
            db.commit()
            db.refresh(provider_profile)

        if profile_in.business_name is not None:
            provider_profile.business_name = profile_in.business_name.strip()
        if profile_in.bio is not None:
            provider_profile.bio = profile_in.bio.strip()
        if profile_in.location is not None:
            provider_profile.location = profile_in.location.strip()
        if profile_in.service_area is not None:
            provider_profile.service_area = profile_in.service_area.strip()
        if profile_in.experience_years is not None:
            provider_profile.experience_years = profile_in.experience_years
        if profile_in.starting_price is not None:
            provider_profile.starting_price = profile_in.starting_price
        if profile_in.availability_status is not None:
            provider_profile.availability_status = profile_in.availability_status
        db.add(provider_profile)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put(
    "/me/password",
    response_model=UserResponse,
    summary="Change user account password",
)
def update_password_me(
    *,
    db: Session = Depends(deps.get_db),
    password_in: UserPasswordUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Change current user password after verifying current credentials."""
    if not verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )
    current_user.hashed_password = get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/",
    response_model=List[UserResponse],
    dependencies=[Depends(deps.get_current_active_superuser)],
    summary="List all users (Admin only)",
)
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve list of all users with pagination (Admin only)."""
    return crud_user.get_multi(db, skip=skip, limit=limit)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Retrieve user profile by ID",
)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Retrieve specific user profile by numerical ID."""
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id != current_user.id and not crud_user.is_superuser(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return user
