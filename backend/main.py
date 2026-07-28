from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import engine, Base, SessionLocal
from app.db.init_db import init_db
from app.api.v1.api import api_router

logger = setup_logging()

# Create tables automatically for SQLite/Dev
Base.metadata.create_all(bind=engine)

# Seed initial admin & demo accounts
db = SessionLocal()
try:
    init_db(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.middleware.gzip import GZipMiddleware

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins() if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable Gzip Compression for low-bandwidth network payload optimization
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
