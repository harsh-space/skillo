import json
import os
import re
from typing import Dict, Any, List
import httpx

from app.services.db import db
from app.models.schemas import GoalParseResponse


def _get_taxonomy_context():
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    return roles, skills


def _rule_based_parse(goal_text: str, roles: List[Dict[str, Any]], skills: List[Dict[str, Any]]) -> GoalParseResponse:
    goal_lower = goal_text.lower()
    
    # Check for direct or fuzzy matches on role names
    best_role = None
    best_score = -1
    
    for r in roles:
        role_name_lower = r["name"].lower()
        role_words = set(re.findall(r'\w+', role_name_lower))
        goal_words = set(re.findall(r'\w+', goal_lower))
        overlap = len(role_words.intersection(goal_words))
        
        # Specific role keyword bonuses
        if "backend" in goal_lower and "backend" in role_name_lower:
            overlap += 5
        elif "frontend" in goal_lower and "frontend" in role_name_lower:
            overlap += 5
        elif "fullstack" in goal_lower or "full stack" in goal_lower or "full-stack" in goal_lower:
            if "full stack" in role_name_lower:
                overlap += 6
        elif "devops" in goal_lower or "cloud" in goal_lower or "infrastructure" in goal_lower:
            if "devops" in role_name_lower:
                overlap += 5
        elif "machine learning" in goal_lower or "ml" in goal_lower or "data science" in goal_lower or "ai" in goal_lower:
            if "machine learning" in role_name_lower:
                overlap += 5

        if overlap > best_score:
            best_score = overlap
            best_role = r

    # Default to Backend Developer if no strong match
    if not best_role or best_score <= 0:
        best_role = next((r for r in roles if "backend" in r["name"].lower()), roles[0])

    # Fetch skill names for the matched role
    skill_map = {s["skill_id"]: s["name"] for s in skills}
    target_skill_names = [skill_map.get(s_id, s_id) for s_id in best_role.get("required_skills", [])]

    return GoalParseResponse(
        target_role=best_role["name"],
        target_role_id=best_role["role_id"],
        target_skills=target_skill_names,
        parsed_intent=f"Extracted career objective: {best_role['name']} (NLP taxonomy matching)"
    )


async def parse_goal(goal_text: str) -> GoalParseResponse:
    """
    Parses a free-text learning goal into structured target_role and target_skills,
    constrained to the curated taxonomy. Attempts LLM call if API keys are configured,
    and falls back to robust taxonomy entity matching.
    """
    roles, skills = _get_taxonomy_context()
    
    # Try LLM if GEMINI_API_KEY / OPENAI_API_KEY is available
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

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

    # Fallback to deterministic taxonomy matcher
    return _rule_based_parse(goal_text, roles, skills)
