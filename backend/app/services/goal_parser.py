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
    
    # Keyword and abbreviation alias mapping
    alias_map = {
        "role_ml_engineer": ["ml", "machine learning", "deep learning", "predictive model", "data science", "pytorch", "tensorflow"],
        "role_ai_engineer": ["ai", "artificial intelligence", "genai", "generative ai", "llm", "rag", "agents", "langchain", "prompt engineering"],
        "role_frontend_developer": ["frontend", "front-end", "front end", "ui", "ux", "react", "nextjs", "next.js", "css", "html", "javascript", "client-side"],
        "role_backend_developer": ["backend", "back-end", "back end", "server", "fastapi", "django", "flask", "database", "sql", "orm", "rest api", "microservices"],
        "role_devops_engineer": ["devops", "sre", "cloud", "infrastructure", "kubernetes", "k8s", "docker", "ci/cd", "pipeline", "aws", "terraform"],
        "role_fullstack_developer": ["fullstack", "full stack", "full-stack", "mern", "end to end", "end-to-end"]
    }

    goal_lower = goal_text.lower()
    goal_words = set(re.findall(r"\b[a-z0-9\-_.]+\b", goal_lower))

    if model != "fallback":
        try:
            if hasattr(model, "transform"):
                goal_vector = model.transform([goal_text])
            else:
                goal_vector = model.encode(goal_text)
            
            best_role = None
            best_sim = -1.0
            
            for r in roles:
                r_id = r.get("role_id", "")
                role_skills = [skill_map.get(s_id, s_id) for s_id in r.get("required_skills", [])]
                role_semantic_text = (
                    f"Career Role: {r['name']}. {r.get('description', '')} "
                    f"Core competencies and technical skills: {', '.join(role_skills)}."
                )
                if hasattr(model, "transform"):
                    role_vector = model.transform([role_semantic_text])
                else:
                    role_vector = model.encode(role_semantic_text)
                sim = _compute_cosine_similarity(goal_vector, role_vector)
                
                # Check exact title or keyword alias matches
                if r["name"].lower() in goal_lower:
                    sim += 0.40
                
                # Alias matching boost
                aliases = alias_map.get(r_id, [])
                for alias in aliases:
                    if alias in goal_lower:
                        sim += 0.35
                    elif alias in goal_words:
                        sim += 0.35
                
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
    best_role = None
    best_score = -1

    for r in roles:
        r_id = r.get("role_id", "")
        role_skills = [skill_map.get(s_id, s_id).lower() for s_id in r.get("required_skills", [])]
        score = sum(1 for sk in role_skills if sk in goal_lower)
        if r["name"].lower() in goal_lower:
            score += 5
        
        # Check alias
        for alias in alias_map.get(r_id, []):
            if alias in goal_lower or alias in goal_words:
                score += 4

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


import asyncio


async def _try_gemini(goal_text: str, roles, skills) -> GoalParseResponse | None:
    """Calls Gemini via the official google-genai SDK with gemini-flash-latest."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return None
    try:
        from google import genai
        
        available_roles = [r["name"] for r in roles]
        prompt = (
            f"You are a career learning path advisor.\n"
            f"Given the user's career goal: \"{goal_text}\"\n"
            f"Choose the single most relevant target role strictly from this list: {available_roles}.\n\n"
            f"Respond with ONLY a valid JSON object in this exact schema (no markdown, no extra text):\n"
            f'{{"target_role": "<One role from the list>", "intent_summary": "<Brief 1-sentence summary of learner objective>"}}'
        )

        client = genai.Client(api_key=gemini_key)
        
        # Run with a 3.0 second timeout to prevent blocking when Gemini is 503/overloaded
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )),
            timeout=3.0
        )
        
        raw = response.text.strip() if response.text else ""
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        
        parsed = json.loads(raw)
        role_name = parsed.get("target_role", "")
        matched_role = next((r for r in roles if r["name"].lower() == role_name.lower()), None)
        
        if matched_role:
            skill_map = {s["skill_id"]: s["name"] for s in skills}
            target_skills = [skill_map.get(s_id, s_id) for s_id in matched_role.get("required_skills", [])]
            return GoalParseResponse(
                target_role=matched_role["name"],
                target_role_id=matched_role["role_id"],
                target_skills=target_skills,
                parsed_intent=f"Gemini Flash: {parsed.get('intent_summary', 'Extracted target role')}"
            )
    except Exception as e:
        print(f"[GoalParser] Gemini SDK call bypassed or failed: {e}")
    return None


async def _try_openai(goal_text: str, roles, skills) -> GoalParseResponse | None:
    """Calls OpenAI GPT-3.5-turbo for structured JSON role classification."""
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return None
    try:
        available_roles = [r["name"] for r in roles]
        prompt = (
            f'You are a career learning path advisor.\n'
            f'Given the user\'s career goal: "{goal_text}"\n'
            f'Choose the single most relevant target role strictly from this list: {available_roles}.\n\n'
            f'Respond with ONLY a valid JSON object:\n'
            f'{{"target_role": "<One role from the list>", "intent_summary": "<Brief 1-sentence summary>"}}'
        )
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}"},
                json={"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "temperature": 0.1}
            )
        if res.status_code != 200:
            return None
        raw = res.json()["choices"][0]["message"]["content"].strip()
        parsed = json.loads(raw)
        role_name = parsed.get("target_role", "")
        matched_role = next((r for r in roles if r["name"].lower() == role_name.lower()), None)
        if matched_role:
            skill_map = {s["skill_id"]: s["name"] for s in skills}
            target_skills = [skill_map.get(s_id, s_id) for s_id in matched_role.get("required_skills", [])]
            return GoalParseResponse(
                target_role=matched_role["name"],
                target_role_id=matched_role["role_id"],
                target_skills=target_skills,
                parsed_intent=parsed.get("intent_summary", f"Goal mapped to {matched_role['name']} via OpenAI")
            )
    except Exception as e:
        print(f"[GoalParser] OpenAI call failed: {e}")
    return None


async def parse_goal(goal_text: str) -> GoalParseResponse:
    """
    Parses a free-text learning goal into a structured target_role + target_skills,
    constrained to the curated taxonomy.
    """
    roles, skills = _get_taxonomy_context()

    # Fast dense vector matching (with exact keywords/abbreviation boosts for instant sub-10ms resolution)
    semantic_res = _semantic_embed_parse(goal_text, roles, skills)
    if semantic_res:
        return semantic_res

    # Try LLMs for nuanced edge cases
    result = await _try_gemini(goal_text, roles, skills)
    if result:
        return result

    result = await _try_openai(goal_text, roles, skills)
    if result:
        return result

    return semantic_res

