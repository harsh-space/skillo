# Pathfinder AI (V1 → V1.1) — Under The Hood Technical Breakdown

This document provides a transparent, no-sugarcoat technical explanation of **how every subsystem in V1 actually works under the hood**, what algorithms are executed, where genuine ML vs. heuristic fallbacks run, and why certain edge cases behave the way they do.

---

## 🧭 Executive Summary of the Pipeline

```
Raw Free-Text Goal ──────► [ 1. Intent Extraction ] ─────► Target Role & Skills
                                │ (LLM / Keyword / Cosine)
Learner Stated Skills ───► [ 2. Skill Gap Engine ] ──────► Matched vs. Missing Gap Vectors
                                │ (sentence-transformers embeddings)
Taxonomy DAG Edges ──────► [ 3. Path Generation ] ──────► Topologically Ordered Sequence
                                │ (NetworkX Closure + Topological Sort)
Upstream/Downstream Facts► [ 4. Explainability (XAI) ] ──► Fact-Grounded Justification
                                │ (Graph metadata template synthesis)
Feedback Events ─────────► [ 5. Adaptive Loop ] ────────► Dynamic Path Mutation
                                │ (Heuristic re-ranking rules)
```

---

## 🔍 Deep-Dive: Component by Component

### 1. Goal Extraction & Intent Parsing (`goal_parser.py`)

* **What it is supposed to do:** Translate unstructured natural language (e.g. *"I want to do backend system architecture"*) into a discrete target role (`role_backend_developer`) and required competencies.
* **Exact Mechanics in V1:**
  1. **Primary Route:** If an `OPENAI_API_KEY` or `GEMINI_API_KEY` environment variable is detected, it issues an async HTTP prompt with a JSON schema constraint, requiring the LLM to choose strictly from the seeded role taxonomy.
  2. **Fallback Route (Local Mode / No API Key):** It runs a token-intersection keyword heuristic (`_rule_based_parse`) with bonus weights for role keywords (`backend`, `frontend`, `cloud/devops`, `ml/ai`).
* **Why the DevOps example stumbled in the original V1:**
  * Query: *"I'm a sophomore who **hates writing frontend CSS** and wants to automate cloud infrastructure, build CI/CD pipelines..."*
  * **Failure Reason:** In the original keyword heuristic (`_rule_based_parse`), the word `"frontend"` appeared in the input text. An `if/elif` chain gave `Frontend Developer` a `+5` bonus before even checking the DevOps clause — completely ignoring the negative sentiment (*"hates writing"*). First `elif` branch wins; no sentiment scoring at all.
  * **V1.1 Fix Applied:** Replaced `_rule_based_parse` with `_semantic_embed_parse` which:
    1. Loads the already-cached `all-MiniLM-L6-v2` model (zero additional dependency).
    2. Constructs a **rich role context string**: `"Career Role: <Name>. <Description>. Core competencies: <Skills>."` for each role.
    3. Encodes both the query and each role context into 384-dim dense vectors.
    4. Computes pairwise cosine similarity and selects the argmax role.
    5. Returns the matched role with its similarity score for transparency.

* **V1.1 Verified Test Results (run on local model, no API key):**

  | Query | Matched Role | Cosine Score |
  |---|---|---|
  | *"...hates CSS, wants CI/CD pipelines and container clusters"* | **DevOps Engineer** | 0.51 ✅ |
  | *"...train neural networks, PyTorch, only know basic math"* | **Machine Learning Engineer** | 0.33 ✅ |
  | *"...full end-to-end web apps, client-side UI and server databases"* | **Full Stack Developer** | 0.41 ✅ |
  | *"...backend systems, databases, caching and REST APIs"* | **Backend Developer** | 0.48 ✅ |

---

### 2. Skill Gap Vector Analysis (`gap_analysis.py`)

* **What it is supposed to do:** Compare the learner's existing skills against the target role's required skills to determine which competencies are already mastered vs. missing.
* **Exact Mechanics in V1 (Genuine ML Layer):**
  1. **Embedding Model:** Uses `sentence-transformers` (`all-MiniLM-L6-v2`), generating a 384-dimensional dense semantic vector for every skill name + description.
  2. **Cosine Similarity Matrix:**
     $$\text{Cosine Similarity}(u, v) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
  3. **Thresholding ($\tau = 0.60$):**
     * If $\max_{s \in \text{learner}}(\text{similarity}(r, s)) \ge 0.60 \implies$ **Matched Skill** (Learner already knows an equivalent concept).
     * If $\max_{s \in \text{learner}}(\text{similarity}(r, s)) < 0.60 \implies$ **Missing Skill** (Flagged as an active competency gap).
  4. **Special Domain Constraints:** Explicitly distinguishes `Python (basic)` from `Python (advanced)` (similarity clamped at $0.52$) so basic Python does not falsely satisfy advanced asynchronous/OOP backend requirements.

