from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List
from app.models.schemas import (
    RecommendRequest,
    RoadmapResponse,
    RoadmapStep,
    GapSummary,
    RoadmapHistoryItem,
    ActivateHistoryRequest
)
from app.services.db import db
from app.services.gap_analysis import run_gap_analysis
from app.services.path_generator import generate_learning_path
from app.services.xai import _template_grounded_explanation

router = APIRouter(tags=["Recommendation"])


@router.post("/recommend", response_model=RoadmapResponse)
def generate_recommendation(req: RecommendRequest):
    # 1. Load learner profile
    learner_doc = db.get_document("learners", req.learner_id)
    if not learner_doc:
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

    # If not force_regenerate, return the persisted roadmap ONLY if it matches the current target role
    if not getattr(req, 'force_regenerate', False):
        existing = db.get_document("roadmaps", req.learner_id)
        if (
            existing
            and existing.get("steps")
            and existing.get("target_role_id") == target_role_id
        ):
            try:
                steps = [RoadmapStep(**s) for s in existing["steps"]]
                gap_raw = existing.get("gap_summary", {})
                gap = GapSummary(**gap_raw) if gap_raw else GapSummary(missing_skills=[], matched_skills=[])
                return RoadmapResponse(
                    learner_id=req.learner_id,
                    target_role=existing.get("target_role", "Software Engineer"),
                    target_role_id=existing.get("target_role_id", target_role_id),
                    roadmap=steps,
                    gap_summary=gap,
                    updated_at=existing.get("updated_at", datetime.now(timezone.utc).isoformat())
                )
            except Exception:
                pass  # Fall through to regeneration on schema mismatch

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
        step.explanation = _template_grounded_explanation(step, role_name, raw_steps)

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

    # 7. Also record in roadmap history
    hist_id = f"hist_{req.learner_id}_{target_role_id}"
    existing_hist = db.get_document("roadmap_history", hist_id)
    created_at = existing_hist.get("created_at") if existing_hist else now_iso
    comp_count = sum(1 for s in raw_steps if s.status == "completed")
    total_count = len(raw_steps)
    pct = int((comp_count / total_count * 100)) if total_count > 0 else 0

    history_record = {
        "history_id": hist_id,
        "learner_id": req.learner_id,
        "target_role": role_name,
        "target_role_id": target_role_id,
        "created_at": created_at,
        "updated_at": now_iso,
        "total_tasks": total_count,
        "completed_tasks": comp_count,
        "progress_percentage": pct,
        "steps": [s.model_dump() for s in raw_steps],
        "gap_summary": gap_summary.model_dump(),
        "is_active": True
    }
    db.set_document("roadmap_history", hist_id, history_record)

    return RoadmapResponse(
        learner_id=req.learner_id,
        target_role=role_name,
        target_role_id=target_role_id,
        roadmap=raw_steps,
        gap_summary=gap_summary,
        updated_at=now_iso
    )


@router.get("/roadmap/{learner_id}", response_model=RoadmapResponse)
def get_learner_roadmap(learner_id: str, regenerate: bool = False):
    if regenerate:
        return generate_recommendation(RecommendRequest(learner_id=learner_id))

    doc = db.get_document("roadmaps", learner_id)
    if not doc:
        # Generate automatically if not exists
        return generate_recommendation(RecommendRequest(learner_id=learner_id))

    return RoadmapResponse(**doc)


