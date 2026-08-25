# Pathfinder AI — Backend Service

FastAPI-powered intelligent learning path recommender engine integrating sentence-transformer embedding gap analysis, NetworkX DAG topological sorting, grounded Explainable AI (XAI), and rule-based adaptive feedback loops.

---

## 🛠️ Architecture & Core Services

- **Learner Profiling Service** (`/app/api/profile.py`, `/app/services/db.py`):
  Manages dynamic learner profiles, baseline competencies, and career goals with Firebase Firestore & zero-config local storage.
- **Goal Extraction & Intent Parsing** (`/app/services/goal_parser.py`):
  Translates natural language learning objectives into structured target roles and competencies constrained strictly to the domain taxonomy.
- **Skill Gap Analysis** (`/app/services/gap_analysis.py`):
  Computes cosine similarity vectors between learner competencies and target role requirements using `sentence-transformers` (`all-MiniLM-L6-v2`).
- **DAG Path Generation & Prerequisite Closure** (`/app/services/path_generator.py`):
  Constructs directed graphs with `networkx` to calculate prerequisite closures and topological sequences.
- **Grounded Explainability (XAI)** (`/app/services/xai.py`):
  Generates fact-grounded natural-language justifications rooted in graph dependencies and similarity metrics.
- **Adaptive Feedback Engine** (`/app/services/feedback.py`):
  Executes rule-based path adaptations upon receiving assessment scores or milestone completions.

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Seed Database
```bash
python ../scripts/seed_db.py
```

### 3. Run Test Suite
```bash
pytest tests/test_backend.py -v
```

### 4. Start Backend Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
