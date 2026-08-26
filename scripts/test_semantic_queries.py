import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.db import db
from app.services.goal_parser import _semantic_embed_parse

def main():
    roles = db.list_documents("roles")
    skills = db.list_documents("skills")
    
    queries = [
        "I'm a sophomore who hates writing frontend CSS and wants to automate cloud infrastructure, build CI/CD pipelines, and deploy container clusters.",
        "I want to train neural networks and build predictive AI models with PyTorch, but I only know basic math.",
        "I want to build full end-to-end web apps with both client-side UI and server databases.",
        "I want to build backend systems with databases, caching and REST APIs."
    ]
    
    for q in queries:
        res = _semantic_embed_parse(q, roles, skills)
        print(f"\n[Query] {q}")
        print(f" -> Matched Target Role: {res.target_role} ({res.parsed_intent})")

if __name__ == "__main__":
    main()
