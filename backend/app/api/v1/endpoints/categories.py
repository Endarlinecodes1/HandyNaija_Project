"""Service Categories API endpoints."""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.service import ServiceCategory
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryResponse,
    ServiceCategoryUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[ServiceCategoryResponse])
def read_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve all service categories."""
    return (
        db.query(ServiceCategory)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{category_id_or_slug}", response_model=ServiceCategoryResponse)
def get_category(
    category_id_or_slug: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Retrieve service category by numerical ID or slug."""
    if category_id_or_slug.isdigit():
        cat = db.query(ServiceCategory).filter(ServiceCategory.id == int(category_id_or_slug)).first()
    else:
        cat = db.query(ServiceCategory).filter(ServiceCategory.slug == category_id_or_slug).first()

    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )
    return cat


@router.post("/", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(deps.get_current_active_superuser)])
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: ServiceCategoryCreate,
) -> Any:
    """Create a new service category (Admin only)."""
    existing = db.query(ServiceCategory).filter(
        (ServiceCategory.name.ilike(category_in.name)) | (ServiceCategory.slug == category_in.slug)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name or slug already exists.",
        )
    category = ServiceCategory(**category_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=ServiceCategoryResponse, dependencies=[Depends(deps.get_current_active_superuser)])
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
    category_in: ServiceCategoryUpdate,
) -> Any:
    """Update service category information (Admin only)."""
    cat = db.query(ServiceCategory).get(category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    for field, value in category_in.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
