# Skillo AI — Backend Service

FastAPI-powered intelligent learning path recommender engine integrating sentence-transformer embedding gap analysis, NetworkX DAG topological sorting, grounded Explainable AI (XAI), Google Cloud Firestore live persistence, and rule-based adaptive feedback loops.

---

## 🛠️ Architecture & Core Services

- **Learner Profiling & Database Service** (`/app/api/profile.py`, `/app/services/db.py`):
  Manages dynamic learner profiles, baseline competencies, and career goals with live Google Cloud Firestore and zero-config local JSON storage fallback.
- **Goal Extraction & Intent Parsing** (`/app/services/goal_parser.py`):
  Translates natural language learning objectives into structured target roles and competencies using Gemini Flash with dense semantic vector fallback.
- **Skill Gap Analysis** (`/app/services/gap_analysis.py`):
  Computes cosine similarity vectors between learner competencies and target role requirements using `sentence-transformers` (`all-MiniLM-L6-v2`).
- **DAG Path Generation & Prerequisite Closure** (`/app/services/path_generator.py`):
  Constructs directed graphs with `networkx` to calculate prerequisite closures and non-inflated topological sequences.
- **Grounded Explainability (XAI)** (`/app/services/xai.py`):
  Generates fact-grounded natural-language justifications rooted in graph dependencies and similarity metrics.
- **Adaptive Feedback Engine** (`/app/services/feedback.py`):
  Executes rule-based path adaptations upon receiving assessment scores (remedial insertion vs fast-track) or milestone completions.

---

## 🚀 Quickstart & Local Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Firebase Firestore (Optional)
Place your Firebase Service Account JSON key in `backend/firebase-key.json` or set `GOOGLE_APPLICATION_CREDENTIALS` in your `.env` file.

### 3. Seed Database (Firestore or Local JSON)
```bash
python ../scripts/seed_db.py
```

### 4. Run Test Suite
```bash
pytest tests/test_backend.py -v
```

### 5. Start Backend Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
