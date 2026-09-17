from typing import Optional
from fastapi import APIRouter, Header
from app.models.schemas import ExplanationResponse
from app.services.xai import explain_step
from app.api.auth import verify_learner_ownership

router = APIRouter(prefix="/explain", tags=["Explainability"])


@router.get("/{learner_id}/{step_id}", response_model=ExplanationResponse)
async def get_step_explanation(learner_id: str, step_id: str, authorization: Optional[str] = Header(None)):
    verify_learner_ownership(learner_id, authorization)
    return await explain_step(learner_id, step_id)
