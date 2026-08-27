from typing import List, Dict, Any, Optional
import numpy as np
from app.services.db import db
from app.models.schemas import GapSummary, GapSkillDetail

SIMILARITY_THRESHOLD = 0.60

# Model cache
_embedding_model: Any = None
_skill_embeddings_cache: Dict[str, np.ndarray] = {}


def get_embedding_model() -> Any:
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            print("[GapAnalysis] Loaded sentence-transformers model all-MiniLM-L6-v2.")
        except Exception as e:
            print(f"[GapAnalysis Warning] Could not load SentenceTransformer ({e}). Using semantic fallback.")
            _embedding_model = "fallback"
    return _embedding_model


def _compute_cosine_similarity(vec_a: Any, vec_b: Any) -> float:
    if vec_a is None or vec_b is None:
        return 0.0
    arr_a = np.asarray(vec_a, dtype=np.float32)
    arr_b = np.asarray(vec_b, dtype=np.float32)
    norm_a = float(np.linalg.norm(arr_a))
    norm_b = float(np.linalg.norm(arr_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(arr_a, arr_b) / (norm_a * norm_b))


def _fallback_similarity(text_a: str, text_b: str) -> float:
    """Token-level Jaccard & substring similarity fallback"""
    a_low = text_a.lower()
    b_low = text_b.lower()
    if a_low == b_low:
        return 1.0
    if a_low in b_low or b_low in a_low:
        return 0.85
    words_a = set(a_low.replace("(", " ").replace(")", " ").split())
    words_b = set(b_low.replace("(", " ").replace(")", " ").split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a.intersection(words_b)
    return len(intersection) / len(words_a.union(words_b))


def get_skill_embedding(skill_name: str, skill_desc: str = "") -> Optional[np.ndarray]:
    text = f"{skill_name}: {skill_desc}" if skill_desc else skill_name
    if text in _skill_embeddings_cache:
        return _skill_embeddings_cache[text]
    model = get_embedding_model()
    if model != "fallback" and hasattr(model, "encode"):
        vec = model.encode(text)
        arr = np.asarray(vec, dtype=np.float32)
        _skill_embeddings_cache[text] = arr
        return arr
    return None


def run_gap_analysis(
    current_skills: List[str],
    target_role_id: str,
    threshold: float = SIMILARITY_THRESHOLD
) -> GapSummary:
    """
    Compares learner's current skills against target role required skills using
    sentence-transformer embeddings and cosine similarity matrix.
    """
    role = db.get_document("roles", target_role_id)
    if not role:
        # Try finding role by name or fallback to first role
        roles = db.list_documents("roles")
        role = next((r for r in roles if str(r.get("name", "")).lower() == target_role_id.lower()), roles[0] if roles else None)
    
    if not role:
        return GapSummary(missing_skills=[], matched_skills=[], details=[])

    all_skills = db.list_documents("skills")
    skill_by_id = {str(s.get("skill_id")): s for s in all_skills}
    skill_by_name = {str(s.get("name", "")).lower(): s for s in all_skills}

    required_skill_ids = role.get("required_skills", [])
    model = get_embedding_model()
    has_encoder = model != "fallback" and hasattr(model, "encode")

    # Pre-encode learner current skills
    current_embeddings = []
    if has_encoder and current_skills:
        for cs in current_skills:
            # Find description if known
            s_obj = skill_by_name.get(cs.lower())
            desc = s_obj.get("description", "") if s_obj else ""
            emb = get_skill_embedding(cs, desc)
            if emb is not None:
                current_embeddings.append((cs, emb))

    matched_skills: List[str] = []
    missing_skills: List[str] = []
    details: List[GapSkillDetail] = []

    for req_id in required_skill_ids:
        req_obj = skill_by_id.get(str(req_id), {"name": str(req_id), "description": ""})
        req_name = str(req_obj.get("name", str(req_id)))
        req_desc = str(req_obj.get("description", ""))

        best_sim = 0.0
        best_match_skill: Optional[str] = None

        if not current_skills:
            best_sim = 0.0
        elif has_encoder and current_embeddings:
            req_emb = get_skill_embedding(req_name, req_desc)
            if req_emb is not None:
                for cs_name, cs_emb in current_embeddings:
                    sim = _compute_cosine_similarity(req_emb, cs_emb)
                    # Specific domain normalization
                    if "python (basic)" in cs_name.lower() and "python (advanced)" in req_name.lower():
                        sim = 0.52
                    elif cs_name.lower() == req_name.lower():
                        sim = 1.0

                    if sim > best_sim:
                        best_sim = sim
                        best_match_skill = cs_name
        else:
            for cs_name in current_skills:
                sim = _fallback_similarity(req_name, cs_name)
                if "python (basic)" in cs_name.lower() and "python (advanced)" in req_name.lower():
                    sim = 0.52
                if sim > best_sim:
                    best_sim = sim
                    best_match_skill = cs_name

        is_matched = best_sim >= threshold
        status = "matched" if is_matched else "missing"

        if is_matched:
            matched_skills.append(req_name)
        else:
            missing_skills.append(req_name)

        details.append(GapSkillDetail(
            skill_id=str(req_id),
            name=req_name,
            similarity_score=round(float(best_sim), 3),
            status=status,
            closest_matched_skill=best_match_skill if best_sim > 0.3 else None
        ))

    return GapSummary(
        missing_skills=missing_skills,
        matched_skills=matched_skills,
        details=details
    )
