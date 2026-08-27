import os
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "app", "data")
LOCAL_DB_FILE = os.path.join(DATA_DIR, "db_storage.json")

def rebuild_database():
    print("[Rebuild] Rebuilding db_storage.json from scratch...")

    # Load seeds
    with open(os.path.join(DATA_DIR, "seed_skills.json"), "r", encoding="utf-8") as f:
        skills = json.load(f)

    with open(os.path.join(DATA_DIR, "seed_roles.json"), "r", encoding="utf-8") as f:
        roles = json.load(f)

    with open(os.path.join(DATA_DIR, "seed_prerequisites.json"), "r", encoding="utf-8") as f:
        prereqs = json.load(f)

    with open(os.path.join(DATA_DIR, "seed_resources.json"), "r", encoding="utf-8") as f:
        resources = json.load(f)

    clean_db = {
        "skills": {s["skill_id"]: s for s in skills},
        "roles": {r["role_id"]: r for r in roles},
        "prerequisites": {f"edge_{p['from_skill_id']}_{p['to_skill_id']}": p for p in prereqs},
        "resources": {r["resource_id"]: r for r in resources},
        "learners": {},
        "roadmaps": {},
        "feedback_events": {}
    }

    with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(clean_db, f, indent=2)

    print(f"[Rebuild] Successfully wrote {len(skills)} skills, {len(roles)} roles, {len(prereqs)} prerequisites, {len(resources)} resources to {LOCAL_DB_FILE}!")

if __name__ == "__main__":
    rebuild_database()
