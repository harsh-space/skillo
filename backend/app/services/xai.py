import os
import json
from typing import Dict, Any, List
import httpx
from app.services.db import db
from app.models.schemas import RoadmapStep, ExplanationResponse


def generate_grounded_explanation(
    step: RoadmapStep,
    target_role_name: str,
    all_steps: List[RoadmapStep]
) -> str:
    """
    Generates a fact-grounded explanation based on prerequisite DAG edges,
    target career role, and gap similarity score.
    """
    # 1. Upstream prerequisites in the path
    step_index = step.step - 1
    upstream_in_path = [s.skill_name for s in all_steps[:step_index]]
    relevant_prereqs = [p for p in step.prerequisites if p in upstream_in_path]
    
    # 2. Downstream dependents in the path
    downstream_in_path = [s for s in all_steps[step_index + 1:] if step.skill_name in s.prerequisites]
    downstream_names = [d.skill_name for d in downstream_in_path]

    # 3. Grounded rationale synthesis
    if step.is_remedial:
        return (
            f"Remedial milestone inserted: targeted refresher for {step.skill_name} "
            f"to strengthen fundamental concepts before advancing to downstream topics."
        )

    explanation_parts = []
    
    # Prerequisite positioning
    if relevant_prereqs and downstream_names:
        prereq_str = ", ".join(relevant_prereqs)
        downstream_str = ", ".join(downstream_names)
        explanation_parts.append(
            f"Recommended after {prereq_str} and before {downstream_str}"
        )
    elif relevant_prereqs:
        prereq_str = ", ".join(relevant_prereqs)
        explanation_parts.append(f"Recommended after mastering {prereq_str}")
    elif downstream_names:
        downstream_str = ", ".join(downstream_names)
        explanation_parts.append(f"Foundational requirement before {downstream_str}")
    else:
        explanation_parts.append(f"Core competency for {target_role_name}")

    # Functional dependency
    if downstream_names:
        first_downstream = downstream_names[0]
        explanation_parts.append(
            f"— {step.skill_name} is a direct prerequisite for building the {first_downstream} module "
            f"in your target role, and closes a skill gap identified from your goal."
        )
    else:
        explanation_parts.append(
            f"— Master {step.skill_name} to complete production-ready requirements for {target_role_name}."
        )

    return " ".join(explanation_parts)


async def explain_step(
    learner_id: str,
    step_id: str
) -> ExplanationResponse:
    """
    Returns an on-demand explanation for a single roadmap item with grounded fact metadata.
    """
    roadmap_doc = db.get_document("roadmaps", learner_id)
    if not roadmap_doc:
        return ExplanationResponse(
            learner_id=learner_id,
            step_id=step_id,
            skill_name="Unknown",
            explanation="Roadmap not found for learner.",
            grounded_facts={}
        )

    steps_data = roadmap_doc.get("steps", [])
    step_dict = next((s for s in steps_data if s["step_id"] == step_id), None)
    if not step_dict:
        return ExplanationResponse(
            learner_id=learner_id,
            step_id=step_id,
            skill_name="Unknown",
            explanation="Step not found in roadmap.",
            grounded_facts={}
        )

    all_steps = [RoadmapStep(**s) for s in steps_data]
    current_step = RoadmapStep(**step_dict)
    target_role = roadmap_doc.get("target_role", "Software Engineer")

    explanation = current_step.explanation
    if not explanation:
        explanation = generate_grounded_explanation(current_step, target_role, all_steps)

    grounded_facts = {
        "target_role": target_role,
        "prerequisites": current_step.prerequisites,
        "gap_score": current_step.gap_score,
        "step_order": current_step.step,
        "is_remedial": current_step.is_remedial
    }

    return ExplanationResponse(
        learner_id=learner_id,
        step_id=step_id,
        skill_name=current_step.skill_name,
        explanation=explanation,
        grounded_facts=grounded_facts
    )
