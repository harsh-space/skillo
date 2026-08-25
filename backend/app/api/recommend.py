from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models.schemas import RecommendRequest, RoadmapResponse
from app.services.db import db
from app.services.gap_analysis import run_gap_analysis
from app.services.path_generator import generate_learning_path
from app.services.xai import generate_grounded_explanation

router = APIRouter(tags=["Recommendation"])


@router.post("/recommend", response_model=RoadmapResponse)
def generate_recommendation(req: RecommendRequest):
    # 1. Load learner profile
    learner_doc = db.get_document("learners", req.learner_id)
    if not learner_doc:
        # Default profile if not created yet
        learner_doc = {
            "learner_id": req.learner_id,
            "name": "Learner",
            "current_skills": [],
            "target_role_id": "role_backend_developer",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db.set_document("learners", req.learner_id, learner_doc)

    target_role_id = learner_doc.get("target_role_id") or "role_backend_developer"
    current_skills = learner_doc.get("current_skills", [])

    # 2. Retrieve role metadata
    role_doc = db.get_document("roles", target_role_id)
    if not role_doc:
        roles = db.list_documents("roles")
        role_doc = roles[0] if roles else {"name": "Software Engineer", "role_id": "role_backend_developer"}
        target_role_id = role_doc.get("role_id", "role_backend_developer")

    role_name = role_doc.get("name", "Software Engineer")

    # 3. Skill Gap Analysis
    gap_summary = run_gap_analysis(current_skills, target_role_id)
    gap_scores = {d.name: d.similarity_score for d in gap_summary.details}
    gap_scores.update({d.skill_id: d.similarity_score for d in gap_summary.details})

    # 4. Path Generation (DAG topological sort with prerequisite closure)
    raw_steps = generate_learning_path(
        missing_skill_ids=gap_summary.missing_skills,
        current_skill_ids=current_skills,
        gap_scores=gap_scores
    )

    # 5. Attach grounded explanations
    for step in raw_steps:
        step.explanation = generate_grounded_explanation(step, role_name, raw_steps)

    now_iso = datetime.now(timezone.utc).isoformat()

    # 6. Save roadmap in database
    roadmap_record = {
        "learner_id": req.learner_id,
        "target_role": role_name,
        "target_role_id": target_role_id,
        "steps": [s.model_dump() for s in raw_steps],
        "gap_summary": gap_summary.model_dump(),
        "updated_at": now_iso
    }
    db.set_document("roadmaps", req.learner_id, roadmap_record)

    return RoadmapResponse(
        learner_id=req.learner_id,
        target_role=role_name,
        target_role_id=target_role_id,
        roadmap=raw_steps,
        gap_summary=gap_summary,
        updated_at=now_iso
    )


@router.get("/roadmap/{learner_id}", response_model=RoadmapResponse)
def get_learner_roadmap(learner_id: str):
    doc = db.get_document("roadmaps", learner_id)
    if not doc:
        # Generate automatically if not exists
        return generate_recommendation(RecommendRequest(learner_id=learner_id))

    return RoadmapResponse(**doc)
