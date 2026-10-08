"""Database engine, sessionmaker, and Base."""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

db_url = str(settings.SQLALCHEMY_DATABASE_URI)
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

class AppSession(Session):
    """Custom SQLAlchemy Session supporting direct string SQL execution in SQLAlchemy 2.0+."""
    def execute(self, statement, *args, **kwargs):
        if isinstance(statement, str):
            statement = text(statement)
        return super().execute(statement, *args, **kwargs)

SessionLocal = sessionmaker(class_=AppSession, autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

