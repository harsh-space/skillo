import json
import os
import re
from typing import Dict, Any, List
import numpy as np
import httpx

from app.services.db import db
from app.models.schemas import GoalParseResponse
from app.services.gap_analysis import get_embedding_model, _compute_cosine_similarity


def _get_taxonomy_context():
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    return roles, skills


def _semantic_embed_parse(goal_text: str, roles: List[Dict[str, Any]], skills: List[Dict[str, Any]]) -> GoalParseResponse:
    """
    Pure ML semantic intent extraction using dense sentence-transformer embeddings.
    Embeds the entire free-text query into a 384-dimensional dense vector space and computes
    cosine similarity against rich contextual role representations (role descriptions + skill clusters).
    """
    model = get_embedding_model()
    skill_map = {s["skill_id"]: s["name"] for s in skills}
    
    if model != "fallback":
        try:
            goal_vector = model.encode(goal_text)
            
            best_role = None
            best_sim = -1.0
            
            for r in roles:
                role_skills = [skill_map.get(s_id, s_id) for s_id in r.get("required_skills", [])]
                role_semantic_text = (
                    f"Career Role: {r['name']}. {r.get('description', '')} "
                    f"Core competencies and technical skills: {', '.join(role_skills)}."
                )
                role_vector = model.encode(role_semantic_text)
                sim = _compute_cosine_similarity(goal_vector, role_vector)
                
                if sim > best_sim:
                    best_sim = sim
                    best_role = r
                    
            if best_role:
                target_skill_names = [skill_map.get(s_id, s_id) for s_id in best_role.get("required_skills", [])]
                return GoalParseResponse(
                    target_role=best_role["name"],
                    target_role_id=best_role["role_id"],
                    target_skills=target_skill_names,
                    parsed_intent=f"Extracted career objective: {best_role['name']} (Dense Semantic Cosine Similarity: {best_sim:.2f})"
                )
        except Exception as e:
            print(f"[GoalParser Warning] Semantic embedding parse failed: {e}. Using token fallback.")

    # Token fallback if model is unavailable
    goal_lower = goal_text.lower()
    best_role = None
    best_score = -1

    for r in roles:
        role_skills = [skill_map.get(s_id, s_id).lower() for s_id in r.get("required_skills", [])]
        score = sum(1 for sk in role_skills if sk in goal_lower)
        if r["name"].lower() in goal_lower:
            score += 3
        if score > best_score:
            best_score = score
            best_role = r

    if not best_role or best_score <= 0:
        best_role = next((r for r in roles if "backend" in r["name"].lower()), roles[0])

    target_skill_names = [skill_map.get(s_id, s_id) for s_id in best_role.get("required_skills", [])]
    return GoalParseResponse(
        target_role=best_role["name"],
        target_role_id=best_role["role_id"],
        target_skills=target_skill_names,
        parsed_intent=f"Extracted career objective: {best_role['name']} (Token Overlap)"
    )


async def parse_goal(goal_text: str) -> GoalParseResponse:
    """
    Parses a free-text learning goal into structured target_role and target_skills,
    constrained to the curated taxonomy. Attempts LLM API if key is set,
    otherwise uses local dense sentence-transformer vector embedding matching.
    """
    roles, skills = _get_taxonomy_context()
    
    # Try LLM if GEMINI_API_KEY / OPENAI_API_KEY is available
    openai_key = os.getenv("OPENAI_API_KEY")

    if openai_key:
        try:
            available_roles = [r["name"] for r in roles]
            prompt = f"""You are a career learning path advisor.
Given the user's career goal: "{goal_text}"
Choose the single most relevant target role strictly from this list: {available_roles}.

Respond with ONLY a valid JSON object in this exact schema:
{{
  "target_role": "<One role from the list>",
  "intent_summary": "<Brief 1-sentence summary of learner objective>"
}}"""
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    }
                )
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"].strip()
                    parsed = json.loads(content)
                    role_name = parsed.get("target_role")
                    matched_role = next((r for r in roles if r["name"].lower() == role_name.lower()), None)
                    if matched_role:
                        skill_map = {s["skill_id"]: s["name"] for s in skills}
                        target_skills = [skill_map.get(s_id, s_id) for s_id in matched_role.get("required_skills", [])]
                        return GoalParseResponse(
                            target_role=matched_role["name"],
                            target_role_id=matched_role["role_id"],
                            target_skills=target_skills,
                            parsed_intent=parsed.get("intent_summary")
                        )
        except Exception:
            pass

    # Dense Vector Embedding Cosine Similarity
    return _semantic_embed_parse(goal_text, roles, skills)
