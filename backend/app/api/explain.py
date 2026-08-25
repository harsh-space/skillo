from fastapi import APIRouter
from app.models.schemas import ExplanationResponse
from app.services.xai import explain_step

router = APIRouter(prefix="/explain", tags=["Explainability"])


@router.get("/{learner_id}/{step_id}", response_model=ExplanationResponse)
async def get_step_explanation(learner_id: str, step_id: str):
    return await explain_step(learner_id, step_id)
