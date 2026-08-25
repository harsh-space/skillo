from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.db import db

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])


@router.get("")
def get_taxonomy() -> Dict[str, Any]:
    skills = db.list_documents("skills")
    roles = db.list_documents("roles")
    prereqs = db.list_documents("prerequisites")
    return {
        "skills": sorted(skills, key=lambda s: s.get("name", "")),
        "roles": roles,
        "prerequisites": prereqs
    }