---

### 3. Path Generation & Prerequisite Closure (`path_generator.py`)

* **What it is supposed to do:** Order the missing skills into a strictly valid study sequence that respects dependency prerequisites.
* **Exact Mechanics in V1 (Graph Theory / DAG):**
  1. **Graph Construction:** Builds a `networkx.DiGraph` from 35 directed edges (e.g. `Python` $\to$ `REST APIs` $\to$ `Authentication`).
  2. **Prerequisite Closure Resolution:**
     * For every missing skill $s$, it computes all directed graph ancestors:
       $$\text{Ancestors}(s) = \{a \in V \mid a \leadsto s\}$$
     * If an ancestor $a$ is **not** in the learner's mastered set, $a$ is automatically pulled into the learning path even if not explicitly part of the role definition.
  3. **Topological Sort:**
     * Executes `networkx.topological_sort(subgraph)` to ensure for every directed edge $(u, v)$, skill $u$ strictly precedes skill $v$.
  4. **Resource Binding:** Iterates over the sorted nodes and queries the `resources` collection to attach curated courses and project checkpoints.

---

### 4. Explainable AI (XAI) Engine (`xai.py`)

* **What it is supposed to do:** Give a plain-language answer to *"Why is this course recommended at this step?"* without hallucinating fake facts.
* **Exact Mechanics in V1 (Fact-Grounded Synthesis):**
  1. Extracts 4 exact structural facts from the computed graph and gap analysis:
     * **Upstream Predecessors:** $\text{Pred}(s) \cap \text{RoadmapPath}$
     * **Downstream Dependents:** $\{d \in \text{RoadmapPath} \mid s \in \text{Pred}(d)\}$
     * **Gap Similarity Score:** Distance metric computed in Step 2.
     * **Target Role:** Stated career objective.
  2. Synthesizes a grounded template sentence binding these exact nodes:
     > *"Recommended after [Predecessors] and before [Dependents] — [Skill] is a direct prerequisite for building the [First Dependent] module in your target role, and closes a skill gap identified from your goal."*

---

### 5. Adaptive Feedback Loop (`feedback.py`)

* **What it is supposed to do:** Re-rank or adjust the roadmap when assessment scores or completions occur.
* **Exact Mechanics in V1 (Rule-Based Heuristic):**
  * As explicitly scoped in `context.md` §5 & `PRD.md` §7, the hackathon rules deliberately permit rule-based heuristics over training reinforcement learning from scratch:
    * **Rule 1 (Score $< 50\%$):** Intercepts low score, queries `seed_resources.json` for a `is_remedial: true` refresher module, and mutates the array to insert a remedial step immediately at $\text{index} + 1$.
    * **Rule 2 (Score $\ge 90\%$):** Flags downstream dependent steps as accelerated/skippable.
    * **Rule 3 (Completed / Score $50\text{--}89\%$):** Appends skill to `current_skills`, advances pointer to the next topological node, and persists the updated document.

---

## 📊 Summary: Genuine ML vs. Rule-Based Modules in V1

| Module | Technique Used in V1 | Pure ML or Rule-Based? |
|---|---|---|
| **Goal Extraction** | V1: LLM API + `if/elif` keyword bonus heuristic fallback | V1: Heuristic (broken on negation/mixed signals) |
| **Goal Extraction** | **V1.1 Fix**: LLM API + Dense Cosine Similarity over role context embeddings | **V1.1: Hybrid (LLM + Pure ML fallback)** |
| **Skill Gap Analysis** | `sentence-transformers` (`all-MiniLM-L6-v2`) 384-dim Dense Vector Cosine Similarity ($\tau=0.60$) | **Pure AI/ML** |
| **Path Generation** | NetworkX `DiGraph` + Transitive Ancestor Closure + `topological_sort` | **Deterministic Graph Theory** |
| **Explainable AI** | Graph predecessor/successor fact extraction + grounded sentence template | **Fact-Grounded Synthesis** |
| **Adaptive Feedback** | Score-bracket mutation rules ($<50\%, \ge 90\%, \text{complete}$) — no RL | **Rule-Based Heuristic** |
