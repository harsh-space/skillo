from fastapi import APIRouter
from app.models.schemas import GoalParseRequest, GoalParseResponse
from app.services.goal_parser import parse_goal
from app.services.db import db

router = APIRouter(prefix="/goal", tags=["Goal"])


@router.post("", response_model=GoalParseResponse)
async def parse_learning_goal(req: GoalParseRequest):
    parsed = await parse_goal(req.goal_text)
    
    # If learner_id provided, attach target role to learner profile
    if req.learner_id:
        learner_doc = db.get_document("learners", req.learner_id)
        if learner_doc:
            learner_doc["target_role_id"] = parsed.target_role_id
            db.set_document("learners", req.learner_id, learner_doc)

    return parsed
