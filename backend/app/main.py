"""HandyNaija Backend Application Entrypoint.

FastAPI app initialization, CORS middleware, API v1 routing, and startup hooks.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models.service import ServiceCategory, ProviderService
from app.models.user import User, UserRole, ProviderProfile


def init_db() -> None:
    """Initialize database tables and seed default service categories, admin, and providers if empty."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Categories if empty
        if db.query(ServiceCategory).count() == 0:
            initial_categories = [
                {
                    "name": "Plumbing & Pipe Fitting",
                    "slug": "plumbing",
                    "icon_url": "images/icons/plumbing.svg",
                    "description": "Leak repairs, borehole pumps, bathroom & kitchen installations",
                },
                {
                    "name": "Electrical & Solar",
                    "slug": "electrical",
                    "icon_url": "images/icons/electrical.svg",
                    "description": "Inverter setups, wiring, generator repairs & appliance repairs",
                },
                {
                    "name": "Cleaning & Fumigation",
                    "slug": "cleaning",
                    "icon_url": "images/icons/cleaning.svg",
                    "description": "Deep residential cleaning, office cleaning & pest control",
                },
                {
                    "name": "Auto Mechanic & Diagnostics",
                    "slug": "mechanic",
                    "icon_url": "images/icons/mechanic.svg",
                    "description": "Engine diagnostics, brake repairs, AC fix & roadside assistance",
                },
                {
                    "name": "Carpentry & Woodwork",
                    "slug": "carpenter",
                    "icon_url": "images/icons/carpenter.svg",
                    "description": "Custom furniture, kitchen cabinets, roof repairs & door fittings",
                },
                {
                    "name": "Home Tutoring & Lessons",
                    "slug": "tutor",
                    "icon_url": "images/icons/tutor.svg",
                    "description": "WAEC/JAMB prep, primary school home tutors, coding & music",
                },
                {
                    "name": "AC & Refrigeration Tech",
                    "slug": "technician",
                    "icon_url": "images/icons/technician.svg",
                    "description": "Air conditioner servicing, gas refilling, freezer repairs",
                },
                {
                    "name": "Painting & POP Design",
                    "slug": "painter",
                    "icon_url": "images/icons/painter.svg",
                    "description": "Interior & exterior painting, screeding, POP ceiling installation",
                },
            ]
            for cat_data in initial_categories:
                category = ServiceCategory(**cat_data)
                db.add(category)
            db.commit()

        # 2. Seed Default Admin User if empty
        admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.commit()

        # 3. Seed Mock Providers if empty
        if db.query(ProviderProfile).count() == 0:
            mock_providers_data = [
                {
                    "email": "john.plumber@handynaija.ng",
                    "business_name": "John Plumbing Services",
                    "bio": "Expert residential and commercial plumbing repairs, water pump installations, and emergency leak fixes across Awka and environs.",
                    "location": "Anambra State",
                    "service_area": "Awka, Ifite, Aroma",
                    "experience_years": 8,
                    "starting_price": 5000.0,
                    "rating_avg": 4.8,
                    "review_count": 34,
                    "is_verified": True,
                    "category_slug": "plumbing",
                },
                {
                    "email": "chidi.solar@handynaija.ng",
                    "business_name": "Chidi Solar & Electricals",
                    "bio": "Certified solar energy engineer and domestic electrician. Specializes in inverter setup, panel wiring, conduit installation, and diagnostics.",
                    "location": "Lagos State",
                    "service_area": "Ikeja, Allen Avenue, GRA",
                    "experience_years": 10,
                    "starting_price": 8000.0,
                    "rating_avg": 4.9,
                    "review_count": 52,
                    "is_verified": True,
                    "category_slug": "electrical",
                },
                {
                    "email": "fatima.cleaning@handynaija.ng",
                    "business_name": "Fatima Spotless Cleaning Pros",
                    "bio": "Professional residential post-construction cleaning, office janitorial services, fumigation, and couch steam extraction.",
                    "location": "Abuja (FCT)",
                    "service_area": "Abuja, Wuse 2, Maitama",
                    "experience_years": 5,
                    "starting_price": 6000.0,
                    "rating_avg": 4.7,
                    "review_count": 29,
                    "is_verified": True,
                    "category_slug": "cleaning",
                },
                {
                    "email": "emeka.mechanic@handynaija.ng",
                    "business_name": "Emeka Auto Diagnostics & Mechanic",
                    "bio": "Automotive technician specializing in Japanese & European vehicles. Computer OBD2 scanning, brake service, suspension, and mobile repairs.",
                    "location": "Oyo State",
                    "service_area": "Ibadan, Dugbe, Ring Road",
                    "experience_years": 12,
                    "starting_price": 7500.0,
                    "rating_avg": 4.9,
                    "review_count": 47,
                    "is_verified": True,
                    "category_slug": "mechanic",
                },
                {
                    "email": "sani.carpentry@handynaija.ng",
                    "business_name": "Sani Custom Woodworks & Furniture",
                    "bio": "Custom fitted wardrobes, modern kitchen cabinets, hardwood door installations, roof truss construction, and luxury furniture restoration.",
                    "location": "Kano State",
                    "service_area": "Kano, Nassarawa, Bompai",
                    "experience_years": 7,
                    "starting_price": 10000.0,
                    "rating_avg": 4.6,
                    "review_count": 21,
                    "is_verified": False,
                    "category_slug": "carpenter",
                },
                {
                    "email": "blessing.tutor@handynaija.ng",
                    "business_name": "Blessing Home Lessons & STEM Tutor",
                    "bio": "Specialized STEM lessons, Mathematics, Physics, English diction, and exam prep for WAEC, NECO, IGCSE, and JAMB.",
                    "location": "Rivers State",
                    "service_area": "Port Harcourt, Peter Odili, GRA",
                    "experience_years": 6,
                    "starting_price": 15000.0,
                    "rating_avg": 5.0,
                    "review_count": 18,
                    "is_verified": True,
                    "category_slug": "tutor",
                },
                {
                    "email": "koolbreeze.ac@handynaija.ng",
                    "business_name": "Kool Breeze AC & Cooling",
                    "bio": "Inverter AC installations, gas charging, industrial refrigerator repairs, and preventive servicing for homes & offices.",
                    "location": "Lagos State",
                    "service_area": "Lagos, Lekki Phase 1, Ikate",
                    "experience_years": 9,
                    "starting_price": 8500.0,
                    "rating_avg": 4.8,
                    "review_count": 38,
                    "is_verified": True,
                    "category_slug": "technician",
                },
                {
                    "email": "segun.painting@handynaija.ng",
                    "business_name": "Segun Deluxe Painting & POP",
                    "bio": "Modern interior wall finishing, washable paint applications, 3D wall panels, POP ceiling casting, and exterior coatings.",
                    "location": "Oyo State",
                    "service_area": "Ibadan, Bodija, Ring Road",
                    "experience_years": 4,
                    "starting_price": 6500.0,
                    "rating_avg": 4.5,
                    "review_count": 14,
                    "is_verified": False,
                    "category_slug": "painter",
                },
            ]

            for p_data in mock_providers_data:
                category = db.query(ServiceCategory).filter(ServiceCategory.slug == p_data["category_slug"]).first()
                user = User(
                    email=p_data["email"],
                    hashed_password=get_password_hash("ProviderPass123!"),
                    role=UserRole.PROVIDER,
                    is_active=True,
                    is_verified=p_data["is_verified"],
                )
                db.add(user)
                db.flush()

                profile = ProviderProfile(
                    user_id=user.id,
                    business_name=p_data["business_name"],
                    bio=p_data["bio"],
                    location=p_data["location"],
                    service_area=p_data["service_area"],
                    experience_years=p_data["experience_years"],
                    starting_price=p_data["starting_price"],
                    rating_avg=p_data["rating_avg"],
                    review_count=p_data["review_count"],
                    is_verified=p_data["is_verified"],
                    availability_status=True,
                )
                db.add(profile)
                db.flush()

                if category:
                    prov_service = ProviderService(
                        provider_id=profile.id,
                        category_id=category.id,
                        description=p_data["bio"][:200],
                        price=p_data["starting_price"],
                    )
                    db.add(prov_service)

            db.commit()

    except Exception as e:
        print(f"Warning during DB init/seeding: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager handling startup and shutdown events."""
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database auto-init skipped: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="Local Service Marketplace Backend API for HandyNaija platform (Nigeria).",
    lifespan=lifespan,
)

# Open CORS configuration allowing requests from any web browser origin or port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 central router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["health"], summary="Root API health check and status")
def root():
    """Root endpoint returning API status and interactive documentation links."""
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "redoc_url": f"{settings.API_V1_STR}/redoc",
    }


@app.get("/health", tags=["health"], summary="Liveness probe")
def health_check():
    """Health check probe for container orchestrators and load balancers."""
    return {"status": "healthy"}
