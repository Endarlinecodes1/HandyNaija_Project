"""Central API v1 router combining domain endpoint routers."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    auth,
    categories,
    messages,
    providers,
    requests,
    reviews,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(requests.router, prefix="/requests", tags=["requests"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
