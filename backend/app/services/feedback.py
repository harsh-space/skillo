from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.db import db
from app.models.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    RoadmapStep,
    ResourceInfo
)


def handle_feedback(req: FeedbackRequest) -> FeedbackResponse:
    """
    Applies rule-based adaptive re-ranking according to architecture.md §5.5.
    - quiz_score < 50: Inserts remedial refresher step immediately after.
    - quiz_score >= 90: Marks directly downstream easier step as skippable.
    - event == 'completed': Marks step complete and activates next step.
    """
    # 1. Log feedback event
    event_doc = {
        "learner_id": req.learner_id,
        "step_id": req.step_id,
        "event_type": req.event,
        "value": req.value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db.set_document("feedback_events", f"evt_{datetime.now(timezone.utc).timestamp()}", event_doc)

    # 2. Retrieve existing roadmap
    roadmap_doc = db.get_document("roadmaps", req.learner_id)
    if not roadmap_doc:
        return FeedbackResponse(
            learner_id=req.learner_id,
            message="No active roadmap found for learner.",
            adaptation_applied="none",
            updated_roadmap=[]
        )

    steps_raw = roadmap_doc.get("steps", [])
    steps = [RoadmapStep(**s) for s in steps_raw]
    
    target_step_idx = next((i for i, s in enumerate(steps) if s.step_id == req.step_id), None)
    if target_step_idx is None:
        return FeedbackResponse(
            learner_id=req.learner_id,
            message="Target step not found in roadmap.",
            adaptation_applied="none",
            updated_roadmap=steps
        )

    curr_step = steps[target_step_idx]
    adaptation_message = "Roadmap state updated."
    adaptation_type = "status_update"

    # RULE 1: quiz_score < 50 -> Insert Remedial Resource Step
    if req.event == "quiz_score" and req.value is not None and req.value < 50:
        adaptation_type = "remedial_insertion"
        adaptation_message = f"Quiz score of {req.value}% below threshold (50%). Remedial refresher inserted for {curr_step.skill_name}."
        
        # Check if remedial already exists
        has_remedial_next = (
            target_step_idx + 1 < len(steps) and
            steps[target_step_idx + 1].is_remedial and
            steps[target_step_idx + 1].skill_id == curr_step.skill_id
        )
        
        if not has_remedial_next:
            # Find remedial resource
            all_resources = db.list_documents("resources")
            remedial_res = next(
                (r for r in all_resources if r.get("skill_id") == curr_step.skill_id and r.get("is_remedial")),
                None
            )
            
            if remedial_res:
                res_obj = ResourceInfo(
                    resource_id=remedial_res["resource_id"],
                    title=remedial_res["title"],
                    url=remedial_res["url"],
                    type="course",
                    is_remedial=True
                )
            else:
                res_obj = ResourceInfo(
                    resource_id=f"res_{curr_step.skill_id}_remedial",
                    title=f"{curr_step.skill_name} Targeted Refresher & Fundamentals Crash Course",
                    url="https://developer.mozilla.org",
                    type="course",
                    is_remedial=True
                )

            remedial_step = RoadmapStep(
                step_id=f"step_{curr_step.step}_remedial_{curr_step.skill_id}",
                step=curr_step.step + 1,
                skill_id=curr_step.skill_id,
                skill_name=f"{curr_step.skill_name} (Refresher)",
                resource=res_obj,
                type="course",
                status="in_progress",
                explanation=f"Remedial refresher module automatically added after scoring {req.value}% on {curr_step.skill_name}.",
                is_remedial=True,
                prerequisites=curr_step.prerequisites,
                gap_score=curr_step.gap_score
            )
            
            curr_step.status = "in_progress"
            steps.insert(target_step_idx + 1, remedial_step)

    # RULE 2: quiz_score >= 90 -> Mark Downstream Step Skippable / Fast-Track
    elif req.event == "quiz_score" and req.value is not None and req.value >= 90:
        adaptation_type = "fast_track"
        curr_step.status = "completed"
        adaptation_message = f"Exceptional quiz score of {req.value}%! Marked {curr_step.skill_name} complete and fast-tracked subsequent step."
        
        # Advance next step to in_progress
        if target_step_idx + 1 < len(steps):
            if steps[target_step_idx + 1].status != "completed":
                steps[target_step_idx + 1].status = "in_progress"
        
        # Look for dependent step to mark optionally skippable
        for next_step in steps[target_step_idx + 1:]:
            if curr_step.skill_name in next_step.prerequisites:
                next_step.explanation += " (Fast-track candidate: master prerequisite scored >= 90%)"
                break

        # Update learner's mastered skills in DB profile
        learner_doc = db.get_document("learners", req.learner_id)
        if learner_doc:
            current_skills = learner_doc.get("current_skills", [])
            if curr_step.skill_name not in current_skills:
                current_skills.append(curr_step.skill_name)
                learner_doc["current_skills"] = current_skills
                learner_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
                db.set_document("learners", req.learner_id, learner_doc)

    # RULE 3: Step completed
    elif req.event == "completed" or (req.event == "quiz_score" and req.value is not None and req.value >= 50):
        adaptation_type = "step_completed"
        curr_step.status = "completed"
        adaptation_message = f"Completed {curr_step.skill_name}! Advanced to next roadmap milestone."
        
        # Advance next non-completed step
        if target_step_idx + 1 < len(steps):
            if steps[target_step_idx + 1].status != "completed":
                steps[target_step_idx + 1].status = "in_progress"

        # Update learner's mastered skills in DB profile
        learner_doc = db.get_document("learners", req.learner_id)
        if learner_doc:
            current_skills = learner_doc.get("current_skills", [])
            if curr_step.skill_name not in current_skills:
                current_skills.append(curr_step.skill_name)
                learner_doc["current_skills"] = current_skills
                learner_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
                db.set_document("learners", req.learner_id, learner_doc)

    # Re-index step numbers
    for idx, s in enumerate(steps):
        s.step = idx + 1

    # Persist updated roadmap in database
    roadmap_doc["steps"] = [s.model_dump() for s in steps]
    roadmap_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.set_document("roadmaps", req.learner_id, roadmap_doc)

    # Sync with roadmap history
    target_role_id = roadmap_doc.get("target_role_id", "role_backend_developer")
    target_role = roadmap_doc.get("target_role", "Software Engineer")
    hist_id = f"hist_{req.learner_id}_{target_role_id}"
    comp_count = sum(1 for s in steps if s.status == "completed")
    total_count = len(steps)
    pct = int((comp_count / total_count * 100)) if total_count > 0 else 0

    existing_hist = db.get_document("roadmap_history", hist_id) or {}
    history_record = {
        "history_id": hist_id,
        "learner_id": req.learner_id,
        "target_role": target_role,
        "target_role_id": target_role_id,
        "created_at": existing_hist.get("created_at", roadmap_doc["updated_at"]),
        "updated_at": roadmap_doc["updated_at"],
        "total_tasks": total_count,
        "completed_tasks": comp_count,
        "progress_percentage": pct,
        "steps": [s.model_dump() for s in steps],
        "gap_summary": roadmap_doc.get("gap_summary", {}),
        "is_active": True
    }
    db.set_document("roadmap_history", hist_id, history_record)

    return FeedbackResponse(
        learner_id=req.learner_id,
        message=adaptation_message,
        adaptation_applied=adaptation_type,
        updated_roadmap=steps
    )
