# Skillo AI (V1.1) — Under The Hood Technical Breakdown

This document provides a transparent, comprehensive technical explanation of **how every subsystem in Skillo AI works under the hood**, detailing the exact algorithms executed, ML vs. deterministic fallbacks, graph operations, database persistence, and frontend visual animation architecture.

---

## 🧭 Executive Summary of the Pipeline

```
Raw Free-Text Goal ──────► [ 1. Intent Extraction ] ─────► Target Role & Skills
                                │ (Character n-gram TF-IDF Vectorizer + Cosine Sim / LLM Fallback)
Learner Stated Skills ───► [ 2. Skill Gap Engine ] ──────► Matched vs. Missing Gap Vectors
                                │ (Character n-gram TF-IDF Cosine Similarity, tau = 0.60)
Taxonomy DAG Edges ──────► [ 3. Path Generation ] ──────► Topologically Ordered Sequence
                                │ (NetworkX DAG Closure + Topological Sort)
Upstream/Downstream Facts► [ 4. Explainability (XAI) ] ──► Fact-Grounded Justification
                                │ (Graph Metadata Template / Gemini LLM Synthesis)
Feedback Events ─────────► [ 5. Adaptive Loop ] ────────► Dynamic Path Mutation
                                │ (Heuristic re-ranking rules: Remedial/Skip/Advance)
Database Layer ──────────► [ 6. Persistence Engine ] ───► Live Firestore / JSON Storage
                                │ (Lazy credential load & zero-config fallback)
Frontend UX ─────────────► [ 7. Visual Carousel & Orbit]► 2-Step Wizard & Tech Constellation
                                │ (Synchronized slide track + CSS orbital physics)
```

---

## 🔍 Deep-Dive: Component by Component

### 1. Goal Extraction & Intent Parsing (`goal_parser.py`)

* **What it does:** Translates unstructured natural language career goals (e.g. *"I want to build backend systems, databases, caching and REST APIs"*) into a discrete target role (`role_backend_developer`) and required skill competencies from the taxonomy.
* **Exact Execution Hierarchy:**
  1. **Primary Route — Character n-gram TF-IDF Semantic Matching (`_semantic_embed_parse`):**
     * Uses `TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)` fitted on the curated taxonomy corpus.
     * Constructs a rich contextual string for each candidate role:
       $$\text{Role Context} = \text{"Career Role: } R_{\text{name}} \text{. } R_{\text{desc}} \text{ Core competencies: } S_1, S_2, \dots S_n\text{"}$$
     * Transforms the user query and role representations into TF-IDF feature space.
     * Computes cosine similarity and applies exact role ($+0.40$) and alias ($+0.35$) boosts, clamped to $[0.0, 1.0]$.
  2. **LLM Route (Google GenAI SDK & OpenAI):**
     * When configured, issues structured JSON classification prompts to `gemini-flash-latest` or `gpt-3.5-turbo` for complex queries.
  3. **Token Overlap Fallback:**
     * If vectorizer is unavailable or similarity is non-positive, evaluates token overlap and returns a clear low-confidence indicator if unrecognized.

---

### 2. Skill Gap Vector Analysis (`gap_analysis.py`)

* **What it does:** Compares the learner's existing skills against the target role's required skills to compute matched competencies versus missing skill gap vectors.
* **Exact Mechanics (TF-IDF Feature Space):**
  1. **Feature Extraction:** Transforms skill names and rich contextual descriptions into sublinear character n-gram vectors.
  2. **Cosine Similarity Computation:**
     $$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
  3. **Threshold Decision ($\tau = 0.60$):**
     * $\max_{s \in \text{learner}}(\text{similarity}(r, s)) \ge 0.60 \implies$ **Matched Skill** (Learner already possesses this or an equivalent concept).
     * $\max_{s \in \text{learner}}(\text{similarity}(r, s)) < 0.60 \implies$ **Missing Skill** (Flagged as an active learning gap).
  4. **Natural Subword Differentiation:** Character n-gram embeddings naturally differentiate introductory vs. advanced domains (e.g., `Python (basic)` vs `Python (advanced)` scores sub-threshold similarity without manual constants).

---

### 3. Path Generation & Prerequisite Closure (`path_generator.py`)

