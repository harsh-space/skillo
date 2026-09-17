import os
import sys

# Ensure repo root and backend directory are in sys.path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")

if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pytest
from app.services.db import db
from app.services.goal_parser import _semantic_embed_parse
from app.services.gap_analysis import run_gap_analysis
from app.services.path_generator import generate_learning_path, build_prerequisite_graph
from app.services.xai import generate_grounded_explanation
from app.services.feedback import handle_feedback
from app.models.schemas import FeedbackRequest, RecommendRequest
from scripts.seed_db import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    seed_database()


def test_seed_data_loaded():
    skills = db.list_documents("skills")
    roles = db.list_documents("roles")
    prereqs = db.list_documents("prerequisites")
    resources = db.list_documents("resources")

    assert len(skills) >= 30, f"Expected >= 30 skills, got {len(skills)}"
    assert len(roles) >= 5, f"Expected >= 5 roles, got {len(roles)}"
    assert len(prereqs) >= 25, f"Expected >= 25 prereq edges, got {len(prereqs)}"
    assert len(resources) >= 30, f"Expected >= 30 resources, got {len(resources)}"


def test_goal_parsing_worked_example():
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    goal_text = "I want to become a backend developer"
    
    parsed = _semantic_embed_parse(goal_text, roles, skills)
    assert parsed.target_role == "Backend Developer"
    assert parsed.target_role_id == "role_backend_developer"
    assert len(parsed.target_skills) > 0
    assert any("python" in s.lower() for s in parsed.target_skills)
    assert any("rest" in s.lower() or "api" in s.lower() for s in parsed.target_skills)


def test_ai_engineer_goal_parsing():
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    goal_text = "I want to become an AI engineer"
    
    parsed = _semantic_embed_parse(goal_text, roles, skills)
    assert parsed.target_role == "AI Engineer"
    assert parsed.target_role_id == "role_ai_engineer"
    assert "LLM Applications & RAG Systems" in parsed.target_skills
    assert "Vector Databases & Embeddings" in parsed.target_skills


def test_gap_analysis_worked_example():
    # Input: learner knows HTML, CSS, basic Python
    current_skills = ["HTML", "CSS", "Python (basic)"]
    target_role_id = "role_backend_developer"

    gap_result = run_gap_analysis(current_skills, target_role_id)
    
    # Python (advanced) should be missing (gap)
    # SQL, REST APIs, Auth, Docker should be missing
    assert "Python (advanced)" in gap_result.missing_skills
    assert any("sql" in s.lower() for s in gap_result.missing_skills)
    assert "REST APIs" in gap_result.missing_skills
    assert any("auth" in s.lower() for s in gap_result.missing_skills)


def test_path_generation_topological_order():
    current_skills = ["HTML", "CSS", "Python (basic)"]
    missing_skills = [
        "Python (advanced)",
        "SQL & Relational Databases",
        "REST APIs",
        "Git & GitHub",
        "Authentication & JWT",
        "Docker & Containers"
    ]

    steps = generate_learning_path(missing_skills, current_skills)
    step_names = [s.skill_name for s in steps]

    # Verify DAG ordering constraints
    # 1. Python (advanced) must precede REST APIs
    py_idx = next(i for i, name in enumerate(step_names) if "python (advanced)" in name.lower())
    rest_idx = next(i for i, name in enumerate(step_names) if "rest api" in name.lower())
    assert py_idx < rest_idx, "Python (advanced) must come before REST APIs"

    # 2. REST APIs must precede Authentication
    auth_idx = next(i for i, name in enumerate(step_names) if "auth" in name.lower())
    assert rest_idx < auth_idx, "REST APIs must come before Authentication"


def test_xai_grounded_explanation():
    current_skills = ["HTML", "CSS", "Python (basic)"]
    missing_skills = [
        "Python (advanced)",
        "SQL & Relational Databases",
        "REST APIs",
        "Authentication & JWT"
    ]
    steps = generate_learning_path(missing_skills, current_skills)
    
    rest_step = next(s for s in steps if "rest api" in s.skill_name.lower())
    explanation = generate_grounded_explanation(rest_step, "Backend Developer", steps)
    
    assert len(explanation) > 20
    assert any(w in explanation.lower() for w in ["backend", "python", "service", "rest", "authentication", "api", "foundation", "module"])


