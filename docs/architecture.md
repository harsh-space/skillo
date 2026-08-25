# architecture.md — Detailed System Architecture

Reference documents: `PRD.md` (what HCL requires), `context.md` (what we're specifically building). This document defines exactly how it's built and how every piece connects.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                       │
│  ┌───────────────────────┐        ┌────────────────────────────┐    │
│  │ Onboarding / Goal Input│        │  Dashboard                  │    │
│  │  - Skill selector      │        │  - Roadmap timeline view    │    │
│  │  - Goal text box       │        │  - Progress / skill graph   │    │
│  │  - "Why this?" panel   │        │  - Feedback (quiz) trigger  │    │
│  └───────────┬────────────┘        └───────────────┬──────────────┘   │
└──────────────┼─────────────────────────────────────┼──────────────────┘
               │  REST (JSON over HTTPS)              │
               ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                            │
│                                                                        │
│  ┌────────────────────┐     ┌──────────────────────────────────┐    │
│  │ Goal Parsing Service│     │ Learner Profiling Service          │    │
│  │ (LLM call)          │     │ (CRUD on profile in Firestore)     │    │
│  └──────────┬──────────┘     └──────────────┬─────────────────────┘   │
│             │                                │                        │
│             ▼                                ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │      Recommendation & Path Engine                            │     │
│  │  1. Skill Gap Analysis   (sentence-transformer embeddings +   │     │
│  │                            cosine similarity)                 │     │
│  │  2. Path Generation      (networkx DAG + topological sort)    │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │      Explainable AI (XAI) Service                             │     │
│  │  Template + LLM phrasing, fed by gap scores + DAG edges        │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │      Adaptive Feedback Service                                 │     │
│  │  Rule-based re-ranking triggered by quiz/completion events     │     │
│  └─────────────────────────────────────────────────────────────┘     │
└──────────────────────────────┬────────────────────────────────────────┘
                                ▼
                  ┌───────────────────────────┐
                  │  Firebase Firestore         │
                  │  - learners                 │
                  │  - roles                    │
                  │  - skills                   │
                  │  - prerequisites (edges)    │
                  │  - resources/courses        │
                  │  - roadmaps (per learner)    │
                  │  - feedback_events           │
                  └───────────────────────────┘
```

This is a direct 1:1 mapping to HCL's own architecture diagram: Conversational Interface + Dashboard (frontend) → Learner Profiling Engine + Recommendation & Path Engine (backend core) → Explainable AI (XAI) layer, with an Adaptive Feedback Loop closing the cycle.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React + Tailwind CSS | Fast to build, deploys instantly to Vercel, good default component ecosystem |
| Backend | FastAPI (Python) | Already familiar to the team; async-friendly; auto-generates OpenAPI docs for free |
| AI/ML — embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Small, fast, CPU-friendly, no GPU needed — runs fine on free-tier hosting |
| AI/ML — goal parsing & explanation phrasing | LLM API (Claude or OpenAI, free/low-cost tier) with structured-output prompting | Far more reliable than a custom-trained NLP model in a 6-day window |
| Graph logic | `networkx` | Battle-tested DAG construction + topological sort, minimal code |
| Database | Firebase Firestore | Team already has experience; no server ops; generous free tier |
| Auth (minimal) | Firebase Auth (email link or anonymous) | Fast to wire up, avoids building auth from scratch |
| Deployment — frontend | Vercel | Zero-config Next.js deploys |
| Deployment — backend | Render or Railway (free tier) | Simple FastAPI deploys, HTTPS out of the box |
| Version control | GitHub (public/access-shared repo, required by HCL) | — |

---

## 3. API Specification

Base URL: `/api/v1`

### `POST /profile`
Create/update a learner profile.
```json
// Request
{ "learner_id": "string", "current_skills": ["Python", "HTML"], "name": "string" }
// Response
{ "learner_id": "string", "current_skills": [...], "updated_at": "iso8601" }
```

### `POST /goal`
Parse a free-text goal into structured target role + skills.
```json
// Request
{ "learner_id": "string", "goal_text": "I want to become a backend developer" }
// Response
{ "target_role": "Backend Developer", "target_skills": ["Python (advanced)", "REST APIs", "SQL", "..."] }
```

### `POST /recommend`
Run the full pipeline: gap analysis → path generation → attach explanations.
```json
// Request
{ "learner_id": "string" }
// Response
{
  "roadmap": [
    {
      "step": 1,
      "skill": "Python (advanced)",
      "resource": { "title": "...", "url": "..." },
      "type": "course",
      "explanation": "Recommended because ...",
      "status": "not_started"
    }
  ],
  "gap_summary": { "missing_skills": [...], "matched_skills": [...] }
}
```

### `GET /roadmap/{learner_id}`
Fetch the learner's current roadmap + progress state (for dashboard render).

### `POST /feedback`
Submit a completion or quiz score; triggers adaptive re-ranking.
```json
// Request
{ "learner_id": "string", "step_id": "string", "event": "quiz_score", "value": 40 }
// Response  → updated roadmap (same shape as /recommend)
```

### `GET /explain/{learner_id}/{step_id}`
On-demand, re-generated explanation for a single roadmap item (powers "Why this?" UI + optional chat Q&A).

---

## 4. Data Models (Firestore collections)

**`skills`**
```
{ skill_id, name, description, embedding_vector (cached) }
```

**`roles`**
```
{ role_id, name, required_skills: [skill_id, ...] }
```

**`prerequisites`**  (edge list for the DAG)
```
{ from_skill_id, to_skill_id }   // from_skill_id must be learned before to_skill_id
```

**`resources`**
```
{ resource_id, skill_id, title, url, type: "course"|"project"|"assessment" }
```

**`learners`**
```
{ learner_id, name, current_skills: [skill_id, ...], target_role_id, created_at }
```

**`roadmaps`**
```
{ learner_id, steps: [ { step_id, skill_id, resource_id, order, status, explanation } ], updated_at }
```

**`feedback_events`**
```
{ learner_id, step_id, event_type, value, timestamp }
```

---

## 5. AI/ML Pipeline — Step by Step

### 5.1 Goal Extraction & NLP Parsing
- Input: free-text goal.
- Method: single LLM call with a system prompt instructing it to return **only** JSON matching `{"target_role": str, "target_skills": [str]}`, constrained to the pre-defined `roles`/`skills` taxonomy (pass the taxonomy in the prompt so the model maps to real entries, not invented ones).
- Fallback: if the parsed role doesn't match any taxonomy entry, do a fuzzy string match against known role names before failing.

### 5.2 Skill Gap Analysis (vector similarity)
- Precompute an embedding for every skill in the taxonomy (`sentence-transformers`), cache in Firestore.
- Learner's current-skill set → average or set of embeddings.
- Target role's required-skill set → set of embeddings.
- For each required skill, compute cosine similarity against the learner's closest current skill.
- Similarity below a threshold (e.g., 0.6) = "gap"; above = "matched" (learner already has an equivalent skill).
- Output: `matched_skills`, `missing_skills`, each with its similarity score (this score is also reused by the XAI engine).

### 5.3 Topological Sequence Generation
- Build a `networkx.DiGraph` from the `prerequisites` edge list, restricted to the `missing_skills` subgraph plus any prerequisite chain leading into it (even non-gap skills, if they're prerequisites of a gap skill, get inserted as steps).
- Run `nx.topological_sort()` to get a valid learning order.
- Attach one resource per skill from the `resources` collection (prefer `type: course` first pass; MVP can insert a `project` checkpoint after every 2–3 skills for realism).

### 5.4 Explainability Engine
- For each roadmap step, assemble a small structured fact set: gap similarity score, direct prerequisite(s) in the graph, and the target role it serves.
- Feed that fact set into a short LLM prompt: *"Given these facts, write one sentence explaining why this step is recommended, in plain language for a student."*
- This keeps explanations grounded in real computed data (not hallucinated) while still reading naturally — this is the "translate embedding distances and prerequisite dependencies into plain language" requirement, done literally.

### 5.5 Adaptive Re-Ranking (rule-based)
- Triggered by `POST /feedback`.
- Rules (document these explicitly in the solution doc as a deliberate, honest choice over full RL):
  - `quiz_score < 50` on a step → insert a "remedial" resource for that skill immediately after the current step, before continuing.
  - `quiz_score >= 90` on a step → mark any directly-dependent easier step as optionally skippable.
  - `event = "completed"` → mark step done, recompute `missing_skills` (in case the learner over-delivered and closed a gap early), re-run topological sort on the remaining subgraph.

---

## 6. Request Flow (Sequence) — `/recommend`

```
Frontend → POST /goal (once, at onboarding)
Backend  → LLM call → structured target_role + target_skills → save to learner doc

Frontend → POST /recommend
Backend  → load learner.current_skills + learner.target_role
         → Skill Gap Analysis (embeddings + cosine similarity)
         → Path Generation (networkx DAG + topological sort over gap + prerequisite skills)
         → attach resources per step
         → Explainability Engine generates explanation per step (LLM, grounded in gap+graph facts)
         → save roadmap to Firestore
         → return roadmap JSON
Frontend → renders roadmap timeline + dashboard
```

---

## 7. Repository Structure

```
/backend
  /app
    /api          -> route handlers (profile, goal, recommend, feedback, explain)
    /services      -> goal_parser.py, gap_analysis.py, path_generator.py, xai.py, feedback.py
    /models        -> Pydantic schemas
    /data          -> seed_skills.json, seed_roles.json, seed_prerequisites.json, seed_resources.json
    main.py
  requirements.txt
  README.md
/frontend
  /app or /pages
  /components      -> GoalInput, Dashboard, RoadmapTimeline, ExplainPanel, SkillGraph
  package.json
  README.md
/docs
  PRD.md
  context.md
  architecture.md
README.md            -> top-level: setup + run instructions for both frontend and backend
```

---

## 8. Deployment Architecture

- Backend deployed to Render/Railway as a FastAPI service, environment variables for LLM API key + Firebase service account.
- Frontend deployed to Vercel, environment variable pointing at the backend's public URL.
- Firestore used directly from the backend via the Firebase Admin SDK (never expose Firestore credentials to the frontend).
- Seed data (`/backend/app/data/*.json`) loaded into Firestore via a one-time setup script (`scripts/seed_db.py`), run once at deployment/setup, documented in the README as required by HCL's fallback local-setup deliverable.

---

## 9. Error Handling & Robustness (light-touch, hackathon-appropriate)

- LLM calls: wrap in try/except with a rule-based fallback (simple keyword matching against role names) if the API call fails or returns malformed JSON — this protects the live demo from an API outage.
- Empty/unknown skills in profile: default to "no prior skills," don't crash the gap analysis.
- Missing prerequisite data for an edge case skill: treat it as having no prerequisites rather than failing the topological sort.

---

## 10. Testing Strategy (given the timeline)

- Manually validate the exact worked example in `context.md` §6 end-to-end before touching UI polish.
- One or two backend unit tests on `gap_analysis.py` and `path_generator.py` (pure functions, easy to test, and demonstrates code quality to judges reading the repo).
- No time budget for full test coverage — prioritize the working demo path.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM API costs/rate limits during live judging | Cache goal-parsing and explanation results per learner; use a cheap/free-tier model |
| Small curated dataset looks thin to judges | Pick one strong domain, populate it fully (§7 in context.md), and be upfront in the solution doc that this is a deliberate MVP scoping decision |
| Adaptive loop looks "fake" if rules are too simple | Document the rule logic explicitly and honestly in the solution PDF — judges reward honest engineering framing over overclaiming RL |
| Deployment breaks right before the deadline | Deploy early (by day 4), keep local setup instructions in the README as the required fallback |
