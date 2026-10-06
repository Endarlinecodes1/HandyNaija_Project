"""CRUD operations for User and CustomerProfile entities."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import CustomerProfile, User, UserRole
from app.schemas.user import (
    CustomerProfileCreate,
    CustomerProfileUpdate,
    UserCreate,
    UserRegisterCustomer,
    UserUpdate,
)


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """User and CustomerProfile database operations."""

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Fetch user by case-insensitive email address."""
        return db.query(User).filter(User.email.ilike(email.strip())).first()

    def create_user(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create a new user with hashed password."""
        db_obj = User(
            email=obj_in.email.lower().strip(),
            hashed_password=get_password_hash(obj_in.password),
            role=obj_in.role,
            is_active=True,
            is_verified=False,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def register_customer(self, db: Session, *, obj_in: UserRegisterCustomer) -> User:
        """Atomic customer user account and profile registration."""
        user = User(
            email=obj_in.email.lower().strip(),
            hashed_password=get_password_hash(obj_in.password),
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,  # Customer accounts active immediately
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = CustomerProfile(
            user_id=user.id,
            full_name=obj_in.full_name.strip(),
            phone_number=obj_in.phone_number.strip() if obj_in.phone_number else None,
            address=obj_in.address.strip() if obj_in.address else None,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
        return user

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        """Verify user credentials."""
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """Check if user account is active."""
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        """Check if user is administrator."""
        return user.role == UserRole.ADMIN

    def get_customer_profile(self, db: Session, *, user_id: int) -> Optional[CustomerProfile]:
        """Fetch customer profile for a given user ID."""
        return db.query(CustomerProfile).filter(CustomerProfile.user_id == user_id).first()

    def update_customer_profile(
        self,
        db: Session,
        *,
        profile: CustomerProfile,
        obj_in: CustomerProfileUpdate,
    ) -> CustomerProfile:
        """Update customer personal details."""
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile


crud_user = CRUDUser(User)
