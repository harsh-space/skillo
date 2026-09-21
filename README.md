# Skillo AI  ![Hackathon Project](https://img.shields.io/badge/type-Hackathon%20Project-orange) 

## An intelligent career learning assistant that maps your current skills, generates ordered prerequisite roadmaps, and adapts in real time based on your progress

> Static learning roadmaps only show you a fixed list of topics. Skillo AI identifies what you already know, pinpoints what you are missing, arranges your learning path in strict prerequisite order, and dynamically updates your roadmap when you take quizzes.

> [!IMPORTANT]
> **Live Web App & Interactive Demo**: [skillo-frontend-amber.vercel.app](https://skillo-frontend-amber.vercel.app/)

---

## What Is Skillo AI?

When learning to become a software engineer or switching careers, it is easy to get overwhelmed by thousands of courses and tutorials without knowing where to begin or what to study first. Generic roadmaps assume everyone starts from scratch, forcing experienced learners to repeat familiar concepts while leaving beginners stuck on advanced topics without foundational prerequisites.

**Skillo AI** solves this by acting as a smart, personalized career learning guide. You tell it your current skills and type your career goal in natural language (for example: *"I know HTML, CSS, and basic Python and want to become a backend developer with databases and APIs"*), and the system:

1. **Understands Your Goal** — Reads your unformatted sentence and identifies your target career role using semantic similarity and keyword analysis.
2. **Finds Your Exact Skill Gaps** — Compares what you already know against the target role's requirements, distinguishing skill depth (such as basic vs advanced levels) so mastered skills are acknowledged and missing ones are highlighted.
3. **Builds an Ordered Learning Path** — Uses a prerequisite dependency graph (Directed Acyclic Graph) to sequence topics so you always learn foundations before advanced concepts.
4. **Explains Every Step (Explainable AI)** — Provides plain-language explanations for each milestone, explaining what previous skills it builds on and what future topics it unlocks.
5. **Adapts to Quiz Performance in Real Time** — Evaluates your understanding after each module and dynamically modifies your active roadmap:
   - **Score < 50%**: Automatically injects a targeted refresher lesson immediately after the current step.
   - **Score ≥ 90%**: Marks downstream dependent topics as skippable to accelerate your learning.
   - **Score 50% – 89%**: Marks the step as completed and smoothly advances your progress.
6. **Manages Multiple Career Roadmaps** — Lets you explore different career trajectories, switch between past roadmaps with a history drawer, or delete roadmaps with live synchronization.

---

## Why It Matters: The Problem vs The Solution

| The Traditional Problem | How Skillo AI Solves It |
|---|---|
| **Keyword search overload**: Searching online returns isolated tools without explaining what prerequisites you need first. | **Prerequisite Graph Engine**: Automatically discovers unstated foundational requirements (e.g. Linux CLI before Docker) and places them in logical order. |
| **One-size-fits-all roadmaps**: Generic roadmaps ignore what you already know, wasting your time on mastered topics. | **Skill Gap Analysis**: Compares your stated background against target requirements and creates a custom curriculum containing only your actual gaps. |
| **Black-box course recommendations**: Platforms recommend courses without explaining why a topic is placed at a specific point. | **Grounded Mentor Explanations**: Inspects the dependency graph to provide transparent explanations of why each step is recommended and what it unlocks. |
| **Rigid, non-adaptive curricula**: If you fail a quiz, traditional platforms mark it failed without helping you fix the underlying gap. | **Real-Time Adaptive Feedback**: Dynamically injects targeted refresher modules or fast-tracks steps based on your live assessment scores. |

---

## Key Features

- **Natural Language Career Goal Input** — Express your goals in plain sentences. No rigid drop-downs or predefined forms required.
- **Semantic Skill Gap Detection** — Accurately identifies missing competencies while recognizing what you have already mastered.
- **Graph-Based Prerequisite Ordering** — Built on Directed Acyclic Graph (DAG) algorithms to guarantee dependency-respecting learning sequences with zero circular loops.
- **Fact-Grounded Explanations** — Transparent "Why this recommendation?" rationales synthesized directly from graph dependency relationships.
- **Interactive Quizzes with Live Adaptation** — Test your knowledge on each milestone and watch the roadmap update its structure immediately.
- **Multi-Roadmap History Drawer** — Easily browse, activate, or remove your previous learning paths from a sliding sidebar.
- **Secure Authentication & Profiles** — User accounts with password hashing, persistent learner sessions, and ownership verification.
- **Dual-Tier Data Storage** — Works out-of-the-box with Google Cloud Firestore or seamless zero-config local storage when offline.
- **Modern Glassmorphic UI** — Fast, responsive Next.js interface with progress tracking, visual timelines, and interactive flyouts.

---

## Supported Career Roles

Skillo AI comes pre-loaded with curated competencies across 6 primary engineering tracks:

| Career Track | Core Focus & Covered Competencies |
|---|---|
| **Frontend Developer** | HTML, CSS, JavaScript, TypeScript, React, Next.js, Web Performance |
| **Backend Developer** | Python, SQL & Relational Databases, REST APIs, Authentication & JWT, Docker |
| **Full Stack Developer** | Complete frontend UI engineering and backend API & database architecture |
| **Machine Learning Engineer** | Python, Data Analysis & Pandas, Machine Learning, Deep Learning & PyTorch |
| **AI Engineer** | Python, ML & Deep Learning, LLMs & Prompt Engineering, Vector Databases & RAG |
| **DevOps Engineer** | Linux CLI, Git & GitHub, Docker, Kubernetes, CI/CD Pipelines, Cloud Infrastructure |

*The underlying taxonomy includes **36 skills**, **6 roles**, **29 prerequisite dependency relationships**, and **49 curated learning resources**.*

---

## How It Works Under the Hood

<p align="center">
  <img src="docs/career_ai_pipeline_flow.png" width="650" alt="Skillo AI Pipeline Flow"/>
  <br/>
  <em>Figure 1: Core AI pipeline and processing flow</em>
</p>

1. **Goal Parsing**: Converts free-text sentences into structured roles by calculating character-level n-gram term frequency and cosine similarity against role descriptions and aliases.
2. **Gap Analysis**: Compares the learner's existing skills against the role's required skills using sublinear TF-IDF vectors, ensuring basic and advanced skills are distinguished accurately.
3. **Graph Generation**: Constructs a directed dependency graph, finds all direct and indirect prerequisites, and applies topological sorting so that every skill appears after its dependencies.
4. **Explainable AI (XAI)**: Examines upstream dependencies and downstream milestones in the graph to generate concise, trustworthy explanations for every step.
5. **Adaptive Feedback Loop**: When a learner takes a quiz, the feedback service processes the score and dynamically mutates the roadmap in memory and database storage.

---

## System Architecture

The application is structured into two decoupled tiers:

### 1. Backend Service (FastAPI & Python)
- **API Endpoints**: RESTful routes for authentication, profile management, goal parsing, recommendations, explanations, quizzes, and roadmap history.
- **Graph & Gap Engine**: NetworkX DAG dependency solver and scikit-learn vector matching.
- **Persistence Layer**: Unified database client supporting Google Cloud Firestore and local JSON file storage.

### 2. Frontend Application (Next.js & React)
- **Onboarding Wizard**: Step-by-step goal entry and interactive skill selector.
- **Dashboard & Timeline**: Real-time progress indicators, milestone accordion cards, and collapsible flyouts for gap breakdown and mastered skills.
- **Contextual Side Panels**: Non-intrusive explanation card and sliding multi-roadmap history drawer.

### Architecture & Telemetry Flow

<p align="center">
  <img src="docs/career_ai_full_detail_flow.png" width="700" alt="Skillo AI Detailed System Flow"/>
  <br/>
  <em>Figure 2: End-to-end multi-layer telemetry and system architecture</em>
</p>

---

## Step-by-Step Installation & Setup

### Prerequisites
- **Python 3.10+** (Python 3.11+ recommended)
- **Node.js 18+** and **npm**

---

### Method 1: Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/harsh-space/skillo.git
cd skillo
```

#### 2. Configure and Start Backend
```bash
# Create and activate a virtual environment
python -m venv venv

# On Windows (PowerShell):
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# (Optional) Set up cloud credentials in .env:
# GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-key.json
# GEMINI_API_KEY=your_gemini_api_key_here

# Seed initial taxonomy data (into Firestore or local JSON)
python scripts/seed_db.py

# Run backend automated tests
pytest backend/tests/test_backend.py -v

# Start FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend server runs at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

#### 3. Configure and Start Frontend
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Method 2: Docker Container

You can run the entire backend in a standalone Docker container:
```bash
docker build -t skillo-ai .
docker run -p 8000:8000 skillo-ai
```

---

## Step-by-Step Validation Walkthrough

To experience the core features and adaptive feedback loop:

1. **Sign Up / Log In**: Create an account or log in on the start screen.
2. **Select Initial Skills**: Choose `HTML`, `CSS`, and `Python (basic)` in the onboarding skill picker.
3. **Enter Career Goal**: Type *"I want to become a backend developer"* and submit.
4. **Inspect Generated Roadmap**: Skillo AI extracts the `Backend Developer` role and orders your missing competencies in prerequisite order:
   `Python (advanced) → SQL & Relational Databases → REST APIs → Git & GitHub → Authentication & JWT → Docker & Containers`
5. **View Step Explanation**: Click **"Why this recommendation?"** on the `REST APIs` step:
   > *"Building on your Python (advanced) and SQL foundations, mastering REST APIs enables you to expose backend data services required for your Backend Developer goal. This unlocks subsequent modules in Authentication & JWT and containerized deployment with Docker."*
6. **Trigger Adaptive Remedial Lesson**:
   - Open the quiz on Step 1 (`Python (advanced)`).
   - Select **Score 40% (Fail)** and submit.
   - A targeted **Remedial Refresher** module is dynamically inserted immediately after Step 1.
7. **Test Roadmap History & Deletion**:
   - Open the **History** drawer from the top bar to see your active and past roadmaps.
   - Delete a roadmap to confirm it is cleanly removed from both local state and database records.

---

## Project Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes (auth, profile, goal, recommend, feedback, explain, taxonomy)
│   │   ├── services/     # Core logic (db, goal_parser, gap_analysis, path_generator, xai, feedback)
│   │   ├── models/       # Pydantic data schemas and response models
│   │   ├── data/         # Seed taxonomy datasets and local storage fallback
│   │   └── main.py       # FastAPI application entry point and middleware
│   ├── tests/            # Automated test suite (pytest)
│   └── requirements.txt  # Python package specifications
├── frontend/
│   ├── app/              # Next.js App Router (pages, layout, global styles)
│   ├── components/       # React UI components (GoalInput, Dashboard, RoadmapTimeline, QuizModal, HistoryDrawer)
│   ├── lib/              # API client and TypeScript interface definitions
│   └── package.json      # Node.js dependencies and scripts
├── docs/                 # System architecture diagrams and reference documentation
├── scripts/
│   └── seed_db.py        # Database seeding utility
├── Dockerfile            # Production container configuration
└── README.md             # Project documentation
```

---

## Current Scope & Phase 2 Roadmap

### Phase 1 — What Is Live (Completed)

The current deployed version establishes the full end-to-end product foundation:

- **Curated Engineering Taxonomy**: 6 core tracks (Frontend, Backend, Full Stack, ML, AI, DevOps) with 36 skills, 29 prerequisite edges, and 49 curated learning resources.
- **Semantic Goal Classification**: Character n-gram TF-IDF vectorization with alias boosts maps natural-language goals to target roles with sub-5ms latency. Gemini Flash / OpenAI are available as fallback classifiers for edge cases.
- **Skill Gap Detection**: Cosine similarity against skill embeddings distinguishes mastered, partial, and missing competencies including depth differentiation (e.g. basic vs advanced Python).
- **Graph-Based Prerequisite Ordering**: NetworkX Directed Acyclic Graph topological sort guarantees zero cyclic dependencies across all 6 role roadmaps.
- **Fact-Grounded Explainable AI**: Every roadmap step includes a dependency-grounded rationale synthesized from graph relationships.
- **Real-Time Adaptive Feedback Loop**: Quiz scores dynamically inject remedial refreshers (score < 50%) or fast-track downstream steps (score ≥ 90%).
- **Multi-Roadmap History with Deletion**: Learners can manage multiple roadmap histories with persistent storage.

**Phase 1 Baseline Metrics** (v1.1 release gate, from `evaluation/results/v1.1_baseline_results.json`):

<div align="center">

| Metric | Result |
| :--- | :--- |
| Goal Classification Accuracy | 76.7% (23/30 test cases) |
| Goal Classification Latency (P50) | 4.6 ms |
| Skill Gap Precision / Recall / F1 | 1.00 / 0.60 / 0.75 |
| Roadmap DAG Invariant Violations | 0 (across all 6 roles) |
| Roadmap Generation Latency (P50) | 7.0 ms |

</div>


---

### Phase 2 — Planned Improvements

Phase 2 upgrades the algorithmic intelligence of the system while maintaining zero-hallucination guarantees and strict roadmap safety. Full technical specifications are in [`docs/v2-planning/`](docs/v2-planning/).

#### 1. Dense Semantic Goal Classifier
Replace TF-IDF n-gram matching with a lightweight **Sentence Transformer model** (`all-MiniLM-L6-v2`) for intent classification. Precomputed role embedding vectors deliver deep contextual understanding of synonym-heavy and multi-clause goals.
- **Target**: Goal classification accuracy ≥ 90% (up from 76.7%).
- **Constraint**: Latency budget remains < 25ms on CPU.

#### 2. Hybrid Skill Gap Matching
Introduce a **3-tier matching pipeline** (Exact Token → Dense Cosine Similarity → Calibrated Partial Match) to accurately resolve skill synonyms and adjacent competencies that exact string matching misses.
- **Target**: Skill Gap F1 ≥ 0.90, Recall ≥ 0.90 (up from F1: 0.75, Recall: 0.60).

#### 3. Constrained Multi-Factor Resource Ranker
Replace static skill-to-resource dictionary lookup with a **scored ranking algorithm** that weights semantic relevance, difficulty alignment to the learner's level, and resource quality — while strictly drawing only from the verified seed catalog.
- **Target**: Zero hallucinated or invalid resource URLs (maintained at 100%).

#### 4. Grounded AI Narrative Synthesis
Define a **strict LLM boundary**: the prerequisite graph, skill node ordering, and resource assignments are computed deterministically. The LLM is only invoked to synthesize motivational coaching descriptions and practical project suggestions on top of the fixed structure.
- **Target**: 0% ungrounded skills or hallucinated nodes in any generated roadmap.

See [`docs/v2-planning/success-criteria.md`](docs/v2-planning/success-criteria.md) for the full quantitative gate checklist required before Phase 2 ships.