def test_adaptive_feedback_remedial_insertion():
    # Setup test learner and initial roadmap
    learner_id = "test_learner_scenario"
    current_skills = ["HTML", "CSS", "Python (basic)"]
    
    # Save learner
    db.set_document("learners", learner_id, {
        "learner_id": learner_id,
        "name": "Alex",
        "current_skills": current_skills,
        "target_role_id": "role_backend_developer"
    })

    # Generate initial roadmap with force_regenerate
    from app.api.recommend import generate_recommendation
    initial_rec = generate_recommendation(RecommendRequest(learner_id=learner_id, force_regenerate=True))
    
    first_step = initial_rec.roadmap[0]
    initial_len = len(initial_rec.roadmap)

    # Submit quiz score of 40% (fail -> remedial)
    feedback_req = FeedbackRequest(
        learner_id=learner_id,
        step_id=first_step.step_id,
        event="quiz_score",
        value=40.0
    )
    feedback_res = handle_feedback(feedback_req)

    assert feedback_res.adaptation_applied == "remedial_insertion"
    assert len(feedback_res.updated_roadmap) == initial_len + 1
    assert any(s.is_remedial for s in feedback_res.updated_roadmap)
    
    # Next step after first step should be the remedial refresher
    assert feedback_res.updated_roadmap[1].is_remedial
    assert "Refresher" in feedback_res.updated_roadmap[1].skill_name or "remedial" in feedback_res.updated_roadmap[1].step_id


# =====================================================================
# Phase 1 (v1.1) Stabilization Tests
# =====================================================================

def test_cosine_similarity_bounded():
    """Validates that computed cosine similarity is strictly bounded to [-1.0, 1.0]."""
    from app.services.gap_analysis import _compute_cosine_similarity
    import numpy as np

    v1 = np.array([1.0, 2.0, 3.0])
    v2 = np.array([1.0, 2.0, 3.0])
    assert abs(_compute_cosine_similarity(v1, v2) - 1.0) < 1e-5

    v3 = np.array([10.0, 20.0, 30.0])
    assert abs(_compute_cosine_similarity(v1, v3) - 1.0) < 1e-5

    v4 = np.array([-1.0, -2.0, -3.0])
    assert abs(_compute_cosine_similarity(v1, v4) - (-1.0)) < 1e-5

    v_zero = np.array([0.0, 0.0, 0.0])
    assert _compute_cosine_similarity(v1, v_zero) == 0.0


def test_similarity_score_clamped():
    """Validates that goal parsing similarity scores never exceed 1.0 even with boosts."""
    import re
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    
    # Query matching role and multiple aliases to trigger maximum boosts
    goal = "I want to become an AI engineer doing artificial intelligence, llm, rag, and prompt engineering"
    res = _semantic_embed_parse(goal, roles, skills)
    
    match = re.search(r"Similarity:\s*([0-9.]+)", res.parsed_intent)
    if match:
        sim_val = float(match.group(1))
        assert sim_val <= 1.0, f"Expected similarity <= 1.0, got {sim_val}"


def test_python_gap_without_hardcode():
    """Validates that Python (advanced) is identified as a gap for a basic Python learner without magic constants."""
    current_skills = ["HTML", "CSS", "Python (basic)"]
    gap_result = run_gap_analysis(current_skills, "role_backend_developer")
    
    assert "Python (advanced)" in gap_result.missing_skills
    detail = next((d for d in gap_result.details if d.name == "Python (advanced)"), None)
    assert detail is not None
    assert detail.status == "missing"
    assert detail.similarity_score < 0.60


def test_dag_no_cycles():
    """Validates that the prerequisite graph is a strictly valid Directed Acyclic Graph (DAG)."""
    import networkx as nx
    g = build_prerequisite_graph()
    assert nx.is_directed_acyclic_graph(g), "Prerequisite graph contains cycles!"