@router.get("/history/{learner_id}", response_model=List[RoadmapHistoryItem])
def get_learner_history(learner_id: str):
    """Retrieves all past and active roadmap sessions for this learner."""
    all_hist = db.query_documents("roadmap_history", "learner_id", learner_id)
    
    active_rm = db.get_document("roadmaps", learner_id)
    active_role_id = active_rm.get("target_role_id") if active_rm else None

    # Fallback: if history empty but active roadmap exists, seed history item
    if not all_hist and active_rm and active_rm.get("steps"):
        steps_list = active_rm.get("steps", [])
        comp_count = sum(1 for s in steps_list if s.get("status") == "completed")
        total_count = len(steps_list)
        pct = int((comp_count / total_count * 100)) if total_count > 0 else 0
        hist_id = f"hist_{learner_id}_{active_rm.get('target_role_id', 'default')}"
        
        seeded_hist = {
            "history_id": hist_id,
            "learner_id": learner_id,
            "target_role": active_rm.get("target_role", "Software Engineer"),
            "target_role_id": active_rm.get("target_role_id", "role_backend_developer"),
            "created_at": active_rm.get("updated_at", datetime.now(timezone.utc).isoformat()),
            "updated_at": active_rm.get("updated_at", datetime.now(timezone.utc).isoformat()),
            "total_tasks": total_count,
            "completed_tasks": comp_count,
            "progress_percentage": pct,
            "steps": steps_list,
            "is_active": True
        }
        db.set_document("roadmap_history", hist_id, seeded_hist)
        all_hist = [seeded_hist]

    # Convert to schema items and mark active
    result: List[RoadmapHistoryItem] = []
    for h in all_hist:
        try:
            steps = [RoadmapStep(**s) for s in h.get("steps", [])]
            comp_count = sum(1 for s in steps if s.status == "completed")
            total_count = len(steps)
            pct = int((comp_count / total_count * 100)) if total_count > 0 else 0
            is_active = (h.get("target_role_id") == active_role_id)

            result.append(RoadmapHistoryItem(
                history_id=h.get("history_id", f"hist_{h.get('target_role_id')}"),
                learner_id=learner_id,
                target_role=h.get("target_role", "Target Role"),
                target_role_id=h.get("target_role_id", "role_backend_developer"),
                created_at=h.get("created_at", datetime.now(timezone.utc).isoformat()),
                updated_at=h.get("updated_at", datetime.now(timezone.utc).isoformat()),
                total_tasks=total_count,
                completed_tasks=comp_count,
                progress_percentage=pct,
                steps=steps,
                is_active=is_active
            ))
        except Exception:
            continue

    # Sort descending by updated_at
    result.sort(key=lambda x: x.updated_at, reverse=True)
    return result


@router.post("/history/activate", response_model=RoadmapResponse)
def activate_history_roadmap(req: ActivateHistoryRequest):
    """Switches the learner's active roadmap to a selected historical roadmap."""
    hist_doc = db.get_document("roadmap_history", req.history_id)
    if not hist_doc or hist_doc.get("learner_id") != req.learner_id:
        raise HTTPException(status_code=404, detail="Roadmap history record not found.")

    target_role = hist_doc.get("target_role", "Software Engineer")
    target_role_id = hist_doc.get("target_role_id", "role_backend_developer")
    steps = [RoadmapStep(**s) for s in hist_doc.get("steps", [])]
    gap_raw = hist_doc.get("gap_summary", {})
    gap = GapSummary(**gap_raw) if gap_raw else GapSummary(missing_skills=[], matched_skills=[])
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Update active roadmap
    roadmap_record = {
        "learner_id": req.learner_id,
        "target_role": target_role,
        "target_role_id": target_role_id,
        "steps": [s.model_dump() for s in steps],
        "gap_summary": gap.model_dump(),
        "updated_at": now_iso
    }
    db.set_document("roadmaps", req.learner_id, roadmap_record)

    # 2. Update learner profile target_role_id
    learner_doc = db.get_document("learners", req.learner_id)
    if learner_doc:
        learner_doc["target_role_id"] = target_role_id
        learner_doc["updated_at"] = now_iso
        db.set_document("learners", req.learner_id, learner_doc)

    return RoadmapResponse(
        learner_id=req.learner_id,
        target_role=target_role,
        target_role_id=target_role_id,
        roadmap=steps,
        gap_summary=gap,
        updated_at=now_iso
    )


@router.delete("/history/{learner_id}/{history_id}")
def delete_history_item(learner_id: str, history_id: str):
    """Deletes an archived roadmap from history."""
    hist_doc = db.get_document("roadmap_history", history_id)
    if hist_doc and hist_doc.get("learner_id") == learner_id:
        db.delete_document("roadmap_history", history_id)
        return {"status": "success", "message": "History item removed."}
    raise HTTPException(status_code=404, detail="History item not found.")

