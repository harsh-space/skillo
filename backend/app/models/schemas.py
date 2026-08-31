from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LearnerProfileCreate(BaseModel):
    learner_id: str
    name: Optional[str] = "Learner"
    current_skills: List[str] = Field(default_factory=list)
    target_role_id: Optional[str] = None


class LearnerProfileResponse(BaseModel):
    learner_id: str
    name: str
    current_skills: List[str]
    target_role_id: Optional[str] = None
    created_at: str
    updated_at: str


class GoalParseRequest(BaseModel):
    learner_id: Optional[str] = None
    goal_text: str


class GoalParseResponse(BaseModel):
    target_role: str
    target_role_id: str
    target_skills: List[str]
    parsed_intent: Optional[str] = None


class ResourceInfo(BaseModel):
    resource_id: str
    title: str
    url: str
    type: str = "course"  # course | project | assessment
    is_remedial: bool = False


class RoadmapStep(BaseModel):
    step_id: str
    step: int
    skill_id: str
    skill_name: str
    resource: ResourceInfo
    type: str = "course"
    status: str = "not_started"  # not_started | in_progress | completed | skippable
    explanation: str = ""
    is_remedial: bool = False
    prerequisites: List[str] = Field(default_factory=list)
    gap_score: float = 0.0


class GapSkillDetail(BaseModel):
    skill_id: str
    name: str
    similarity_score: float
    status: str  # missing | matched
    closest_matched_skill: Optional[str] = None


class GapSummary(BaseModel):
    missing_skills: List[str]
    matched_skills: List[str]
    details: List[GapSkillDetail] = Field(default_factory=list)


class RecommendRequest(BaseModel):
    learner_id: str
    force_regenerate: bool = False


class RoadmapResponse(BaseModel):
    learner_id: str
    target_role: str
    target_role_id: str
    roadmap: List[RoadmapStep]
    gap_summary: GapSummary
    updated_at: str


class FeedbackRequest(BaseModel):
    learner_id: str
    step_id: str
    event: str  # "quiz_score" | "completed" | "skipped"
    value: Optional[float] = None  # e.g., 40.0 for a quiz score


class FeedbackResponse(BaseModel):
    learner_id: str
    message: str
    adaptation_applied: str
    updated_roadmap: List[RoadmapStep]
    gap_summary: Optional[GapSummary] = None


class ExplanationResponse(BaseModel):
    learner_id: str
    step_id: str
    skill_name: str
    explanation: str
    grounded_facts: Dict[str, Any]


class UserSignupRequest(BaseModel):
    name: str
    email: str
    password: str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    learner_id: str
    token: str


class RoadmapHistoryItem(BaseModel):
    history_id: str
    learner_id: str
    target_role: str
    target_role_id: str
    created_at: str
    updated_at: str
    total_tasks: int
    completed_tasks: int
    progress_percentage: int
    steps: List[RoadmapStep]
    is_active: bool = False


class ActivateHistoryRequest(BaseModel):
    learner_id: str
    history_id: str
