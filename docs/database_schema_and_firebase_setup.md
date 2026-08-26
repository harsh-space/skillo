# Firebase Database Architecture & Integration Guide — Skillo AI

This document details the **Firestore Database Design**, data schemas, collection relationships, security rules, and setup instructions for **Skillo AI**.

---

## 1. Architectural Overview

Skillo AI implements a **Dual-Mode Database Layer** ([`backend/app/services/db.py`](file:///c:/Users/Lucky/OneDrive/Desktop/Skillo/skillo/backend/app/services/db.py)):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Service Layer                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌──────────────────────────┐   ┌──────────────────────────┐
       │   Firebase Firestore     │   │   Local Persistent DB    │
       │   (Cloud Production)     │   │   (Zero-Config JSON)     │
       │   `google-cloud-firestore`│   │   `data/db_storage.json` │
       └──────────────────────────┘   └──────────────────────────┘
```

- **Live Firebase Firestore**: Connected seamlessly when `GOOGLE_APPLICATION_CREDENTIALS` (service account file path) or `FIREBASE_CREDENTIALS_JSON` (env variable string) is present.
- **Zero-Config Local Fallback**: Transparently persists data locally to `backend/app/data/db_storage.json` if Firebase credentials are omitted, ensuring **100% offline functionality**.

---

## 2. Persisted vs. Derived Data Matrix

| Entity | Primary Storage Collection | Persisted Attributes | Dynamically Derived at Runtime |
|---|---|---|---|
| **Skills Taxonomy** | `skills` | `skill_id`, `name`, `description` | Dense vector embedding representation (384-d vector) via `sentence-transformers` |
| **Career Roles** | `roles` | `role_id`, `name`, `description`, `required_skills` | Skill Gap Matrix & Cosine Distance scores against learner profiles |
| **Prerequisites (DAG)** | `prerequisites` | `from_skill_id`, `to_skill_id` | Topological ordering (`NetworkX.topological_sort`) and prerequisite closure resolution |
| **Learning Resources** | `resources` | `resource_id`, `skill_id`, `title`, `url`, `type`, `is_remedial` | Contextual resource injection per roadmap milestone |
| **Learner Profile** | `learners` | `learner_id`, `name`, `current_skills`, `target_role_id`, `created_at`, `updated_at` | Active skill gap list (`target_skills - current_skills`) |
| **Learning Roadmap** | `roadmaps` | `learner_id`, `target_role`, `target_role_id`, `steps`, `gap_summary`, `updated_at` | Grounded XAI explanations (`_template_grounded_explanation`) and dynamic adaptive quiz re-ranking |
| **Feedback Events** | `feedback_events` | `learner_id`, `step_id`, `event_type`, `value`, `timestamp` | Real-time path re-ranking triggers (remedial insertion vs fast-track) |

---

## 3. Firestore Collections & Schema Specifications

### Collection 1: `skills`
Stores the domain competency catalog.
```json
{
  "skill_id": "skill_python_advanced",
  "name": "Python (advanced)",
  "description": "Object-oriented programming, decorators, generators, context managers, asyncio, and type hinting."
}
```

### Collection 2: `roles`
Stores career target definitions and required skill clusters.
```json
{
  "role_id": "role_ai_engineer",
  "name": "AI Engineer",
  "description": "Engineers intelligent AI solutions, LLM agents, RAG pipelines, deep learning models, and microservices.",
  "required_skills": [
    "skill_python_basics",
    "skill_python_advanced",
    "skill_ml_basics",
    "skill_deep_learning",
    "skill_llm_rag",
    "skill_vector_dbs",
    "skill_fastapi",
    "skill_docker"
  ]
}
```

### Collection 3: `prerequisites`
Stores Directed Acyclic Graph (DAG) dependency edges between skills.
```json
{
  "from_skill_id": "skill_deep_learning",
  "to_skill_id": "skill_llm_rag"
}
```

### Collection 4: `resources`
Stores courses, projects, and remedial learning materials.
```json
{
  "resource_id": "res_llm_rag_course",
  "skill_id": "skill_llm_rag",
  "title": "Building LLM Applications, Prompt Engineering & RAG Pipelines",
  "url": "https://python.langchain.com/docs/get_started/introduction",
  "type": "course",
  "is_remedial": false
}
```

### Collection 5: `learners`
Stores learner identity, prior skills, and career objective.
```json
{
  "learner_id": "learner_alex",
  "name": "Alex",
  "current_skills": ["HTML", "CSS", "Python (basic)"],
  "target_role_id": "role_backend_developer",
  "created_at": "2026-08-26T12:00:00.000Z",
  "updated_at": "2026-08-26T12:00:00.000Z"
}
```

### Collection 6: `roadmaps`
Stores generated milestone sequences and topological trajectories.
```json
{
  "learner_id": "learner_alex",
  "target_role": "Backend Developer",
  "target_role_id": "role_backend_developer",
  "steps": [
    {
      "step_id": "step_1_skill_python_advanced",
      "step": 1,
      "skill_id": "skill_python_advanced",
      "skill_name": "Python (advanced)",
      "status": "in_progress",
      "is_remedial": false,
      "explanation": "Recommended first because it is a foundational prerequisite for REST APIs.",
      "prerequisites": [],
      "gap_score": 0.35
    }
  ],
  "gap_summary": {
    "missing_skills": ["Python (advanced)", "SQL", "REST APIs", "Auth", "Git", "Docker"],
    "matched_skills": ["HTML", "CSS", "Python (basic)"]
  },
  "updated_at": "2026-08-26T12:00:00.000Z"
}
```

### Collection 7: `feedback_events`
Audit trail logging quiz scores and completion signals.
```json
{
  "learner_id": "learner_alex",
  "step_id": "step_1_skill_python_advanced",
  "event_type": "quiz_score",
  "value": 40.0,
  "timestamp": "2026-08-26T12:05:00.000Z"
}
```

---

## 4. Firebase Setup Instructions

### Option A: Standard Google Service Account File
1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Firestore** in Production mode.
3. Go to **Project Settings** $\rightarrow$ **Service Accounts** $\rightarrow$ **Generate New Private Key**.
4. Save the JSON file locally (e.g. `backend/firebase-key.json`).
5. Add to your `.env` file:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-key.json
   ```

### Option B: Cloud Deployment Environment Variable (Vercel / Render / Heroku)
Set `FIREBASE_CREDENTIALS_JSON` environment variable directly in your cloud dashboard with the raw JSON contents of your service account key.

---

## 5. Seeding Firebase Firestore

To seed your Cloud Firestore instance with the initial taxonomy, run:
```bash
python scripts/seed_db.py
```
This automatically populates all 36 skills, 6 roles, 38 prerequisite DAG edges, and 49 learning resources.
