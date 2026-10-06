# HandyNaija Backend — Local Service Marketplace MVP

HandyNaija is a scalable, domain-driven RESTful API backend built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy 2.0**. It powers the HandyNaija local service marketplace connecting Nigerian households and businesses with verified local artisans (plumbers, electricians, mechanics, carpenters, cleaners, and more).

---

## 🏗️ Architecture & Project Structure

```text
HandyNaija/
├── backend/                         # FastAPI Python Backend
│   ├── alembic/                     # Database migrations directory
│   │   ├── versions/                # Migration revision scripts
│   │   ├── env.py                   # Alembic environment runner
│   │   └── script.py.mako           # Revision template
│   ├── app/                         # Main application package
│   │   ├── api/                     # API router & dependencies
│   │   │   ├── deps.py              # Reusable FastAPI dependencies (DB, Auth, Current User)
│   │   │   └── v1/
│   │   │       ├── api.py           # Central API v1 router combining all endpoints
│   │   │       └── endpoints/
│   │   │           ├── auth.py      # Register (Customer/Provider), login, JWT tokens
│   │   │           ├── users.py     # Customer and admin user management
│   │   │           ├── providers.py # Artisan profiles, search, filter, NIN verification
│   │   │           ├── categories.py# Service categories (Plumbing, Electrical, etc.)
│   │   │           ├── requests.py  # Service request lifecycle & status updates
│   │   │           ├── messages.py  # In-app direct messaging for job requests
│   │   │           ├── reviews.py   # Ratings & reviews management
│   │   │           └── admin.py     # Admin verification approvals & dashboard metrics
│   │   ├── core/                    # Foundational configs & security
│   │   │   ├── config.py            # Pydantic BaseSettings for environment variables
│   │   │   ├── database.py          # SQLAlchemy engine, SessionLocal, and Base model
│   │   │   └── security.py          # Bcrypt password hashing & JWT token handling
│   │   ├── crud/                    # Decoupled database CRUD operations
│   │   │   ├── base.py              # Generic CRUDBase repository
│   │   │   ├── crud_user.py         # User and Customer profile queries
│   │   │   ├── crud_provider.py     # Provider registration and search queries
│   │   │   ├── crud_request.py      # Service request operations & status history
│   │   │   └── crud_review.py       # Rating aggregation and review operations
│   │   ├── models/                  # SQLAlchemy ORM database models
│   │   │   ├── user.py              # User, CustomerProfile, ProviderProfile
│   │   │   ├── service.py           # ServiceCategory, ProviderService
│   │   │   ├── request.py           # ServiceRequest, RequestStatusHistory
│   │   │   ├── message.py           # Message
│   │   │   └── review.py            # Review, VerificationRecord
│   │   ├── schemas/                 # Pydantic validation & response schemas
│   │   │   ├── token.py             # JWT token payload schemas
│   │   │   ├── user.py              # User and Customer schemas
│   │   │   ├── provider.py          # Provider profile and search filter schemas
│   │   │   ├── service.py           # Category and service listing schemas
│   │   │   ├── request.py           # Service request submission and status schemas
│   │   │   ├── message.py           # Chat message schemas
│   │   │   └── review.py            # Rating, review, and KYC verification schemas
│   │   ├── services/                # Business logic and external integration layer
│   │   │   ├── notification.py      # SMS, Email & In-App alert handlers
│   │   │   └── verification.py      # Nigerian NIN format & KYC validation
│   │   └── main.py                  # FastAPI app entrypoint, CORS, startup seeders
│   ├── tests/                       # Automated test suite (pytest)
│   │   ├── conftest.py              # Test fixtures & in-memory test DB
│   │   ├── test_auth.py             # Authentication and registration tests
│   │   ├── test_providers.py        # Provider search and profile tests
│   │   └── test_requests.py         # Service request workflow tests
│   ├── .env.example                 # Environment variables template
│   ├── alembic.ini                  # Alembic database configuration
│   ├── Dockerfile                   # Production-ready Python 3.11 container
│   └── requirements.txt             # Python dependencies
├── frontend/                        # Frontend UI assets and pages
├── docker-compose.yml               # Multi-container orchestration (FastAPI + PostgreSQL)
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **PostgreSQL 14+** (or Docker)

### 2. Environment Setup
Create a virtual environment and activate it:
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` inside `backend/` and fill in your database credentials:
```bash
cp .env.example .env
```

Key environment variables:
```dotenv
PROJECT_NAME="HandyNaija API"
API_V1_STR="/api/v1"
POSTGRES_SERVER="localhost"
POSTGRES_PORT=5432
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your_password"
POSTGRES_DB="handynaija_mvp"
SECRET_KEY="your_secure_secret_key"
ACCESS_TOKEN_EXPIRE_MINUTES=11520
```

---

## 🗄️ Database Setup & Alembic Migrations

From the `backend/` directory:
```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema setup"

# Apply migrations to PostgreSQL database
alembic upgrade head
```

---

## 🏃 Running the Development Server

From the `backend/` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be accessible at:
- **API Base:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/api/v1/docs`
- **ReDoc Documentation:** `http://localhost:8000/api/v1/redoc`
- **Health Check:** `http://localhost:8000/health`

---

## 🐳 Running with Docker Compose

To spin up both PostgreSQL and the FastAPI application in Docker:
```bash
docker-compose up --build -d
```

To stop containers:
```bash
docker-compose down
```

---

## 🧪 Running Automated Tests

Run the test suite using `pytest`:
```bash
pytest -v
```

---

## 🔑 Key API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/customer` | Register a new customer | No |
| `POST` | `/api/v1/auth/register/provider` | Register a new artisan provider | No |
| `POST` | `/api/v1/auth/login` | Login with email & password | No |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile | Yes (Bearer) |
| `GET` | `/api/v1/categories/` | List service categories with provider counts | No |
| `GET` | `/api/v1/providers/` | Search & filter artisans by state, city, rating | No |
| `GET` | `/api/v1/providers/{id}` | Artisan public profile, portfolio & reviews | No |
| `POST` | `/api/v1/providers/me/verification` | Submit NIN & credentials for verification | Yes (Provider) |
| `POST` | `/api/v1/requests/` | Submit a new service request | Yes (Customer) |
| `GET` | `/api/v1/requests/customer/me` | List requests submitted by logged-in customer | Yes (Customer) |
| `GET` | `/api/v1/requests/provider/me` | List requests assigned to logged-in artisan | Yes (Provider) |
| `PATCH` | `/api/v1/requests/{id}/status` | Accept, in-progress, complete, or cancel request | Yes (Customer/Provider) |
| `GET` | `/api/v1/messages/request/{id}` | Get chat messages for a service request | Yes (Participant) |
| `POST` | `/api/v1/messages/` | Send message in request chat | Yes (Participant) |
| `POST` | `/api/v1/reviews/` | Submit rating & review for completed job | Yes (Customer) |
| `GET` | `/api/v1/admin/dashboard-stats` | Aggregated platform metrics | Yes (Admin) |
| `POST` | `/api/v1/admin/verifications/{id}/action` | Approve or reject artisan verification | Yes (Admin) |

---

## 🛡️ Authentication & Authorization Rules
- **Customers (`customer`):** Submit service requests, view request status, chat with assigned artisans, leave ratings.
- **Providers (`provider`):** Manage portfolio & hourly rates, receive job requests, accept/update job statuses, reply to customer reviews, submit NIN verification.
- **Admins (`admin`):** Review & approve KYC/NIN verifications, activate/deactivate users, manage platform categories, monitor platform dashboard metrics.
