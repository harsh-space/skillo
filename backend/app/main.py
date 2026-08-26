import os
from dotenv import load_dotenv

# Load .env from repo root (two levels up from backend/app/)
_env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=_env_path, override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import profile, goal, recommend, feedback, explain, taxonomy
from app.services.db import db
from app.services.gap_analysis import get_embedding_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database is seeded with initial taxonomy
    skills = db.list_documents("skills")
    if not skills:
        print("[Startup] Seeding database taxonomy...")
        try:
            from scripts.seed_db import seed_database
            seed_database()
        except Exception as e:
            print(f"[Startup Warning] Seed script invocation failed: {e}")
    # Warm up embedding model in background
    try:
        get_embedding_model()
    except Exception:
        pass
    yield


app = FastAPI(
    title="AI-Powered Personalized Learning Path Recommender API",
    description="Backend service for HCLTech AMPlified Hackathon Pathfinder Prototype",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(profile.router, prefix=API_PREFIX)
app.include_router(goal.router, prefix=API_PREFIX)
app.include_router(recommend.router, prefix=API_PREFIX)
app.include_router(feedback.router, prefix=API_PREFIX)
app.include_router(explain.router, prefix=API_PREFIX)
app.include_router(taxonomy.router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Personalized Learning Path Recommender",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
