# Skillo AI (V1 → V1.1) — Under The Hood Technical Breakdown

This document provides a transparent, comprehensive technical explanation of **how every subsystem in Skillo AI works under the hood**, detailing the exact algorithms executed, ML vs. deterministic fallbacks, graph operations, database persistence, and frontend visual animation architecture.

---

## 🧭 Executive Summary of the Pipeline

```
Raw Free-Text Goal ──────► [ 1. Intent Extraction ] ─────► Target Role & Skills
                                │ (Google GenAI Gemini SDK / Dense Cosine Embedding)
Learner Stated Skills ───► [ 2. Skill Gap Engine ] ──────► Matched vs. Missing Gap Vectors
                                │ (sentence-transformers embeddings, tau = 0.60)
Taxonomy DAG Edges ──────► [ 3. Path Generation ] ──────► Topologically Ordered Sequence
                                │ (NetworkX Closure + Topological Sort)
Upstream/Downstream Facts► [ 4. Explainability (XAI) ] ──► Fact-Grounded Justification
                                │ (Gemini LLM Synthesis / Graph metadata template)
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
  1. **Primary Route (Google GenAI Gemini SDK):**
     * When `GEMINI_API_KEY` is present, it uses the official `google-genai` SDK (`google.genai.Client`) with model `gemini-flash-latest`.
     * Passes a structured JSON schema prompt constraining the LLM output strictly to available taxonomy roles:
       $$\text{JSON Schema: } \{\text{target\_role}, \text{intent\_summary}\}$$
     * Cleanly handles key formats (including both legacy `AIza*` and standard API keys).
  2. **Secondary Route (OpenAI API):**
     * If `OPENAI_API_KEY` is available, issues a structured JSON classification query (`gpt-3.5-turbo`).
  3. **Local Semantic Embedding Fallback (`_semantic_embed_parse`):**
     * Runs zero-API-key local intent extraction using `sentence-transformers` (`all-MiniLM-L6-v2`).
     * Constructs a rich contextual string for each candidate role:
       $$\text{Role Context} = \text{"Career Role: } R_{\text{name}} \text{. } R_{\text{desc}} \text{ Core competencies: } S_1, S_2, \dots S_n\text{"}$$
     * Encodes the user query and all role contexts into 384-dimensional dense vector space.
     * Computes cosine similarity and applies a title match keyword bonus ($+0.30$ for exact role name match, $+0.10$ for keyword match):
       $$\text{Score}(R) = \text{CosineSim}(\mathbf{v}_{\text{query}}, \mathbf{v}_{\text{role}}) + \text{Bonus}(R)$$
  4. **Token Overlap Fallback:**
     * If embedding models are unavailable, computes token intersection scores between goal query terms and role skill requirements.

* **Verified Semantic Test Results:**

  | Query | Matched Role | Score / Method |
  |---|---|---|
  | *"...hates CSS, wants CI/CD pipelines and container clusters"* | **DevOps Engineer** | 0.51 (Cosine) ✅ |
  | *"...train neural networks, PyTorch, only know basic math"* | **Machine Learning Engineer** | 0.33 (Cosine) ✅ |
  | *"...full end-to-end web apps, client-side UI and server databases"* | **Full Stack Developer** | 0.41 (Cosine) ✅ |
  | *"...backend systems, databases, caching and REST APIs"* | **Backend Developer** | 0.48 (Cosine) ✅ |

---

### 2. Skill Gap Vector Analysis (`gap_analysis.py`)

* **What it does:** Compares the learner's existing skills against the target role's required skills to compute matched competencies versus missing skill gap vectors.
* **Exact Mechanics (Dense Vector Embedding Layer):**
  1. **Embedding Generator:** Uses `sentence-transformers` (`all-MiniLM-L6-v2`), generating a 384-dimensional dense semantic vector for every skill name + description.
  2. **Cosine Similarity Computation:**
     $$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
  3. **Threshold Decision ($\tau = 0.60$):**
     * $\max_{s \in \text{learner}}(\text{similarity}(r, s)) \ge 0.60 \implies$ **Matched Skill** (Learner already possesses this or an equivalent concept).
     * $\max_{s \in \text{learner}}(\text{similarity}(r, s)) < 0.60 \implies$ **Missing Skill** (Flagged as an active learning gap).
  4. **Skill Level Distinction Clamping:** Explicitly distinguishes skill depth (e.g. `Python (basic)` vs `Python (advanced)` similarity is clamped at $0.52$) to prevent introductory knowledge from satisfying advanced backend requirements.

---

### 3. Path Generation & Prerequisite Closure (`path_generator.py`)

* **What it does:** Takes the missing skill vector and builds a topologically ordered learning sequence that respects prerequisite constraints.
* **Exact Mechanics (Directed Acyclic Graph / DAG):**
  1. **Graph Instantiation:** Constructs a `networkx.DiGraph` from 35+ directed prerequisite edges (e.g. `Python (basic)` $\to$ `REST APIs` $\to$ `Authentication & JWT`).
  2. **Transitive Prerequisite Closure:**
     * For every identified missing skill $s$, computes all directed graph ancestors:
       $$\text{Ancestors}(s) = \{a \in V \mid a \leadsto s\}$$
     * If ancestor $a$ is missing from the learner's mastered set, it is automatically injected into the roadmap to prevent prerequisite gaps.
  3. **Topological Ordering:**
     * Runs `networkx.topological_sort(subgraph)` ensuring that for every edge $(u, v)$, skill $u$ strictly precedes skill $v$.
  4. **Resource Binding:** Binds each sorted node to curated learning resources (courses, documentation, project checkpoints) stored in the database.

---

### 4. Explainable AI (XAI) Engine (`xai.py`)

* **What it does:** Answers *"Why is this skill recommended at this exact step?"* with fact-grounded explanations.
* **Exact Mechanics (Google GenAI Gemini Synthesis + Graph Fallback):**
  1. **Structural Fact Extraction:** Extracts 4 graph facts from the DAG roadmap:
     * **Upstream Prerequisites:** Completed foundation nodes (e.g. `Python (advanced)`, `SQL & Relational Databases`).
     * **Downstream Milestones Unlocked:** Subsequent skills enabled by this step (e.g. `Authentication & JWT`, `Docker & Containers`).
     * **Target Role:** Stated career objective (e.g. `Backend Developer`).
     * **Remedial Flag:** Identifies whether the node is a standard progression or an active remedial insertion.
  2. **Grounded Gemini LLM Synthesis:**
     * Issues an async prompt to **Gemini (`gemini-3-flash-preview` / `gemini-flash-latest`)** via the `google-genai` SDK with zero-hallucination rules.
     * Generates a 2-sentence rationale grounded strictly in the extracted graph facts:
       > *"Building on your Python and SQL foundations, mastering REST APIs enables you to expose backend data services required for your Backend Developer goal. This unlocks subsequent modules in Authentication & JWT and containerized deployment with Docker."*
  3. **Deterministic Fallback:** If offline or without an API key, `_template_grounded_explanation` synthesizes the rationale directly from graph edge relationships.

---

### 5. Adaptive Feedback Loop (`feedback.py`)

* **What it does:** Dynamically mutates the learning path when assessment results or completions occur.
* **Exact Mechanics (Rule-Based Adaptive Engine):**
  * **Rule 1 (Quiz Score $< 50\%$):** Intercepts low comprehension, fetches a `is_remedial: true` refresher module from taxonomy, and injects a remedial step at $\text{index} + 1$.
  * **Rule 2 (Quiz Score $\ge 90\%$):** Flags downstream dependent steps as accelerated/skippable.
  * **Rule 3 (Completion / Score $50\text{--}89\%$):** Adds skill to `current_skills`, advances active step pointer, and persists updated roadmap state.

---

### 6. Persistence & Database Layer (`db.py`)

* **What it does:** Provides dual-mode data persistence for learners, skills, roles, roadmaps, and feedback events.
* **Exact Mechanics:**
  1. **Lazy Firestore Initialization:** Checks for `GOOGLE_APPLICATION_CREDENTIALS` file existence before invoking Firebase Admin SDK. Prevents gRPC initialization blocking on local development environments.
  2. **Transparent Local Fallback:** If Firebase credentials are not configured, transparently reads and writes to `app/data/db_storage.json`.
  3. **Unified Document API:** Provides consistent `set_document`, `get_document`, `list_documents`, and `update_document` primitives across live Firestore and local storage.

---

### 7. Frontend UX & Motion Engine (`frontend/`)

* **What it does:** Delivers a modern, responsive web application (Next.js 14 + Tailwind CSS + Lucide Icons).
* **Key Visual Subsystems:**
  1. **2-Step Onboarding Wizard (`GoalInput.tsx`):**
     * Fixed-height glassmorphic card (`h-[340px]`).
     * **Step 1:** Name & Career Goal inputs.
     * **Step 2:** Skillset badge selector with live search filtering.
     * Icon-only action buttons (`Sparkles`, `ArrowLeft`, `ArrowRight`) with dynamic `"Step X of 2"` indicator.
  2. **Synchronized Viewport Carousel Track (`page.tsx`):**
     * Unified dual-panel slide container (`w-[200%]` width).
     * On onboarding completion, slides track `-50%` left with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
     * Simultaneous slide-out of Onboarding and slide-in of Dashboard in perfect lockstep.
  3. **Background Tech Orbit System (`OrbitBackground.tsx`):**
     * Concentric orbital rings featuring animated tech badges (Python, React, TypeScript, Next.js, Docker, Rust, Node.js, Go, PyTorch, Kubernetes, Tailwind, GraphQL).
     * 45 randomized twinkling stars in deep-space starfield.
     * When transitioning to Dashboard, tech badges smoothly slide left and fade (`opacity-0 -translate-x-24`), while orbit rings drop to 10% opacity, keeping stars active.

---

## 📊 Summary: Genuine ML vs. Rule-Based Modules

| Module | Subsystem Technique | Classification |
|---|---|---|
| **Goal Extraction** | Google GenAI SDK (`gemini-flash-latest`) + Sentence-Transformers Cosine Similarity (`all-MiniLM-L6-v2`) fallback | **Hybrid (LLM + Pure ML Fallback)** |
| **Skill Gap Analysis** | `sentence-transformers` 384-dim Dense Vector Cosine Similarity ($\tau=0.60$) | **Pure AI/ML** |
| **Path Generation** | NetworkX `DiGraph` + Transitive Closure + `topological_sort` | **Deterministic Graph Theory** |
| **Explainable AI (XAI)** | DAG Graph Fact Extraction + Gemini LLM Grounded Synthesis (`google-genai` SDK) | **Fact-Grounded Synthesis** |
| **Adaptive Feedback** | Score-bracket mutation rules ($<50\%, \ge 90\%, \text{complete}$) | **Rule-Based Heuristic** |
| **Database Persistence** | Firebase Firestore + Local JSON Storage Fallback with Lazy Credential Check | **Dual-Mode Persistence** |
| **Frontend Motion** | Next.js 14 + Tailwind CSS + Dual-Panel Slide Track + Orbital Animations | **Synchronized Motion Engine** |
