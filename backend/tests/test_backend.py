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
