# Skillo AI — AI-Powered Personalized Learning Path Recommender

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Sentence-Transformers](https://img.shields.io/badge/Sentence--Transformers-all--MiniLM--L6--v2-orange.svg)](https://www.sbert.net/)
[![NetworkX](https://img.shields.io/badge/NetworkX-DAG_Topological_Sort-blueviolet.svg)](https://networkx.org/)

---

## 📌 Executive Summary

**Skillo AI** is an intelligent career learning assistant that bridges the gap between high-level career aspirations and actionable, prerequisite-respecting study plans. 

Given a learner's current competencies and a natural-language goal (e.g., *"I know HTML, CSS, and basic Python and want to become a backend developer"*), Skillo AI:
1. **Parses the goal** into structured target roles and competencies via taxonomy-constrained intent extraction.
2. **Computes skill gaps** using cosine similarity over `sentence-transformers` (`all-MiniLM-L6-v2`) embeddings.
3. **Constructs a Directed Acyclic Graph (DAG)** and computes a prerequisite closure, outputting a strictly valid topological sequence of courses and projects.
4. **Provides grounded Explainable AI (XAI)** justifications for every recommended milestone without hallucination.
5. **Adapts dynamically** in real time via rule-based feedback loops when quiz scores or completion events arrive.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 14 / React)                 │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │   Onboarding Screen     │          │         Dashboard           │  │
│  │  - Skill selector chips │          │  - Roadmap timeline & cards │  │
│  │  - Free-text goal input │          │  - "Why this?" XAI Drawer   │  │
│  │  - Instant suggestions  │          │  - Quiz simulation & status │  │
│  └────────────┬────────────┘          └──────────────┬──────────────┘  │
└───────────────┼──────────────────────────────────────┼─────────────────┘
                │   REST API (/api/v1)                 │
                ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI + Python)                    │
│                                                                        │
│  ┌───────────────────────┐          ┌───────────────────────────────┐  │
│  │  Goal Parser Service  │          │  Learner Profile Service      │  │
│  │  (LLM + Taxonomy Constrained)    │  (CRUD + Profile DB)          │  │
│  └───────────┬───────────┘          └───────────────┬───────────────┘  │
│              │                                      │                  │
│              ▼                                      ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Recommendation & Path Generation Engine             │  │
│  │  1. Skill Gap Analysis: sentence-transformers (all-MiniLM-L6-v2) │  │
│  │     cosine similarity vs target skill embedding matrix (<0.60)   │  │
│  │  2. Path Generator: NetworkX DiGraph + DAG topological sort      │  │
│  │     with prerequisite closure resolution & resource attaching    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Explainable AI (XAI) Grounding Engine               │  │
│  │  Fact-grounded rationale synthesis (prereqs, role goal, gap score)│ │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Adaptive Feedback & Re-Ranking Service              │  │
│  │  Rule-based path adaptation (<50% remedial, >=90% skip, complete)│ │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │    Database Storage Layer     │
                      │  Firestore SDK / Local DB     │
                      │  - skills, roles, prereqs     │
                      │  - resources, learners        │
                      │  - roadmaps, feedback_events  │
                      └───────────────────────────────┘
```

---

## 🎯 Alignment with HCLTech Evaluation Criteria

| Criterion | Weight | How Skillo AI Fulfills It |
|---|---|---|
| **Functionality & Feature Completeness** | **25%** | Complete end-to-end flow from natural-language goal entry, embedding gap analysis, topological DAG roadmap generation, interactive "Why this?" XAI, and quiz score adaptive re-ranking. |
| **Problem Understanding & Solution Design** | **20%** | Faithful implementation of HCL's required system modules; strict adherence to single-domain scoping with realistic, curated industry skills and prerequisite chains. |
| **AI/ML Implementation** | **20%** | Functional ML integration: `sentence-transformers` embedding cosine distance matrix for gap vectors, NetworkX topological sorting for DAG constraints, and grounded XAI synthesis. |
| **Innovation & Creativity** | **15%** | Zero-latency interactive feedback simulator, prerequisite closure graph algorithms, and dual-mode database layer supporting cloud Firestore & zero-config local persistence. |
| **User Experience & Interface** | **10%** | Modern dark-mode glassmorphic interface, interactive SVG competency visualizer, one-click worked scenario benchmark buttons, and responsive timeline layout. |
| **Performance & Code Quality** | **10%** | Clean modular architecture (`/backend/app/api`, `/backend/app/services`, `/backend/app/models`), fully typed Pydantic schemas, and automated test suite (`pytest`). |

---

## 🚀 Step-by-Step Setup & Execution Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### Option A: Standard Local Setup (Recommended)

#### 1. Clone & Scaffold
```bash
git clone <repo-url>
cd hcl-challenge
```

#### 2. Backend Setup
```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Seed the initial database (34 skills, 5 roles, 35 DAG edges, 43 resources)
python scripts/seed_db.py

# 3. Run backend automated test suite
pytest backend/tests/test_backend.py -v

# 4. Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
FastAPI server runs at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

#### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Docker Container Deployment

```bash
docker build -t pathfinder-ai .
docker run -p 8000:8000 pathfinder-ai
```

---

## 🧪 Validating the Worked Example Scenario

The application includes built-in one-click presets to reproduce the benchmark scenario in `context.md` §6:

1. **Onboarding**: Select **Persona A (Alex)** (`HTML, CSS, Python (basic)`) with goal *"I want to become a backend developer"*.
2. **Goal Parsing**: Extracted target role is `Backend Developer` with target skills (`Python (advanced), SQL, REST APIs, Authentication, Git, Docker`).
3. **Gap Analysis**: Identifies missing competencies and flags `Python (advanced)` as a critical gap.
4. **Roadmap Generation**: Strict DAG sequence rendered:
   $$\text{Python (advanced)} \longrightarrow \text{SQL} \longrightarrow \text{REST APIs} \longrightarrow \text{Git} \longrightarrow \text{Authentication} \longrightarrow \text{Docker}$$
5. **Grounded XAI**: Click **"Why this recommendation?"** on the `REST APIs` step:
   > *"Recommended after Python (advanced) and before Authentication & JWT — REST APIs is a direct prerequisite for building the Authentication & JWT module in your target role, and closes a skill gap identified from your goal."*
6. **Adaptive Re-Ranking**: Click **"Test Quiz & Adaptive Signal"** on Step 1 (`Python (advanced)`), pick **Score 40% (Fail)**:
   > A **Remedial Refresher** step is dynamically injected immediately after Step 1 before advancing downstream.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (profile, goal, recommend, feedback, explain, taxonomy)
│   │   ├── services/     # Core engines (db, goal_parser, gap_analysis, path_generator, xai, feedback)
│   │   ├── models/       # Pydantic schemas (requests & responses)
│   │   ├── data/         # Seed datasets (seed_skills, seed_roles, seed_prerequisites, seed_resources)
│   │   └── main.py       # FastAPI application & middleware
│   ├── tests/            # Automated test suite (pytest)
│   ├── requirements.txt  # Python package specifications
│   └── README.md
├── frontend/
│   ├── app/              # Next.js 14 App router (page.tsx, layout.tsx, globals.css)
│   ├── components/       # UI components (GoalInput, Dashboard, RoadmapTimeline, QuizModal, XaiDrawer, SkillGraph)
│   ├── lib/              # API client and TypeScript interfaces
│   ├── package.json      # Node.js dependencies
│   └── README.md
├── docs/
│   ├── PRD.md            # Official HCLTech requirements & judging criteria
│   ├── context.md        # MVP scope, personas, and worked validation scenario
│   └── architecture.md   # Technical architecture & API specification
├── scripts/
│   └── seed_db.py        # Database seeding utility
├── Dockerfile            # Production container configuration
├── vercel.json           # Frontend Vercel configuration
└── README.md             # Top-level documentation
```

---

## 📄 Project Info
Developed by the **Skillo AI Team**.
