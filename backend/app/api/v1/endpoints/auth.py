"""Authentication and Registration API endpoints."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import create_access_token
from app.crud.crud_provider import crud_provider
from app.crud.crud_user import crud_user
from app.models.user import User, UserRole
from app.schemas.provider import ProviderProfileResponse, ProviderRegisterRequest
from app.schemas.token import Token
from app.schemas.user import (
    LoginRequest,
    UserRegisterCustomer,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unified user registration (Customer or Service Provider)",
)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserRegisterRequest,
) -> Any:
    """Register a new user account as either a Customer or a Service Provider with a hashed password."""
    # Check if user already exists
    existing_user = crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Branch registration logic based on requested role
    if user_in.role == UserRole.PROVIDER:
        provider_in = ProviderRegisterRequest(
            full_name=user_in.full_name or "Service Provider",
            email=user_in.email,
            password=user_in.password,
            phone_number=user_in.phone_number or "",
            business_name=user_in.business_name or user_in.full_name or "Handy Provider",
            bio=user_in.bio,
            location=user_in.location or "Lagos",
            service_area=user_in.service_area,
            experience_years=user_in.experience_years or 1,
            starting_price=user_in.starting_price or 0.0,
            category_id=user_in.category_id,
        )
        provider_profile = crud_provider.register_provider(db, obj_in=provider_in)
        return provider_profile.user
    else:
        # Default customer registration
        customer_in = UserRegisterCustomer(
            full_name=user_in.full_name or "Customer",
            email=user_in.email,
            password=user_in.password,
            phone_number=user_in.phone_number,
            address=user_in.address,
        )
        user = crud_user.register_customer(db, obj_in=customer_in)
        return user


@router.post(
    "/register/customer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a customer account",
)
def register_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_in: UserRegisterCustomer,
) -> Any:
    """Register a new customer account with profile details."""
    existing_user = crud_user.get_by_email(db, email=customer_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    return crud_user.register_customer(db, obj_in=customer_in)


@router.post(
    "/register/provider",
    response_model=ProviderProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a service provider account",
)
def register_provider(
    *,
    db: Session = Depends(deps.get_db),
    provider_in: ProviderRegisterRequest,
) -> Any:
    """Register a new artisan/service provider profile."""
    existing_user = crud_user.get_by_email(db, email=provider_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    return crud_provider.register_provider(db, obj_in=provider_in)


@router.post(
    "/login",
    response_model=Token,
    summary="OAuth2 and JSON compatible login endpoint returning JWT access token",
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Authenticate user with email and password, returning a signed JWT access token."""
    user = crud_user.authenticate(
        db, email=login_data.email, password=login_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )
    elif not crud_user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    return {
        "access_token": create_access_token(subject=user.id, role=user.role.value),
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
    }


@router.post(
    "/login/access-token",
    response_model=Token,
    summary="OAuth2 form-data compatible login endpoint",
)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 standard form-data login endpoint for Swagger UI & API clients."""
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )
    elif not crud_user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    return {
        "access_token": create_access_token(subject=user.id, role=user.role.value),
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
    }
