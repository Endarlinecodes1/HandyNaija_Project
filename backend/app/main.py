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
from app.models.service import ServiceCategory


def init_db() -> None:
    """Initialize database tables and seed default service categories if empty."""
    # Create all tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Seed initial categories
    db = SessionLocal()
    try:
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
    except Exception:
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager handling startup and shutdown events."""
    # Startup: Ensure database tables are created & seeded
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database auto-init skipped (e.g. if DB not connected): {e}")
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="Local Service Marketplace Backend API for HandyNaija platform (Nigeria).",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
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