* **What it does:** Takes the missing skill vector and builds a topologically ordered learning sequence that respects prerequisite constraints.
* **Exact Mechanics (Directed Acyclic Graph / DAG):**
  1. **Graph Instantiation:** Constructs a `networkx.DiGraph` from 29 directed prerequisite edges across 36 taxonomy skills.
  2. **Transitive Prerequisite Closure:**
     * For every identified missing skill $s$, computes all directed graph ancestors:
       $$\text{Ancestors}(s) = \{a \in V \mid a \leadsto s\}$$
     * If ancestor $a$ is missing from the learner's mastered set, it is automatically injected into the roadmap.
  3. **Topological Ordering:**
     * Runs `networkx.topological_sort(subgraph)` ensuring that for every edge $(u, v)$, skill $u$ strictly precedes skill $v$.
     * Raises an error if a cycle is introduced, preventing invalid roadmaps.
  4. **Resource Binding:** Binds each sorted node to curated learning resources (courses, documentation, project checkpoints) from the 49 verified resources.

---

### 4. Explainable AI (XAI) Engine (`xai.py`)

* **What it does:** Answers *"Why is this skill recommended at this exact step?"* with fact-grounded explanations.
* **Exact Mechanics (DAG Template Synthesis + Optional Gemini Grounding):**
  1. **Structural Fact Extraction:** Extracts 4 graph facts from the DAG roadmap:
     * **Upstream Prerequisites:** Completed foundation nodes (e.g. `Python (basic)`, `SQL & Relational Databases`).
     * **Downstream Milestones Unlocked:** Subsequent skills enabled by this step (e.g. `Authentication & JWT`, `Docker & Containers`).
     * **Target Role:** Stated career objective (e.g. `Backend Developer`).
     * **Remedial Flag:** Identifies whether the node is a standard progression or an active remedial insertion.
  2. **Grounded Synthesis:**
     * `_template_grounded_explanation` synthesizes the rationale directly from graph edge relationships.
     * If `GEMINI_API_KEY` is provided, optionally enriches the phrasing with `gemini-flash-latest` under strict zero-hallucination prompt constraints.

---

### 5. Adaptive Feedback Loop (`feedback.py`)

* **What it does:** Dynamically mutates the learning path when assessment results or completions occur.
* **Exact Mechanics (Rule-Based Adaptive Engine):**
  * **Rule 1 (Quiz Score $< 50\%$):** Intercepts low comprehension, fetches a `is_remedial: true` refresher module from taxonomy, and injects a remedial step at $\text{index} + 1$.
  * **Rule 2 (Quiz Score $\ge 90\%$):** Flags downstream dependent steps as accelerated/skippable.
  * **Rule 3 (Completion / Score $50\text{--}89\%$):** Adds skill to `current_skills`, advances active step pointer, and persists updated roadmap state.

---

### 6. Persistence & Security Layer (`db.py` & `auth.py`)

* **What it does:** Provides secure dual-mode data persistence and authentication for learners, roadmaps, and sessions.
* **Exact Mechanics:**
  1. **Password Security:** Uses `bcrypt` adaptive hashing with per-user salt generation.
  2. **Authorization & Ownership:** Validates session Bearer tokens against learner profile IDs to prevent unauthorized profile access.
  3. **Lazy Firestore Initialization:** Checks for credentials before invoking Firebase Admin SDK; falls back gracefully to `db_storage.json`.

---

### 7. Frontend UX & Motion Engine (`frontend/`)

* **What it does:** Delivers a modern, responsive web application (Next.js 14 + Tailwind CSS + Lucide Icons).
* **Key Visual Subsystems:**
  1. **2-Step Onboarding Wizard (`GoalInput.tsx`):** Fixed-height glassmorphic card with dynamic skill search.
  2. **Synchronized Viewport Carousel Track (`page.tsx`):** Seamless transition between onboarding and dashboard.
  3. **Background Tech Orbit System (`OrbitBackground.tsx`):** Concentric orbital rings with deep-space starfield physics.

---

## 📊 Summary: System Components & Algorithms (v1.1)

| Module | Subsystem Technique | Classification |
|---|---|---|
| **Goal Extraction** | Character n-gram TF-IDF Vectorizer + Cosine Sim (with LLM fallback) | **Machine Learning / NLP** |
| **Skill Gap Analysis** | TF-IDF Sublinear Character N-Gram Cosine Similarity ($\tau=0.60$) | **Machine Learning / Vector Space** |
| **Path Generation** | NetworkX `DiGraph` + Transitive Closure + `topological_sort` | **Deterministic Graph Theory** |
| **Explainable AI (XAI)** | DAG Graph Fact Extraction + Grounded Template / Gemini Synthesis | **Fact-Grounded Synthesis** |
| **Adaptive Feedback** | Score-bracket mutation rules ($<50\%, \ge 90\%, \text{complete}$) | **Rule-Based Heuristic** |
| **Authentication** | Bcrypt hashing + Token-based learner ownership check | **Security & Cryptography** |
| **Database Persistence** | Firebase Firestore + Local JSON Storage Fallback | **Dual-Mode Persistence** |
