from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models.schemas import LearnerProfileCreate, LearnerProfileResponse
from app.services.db import db

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("", response_model=LearnerProfileResponse)
def create_or_update_profile(profile_in: LearnerProfileCreate):
    existing = db.get_document("learners", profile_in.learner_id)
    now = datetime.now(timezone.utc).isoformat()
    
    doc_data = {
        "learner_id": profile_in.learner_id,
        "name": profile_in.name or "Learner",
        "current_skills": profile_in.current_skills,
        "target_role_id": profile_in.target_role_id,
        "created_at": existing.get("created_at", now) if existing else now,
        "updated_at": now
    }
    
    db.set_document("learners", profile_in.learner_id, doc_data)
    return LearnerProfileResponse(**doc_data)


@router.get("/{learner_id}", response_model=LearnerProfileResponse)
def get_profile(learner_id: str):
    doc = db.get_document("learners", learner_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Learner profile not found.")
    return LearnerProfileResponse(**doc)
