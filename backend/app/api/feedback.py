from fastapi import APIRouter
from app.models.schemas import FeedbackRequest, FeedbackResponse
from app.services.feedback import handle_feedback

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse)
def submit_feedback(req: FeedbackRequest):
    return handle_feedback(req)
