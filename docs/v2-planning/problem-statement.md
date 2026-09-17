# Skillo AI v2 — Problem Statement & Non-Goals

> **Phase**: Phase 2 Technical Planning  
> **Status**: Approved for v2 Implementation  

---

## 1. Problem Statement

### 1.1 Context & Background
In Skillo AI v1.1, the system successfully established a reliable, deterministic foundation for career path generation by relying on a curated JSON taxonomy (6 target roles, ~20 skills, ~35 learning resources) and an n-gram TF-IDF vector matching heuristic for goal classification and skill gap extraction.

While v1.1 stabilized the platform against hallucinated learning paths, cyclic dependency bugs, and unbounded latency, it revealed fundamental algorithmic limitations:
1. **Semantic Brittleness in Goal Parsing**: TF-IDF character n-gram cosine matching struggles with rich, multi-clause, or synonym-heavy career goals where surface lexemes do not match role names or seed skill keywords.
2. **Coarse-Grained Skill Gap Matching**: Skill equivalence relies on exact lowercase string matching or naive word token overlap. Equivalent skill expressions (e.g., *"Kubernetes cluster administration"* vs *"DevOps container orchestration"*) produce false skill gaps.
3. **Static Resource Recommendations**: Learning resource selection is determined by a static lookup table with minimal personalization based on learner background or difficulty progression.
4. **Binary Prerequisite Logic**: Prerequisite enforcement is purely topological without confidence scores or partial prerequisite satisfaction.

### 1.2 Core Objective of v2
The objective of v2 is to **upgrade Skillo AI's algorithmic intelligence to state-of-the-art semantic precision while maintaining zero-hallucination guarantees and strict topological roadmap safety**.

---

## 2. In-Scope Goals (What v2 Will Deliver)

| Area | v2 Objective | Target Metric |
| :--- | :--- | :--- |
| **Goal Parsing** | Upgrade from TF-IDF n-grams to a specialized, compact Sentence Transformer embedding pipeline with cosine similarity & threshold fallback. | Classification accuracy $\ge 92\%$ across benchmark dataset. |
| **Skill Gap Resolution** | Introduce hybrid matching (Exact Token Match + Dense Semantic Vector Similarity + Confidence Calibration) to accurately resolve skill synonyms. | Skill Gap F1 Score $\ge 0.90$. |
| **Constrained Recommendation** | Multi-factor weighted ranking for learning resources (Domain relevance, difficulty alignment, quality score, duration pacing). | Mean Reciprocal Rank (MRR) $\ge 0.85$ on resource curation tests. |
| **Roadmap Generation** | Topological sort with dynamic difficulty stage grouping, time-to-mastery estimates, and strictly grounded milestones. | 100% DAG invariant pass rate, zero orphan nodes. |
| **AI/LLM Boundary** | Strictly define the LLM boundary: ML embeddings classify and compute; LLM is strictly used for synthesis and rationale articulation. | 0% ungrounded roles/skills generated outside verified taxonomy. |

---

## 3. Explicit Non-Goals (What v2 Will NOT Do)

To avoid scope creep and maintain engineering discipline, the following items are strictly out of scope for v2:

1. **Unconstrained Generative Roadmaps**: We will **not** allow an LLM to invent arbitrary skills or unverified roles on the fly without grounding in the taxonomy.
2. **Real-time Web Scraping for Courses**: We will not scrape live course catalogs during the roadmap generation request lifecycle (to preserve sub-second deterministic latency).
3. **Multi-Tenant Enterprise Auth / SSO**: Role-based access control and enterprise OAuth will remain at the simple session-level auth already in place.
4. **Full LMS Video Hosting**: Skillo AI is a roadmap planner and orchestrator, not a video hosting platform.

---

## 4. Key Hypotheses

- **Hypothesis 1 (Embeddings vs TF-IDF)**: Replacing TF-IDF character n-grams with a lightweight Sentence Transformer (e.g. `all-MiniLM-L6-v2` or quantized ONNX equivalent) will boost goal classification accuracy from ~75% to >90% on out-of-distribution queries without exceeding 50ms latency.
- **Hypothesis 2 (Hybrid Gap Analysis)**: Combining exact token matching (for acronyms/tool names) with dense cosine similarity (for descriptive capabilities) will eliminate >80% of false-positive skill gaps.
- **Hypothesis 3 (Grounding Guardrails)**: Decoupling deterministic graph generation from LLM narrative synthesis guarantees 0% hallucination rate while delivering natural, personalized roadmap coaching.