def test_goal_fallback_label():
    """Validates that unrecognized goals return an honest low-confidence fallback label."""
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    
    res = _semantic_embed_parse("I want to become a pediatric surgeon and perform surgeries", roles, skills)
    assert "low confidence" in res.parsed_intent.lower() or "did not match" in res.parsed_intent.lower()


def test_password_hash_is_bcrypt():
    """Validates that password hashes use bcrypt."""
    from app.api.auth import _hash_password
    pwd_hash = _hash_password("SuperSecret123!")
    assert pwd_hash.startswith("$2b$") or pwd_hash.startswith("$2a$"), f"Expected bcrypt hash prefix, got {pwd_hash[:4]}"


def test_password_verify_correct():
    """Validates that correct passwords verify with bcrypt."""
    from app.api.auth import _hash_password, _verify_password
    pwd = "ValidPassword_2026!"
    pwd_hash = _hash_password(pwd)
    assert _verify_password(pwd, pwd_hash) is True


def test_password_verify_wrong():
    """Validates that incorrect passwords fail verification."""
    from app.api.auth import _hash_password, _verify_password
    pwd_hash = _hash_password("CorrectPassword")
    assert _verify_password("WrongPassword", pwd_hash) is False


def test_seed_counts_exact():
    """Validates exact counts of curated seed taxonomy datasets."""
    skills = db.list_documents("skills")
    roles = db.list_documents("roles")
    prereqs = db.list_documents("prerequisites")
    resources = db.list_documents("resources")

    assert len(skills) == 36, f"Expected exactly 36 skills, found {len(skills)}"
    assert len(roles) == 6, f"Expected exactly 6 roles, found {len(roles)}"
    assert len(prereqs) == 29, f"Expected exactly 29 prerequisite edges, found {len(prereqs)}"
    assert len(resources) == 49, f"Expected exactly 49 resources, found {len(resources)}"


def test_no_orphaned_prereq_ids():
    """Validates that every from_skill_id and to_skill_id in prerequisites exists in the skills collection."""
    skills = db.list_documents("skills")
    skill_ids = {s["skill_id"] for s in skills}
    prereqs = db.list_documents("prerequisites")

    for p in prereqs:
        assert p["from_skill_id"] in skill_ids, f"Orphaned from_skill_id: {p['from_skill_id']}"
        assert p["to_skill_id"] in skill_ids, f"Orphaned to_skill_id: {p['to_skill_id']}"


def test_no_orphaned_resource_skill_ids():
    """Validates that every resource maps to a valid skill_id."""
    skills = db.list_documents("skills")
    skill_ids = {s["skill_id"] for s in skills}
    resources = db.list_documents("resources")

    for r in resources:
        assert r["skill_id"] in skill_ids, f"Orphaned resource skill_id: {r['skill_id']} in resource {r.get('resource_id')}"


def test_api_unknown_learner_returns_404():
    """Validates that requesting a roadmap for a nonexistent learner returns HTTP 404."""
    from app.api.recommend import get_learner_roadmap
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        get_learner_roadmap("nonexistent_learner_id_12345678")
    assert exc_info.value.status_code == 404


def test_auth_signup_login_roundtrip():
    """Validates that signup and login round-trip works consistently with matching user and learner IDs."""
    import secrets
    from app.api.auth import signup, login
    from app.models.schemas import UserSignupRequest, UserLoginRequest

    rand_email = f"test_user_{secrets.token_hex(4)}@example.com"
    pwd = "SecurePassword123!"
    
    signup_res = signup(UserSignupRequest(name="Test User", email=rand_email, password=pwd))
    assert signup_res.user_id is not None
    assert signup_res.learner_id is not None
    assert signup_res.token is not None

    login_res = login(UserLoginRequest(email=rand_email, password=pwd))
    assert login_res.user_id == signup_res.user_id
    assert login_res.learner_id == signup_res.learner_id

