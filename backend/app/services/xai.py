import os
import json
from typing import Dict, Any, List
import httpx
from app.services.db import db
from app.models.schemas import RoadmapStep, ExplanationResponse


def _template_grounded_explanation(
    step: RoadmapStep,
    target_role_name: str,
    all_steps: List[RoadmapStep]
) -> str:
    """Deterministic fact-grounded template fallback based on DAG graph relationships."""
    step_index = step.step - 1
    upstream_in_path = [s.skill_name for s in all_steps[:step_index]]
    relevant_prereqs = [p for p in step.prerequisites if p in upstream_in_path]
    downstream_in_path = [s for s in all_steps[step_index + 1:] if step.skill_name in s.prerequisites]
    downstream_names = [d.skill_name for d in downstream_in_path]

    if step.is_remedial:
        return (
            f"Remedial milestone inserted: targeted refresher for {step.skill_name} "
            f"to strengthen fundamental concepts before advancing to downstream topics."
        )

    explanation_parts = []
    if relevant_prereqs and downstream_names:
        prereq_str = ", ".join(relevant_prereqs)
        downstream_str = ", ".join(downstream_names)
        explanation_parts.append(f"Recommended after {prereq_str} and before {downstream_str}")
    elif relevant_prereqs:
        prereq_str = ", ".join(relevant_prereqs)
        explanation_parts.append(f"Recommended after mastering {prereq_str}")
    elif downstream_names:
        downstream_str = ", ".join(downstream_names)
        explanation_parts.append(f"Foundational requirement before {downstream_str}")
    else:
        explanation_parts.append(f"Core competency for {target_role_name}")

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


def generate_grounded_explanation(
    step: RoadmapStep,
    target_role_name: str,
    all_steps: List[RoadmapStep]
) -> str:
    """
    Generates a fact-grounded explanation based on prerequisite DAG edges,
    target career role, and gap similarity score. Uses Gemini with strict structural
    constraints, falling back to deterministic graph template synthesis.
    """
    # 1. Upstream prerequisites in the path
    step_index = step.step - 1
    upstream_in_path = [s.skill_name for s in all_steps[:step_index]]
    relevant_prereqs = [p for p in step.prerequisites if p in upstream_in_path]
    
    # 2. Downstream dependents in the path
    downstream_in_path = [s for s in all_steps[step_index + 1:] if step.skill_name in s.prerequisites]
    downstream_names = [d.skill_name for d in downstream_in_path]

    # 3. Try Gemini LLM Grounded Synthesis if GEMINI_API_KEY is available
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)

            prereq_str = ", ".join(relevant_prereqs) if relevant_prereqs else "None (Foundational Entry Point)"
            downstream_str = ", ".join(downstream_names) if downstream_names else "Final Target Role Capstone"
            remedial_note = "Note: This is an active remedial refresher module inserted after an assessment gap." if step.is_remedial else ""

            prompt = f"""You are an Explainable AI (XAI) learning path mentor.
Given these STRICT, verified structural facts from the learner's DAG roadmap:
- Recommended Skill: {step.skill_name}
- Step Number: {step.step} of {len(all_steps)}
- Target Role: {target_role_name}
- Direct Upstream Prerequisites: {prereq_str}
- Downstream Modules Unlocked: {downstream_str}
{remedial_note}

Write a natural, insightful, 2-sentence explanation answering "Why is this skill recommended at this exact step?".
Rules:
1. Ground the explanation strictly in the upstream prerequisites and downstream unlocked topics provided above (do not invent unlisted prerequisites).
2. Connect how this skill bridges foundational knowledge to practical application in the target role.
3. Output ONLY the 2-sentence rationale with no surrounding quotes or meta-commentary."""

            for model_name in ['gemini-3-flash-preview', 'gemini-flash-latest']:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    text = response.text.strip()
                    if text and len(text) > 20:
                        return text
                except Exception:
                    continue
        except Exception as e:
            print(f"[XAI Service] Gemini XAI synthesis failed: {e}")

    # Fallback to deterministic template
    return _template_grounded_explanation(step, target_role_name, all_steps)



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
