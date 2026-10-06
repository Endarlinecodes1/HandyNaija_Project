"""Pytest test configuration and fixtures with SQLite in-memory database."""

from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.main import app
from app.models.service import ServiceCategory

# In-memory SQLite for rapid, isolated automated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_test_categories(db: Session) -> None:
    """Seed base service categories for tests if not already present."""
    if db.query(ServiceCategory).count() == 0:
        categories = [
            ServiceCategory(
                name="Plumbing & Pipe Fitting",
                slug="plumbing",
                description="Leak repairs, borehole pumps, bathroom & kitchen installations",
                icon_url="images/icons/plumbing.svg",
            ),
            ServiceCategory(
                name="Electrical & Solar",
                slug="electrical",
                description="Inverter setups, wiring, generator repairs & appliance repairs",
                icon_url="images/icons/electrical.svg",
            ),
            ServiceCategory(
                name="Cleaning & Fumigation",
                slug="cleaning",
                description="Deep residential cleaning, office cleaning & pest control",
                icon_url="images/icons/cleaning.svg",
            ),
            ServiceCategory(
                name="Auto Mechanic & Diagnostics",
                slug="mechanic",
                description="Engine diagnostics, brake repairs, AC fix & roadside assistance",
                icon_url="images/icons/mechanic.svg",
            ),
            ServiceCategory(
                name="Carpentry & Woodwork",
                slug="carpenter",
                description="Custom furniture, kitchen cabinets, roof repairs & door fittings",
                icon_url="images/icons/carpenter.svg",
            ),
        ]
        db.add_all(categories)
        db.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all schema tables before tests run and drop after session ends."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_test_categories(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provide a transactional database session for each test function."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with injected test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
