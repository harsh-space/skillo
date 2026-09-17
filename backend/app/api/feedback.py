from typing import Optional
from fastapi import APIRouter, Header
from app.models.schemas import FeedbackRequest, FeedbackResponse
from app.services.feedback import handle_feedback
from app.api.auth import verify_learner_ownership

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse)
def submit_feedback(req: FeedbackRequest, authorization: Optional[str] = Header(None)):
    verify_learner_ownership(req.learner_id, authorization)
    return handle_feedback(req)
