import os
import sys
import json

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.db import db

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "app", "data")


def seed_database():
    print("[Seed] Seeding database collections from JSON files...")

    # 1. Skills
    skills_file = os.path.join(DATA_DIR, "seed_skills.json")
    with open(skills_file, "r", encoding="utf-8") as f:
        skills = json.load(f)
    for skill in skills:
        db.set_document("skills", skill["skill_id"], skill)
    print(f"[Seed] Successfully seeded {len(skills)} skills.")

    # 2. Roles
    roles_file = os.path.join(DATA_DIR, "seed_roles.json")
    with open(roles_file, "r", encoding="utf-8") as f:
        roles = json.load(f)
    for role in roles:
        db.set_document("roles", role["role_id"], role)
    print(f"[Seed] Successfully seeded {len(roles)} roles.")

    # 3. Prerequisites
    prereqs_file = os.path.join(DATA_DIR, "seed_prerequisites.json")
    with open(prereqs_file, "r", encoding="utf-8") as f:
        prereqs = json.load(f)
    for idx, edge in enumerate(prereqs):
        edge_id = f"edge_{edge['from_skill_id']}_{edge['to_skill_id']}"
        db.set_document("prerequisites", edge_id, edge)
    print(f"[Seed] Successfully seeded {len(prereqs)} prerequisite edges.")

    # 4. Resources
    resources_file = os.path.join(DATA_DIR, "seed_resources.json")
    with open(resources_file, "r", encoding="utf-8") as f:
        resources = json.load(f)
    for res in resources:
        db.set_document("resources", res["resource_id"], res)
    print(f"[Seed] Successfully seeded {len(resources)} learning resources.")

    print("[Seed] Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
