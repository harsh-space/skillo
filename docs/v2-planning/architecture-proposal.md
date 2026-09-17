# Skillo AI v2 — Architecture Proposal

> **Phase**: Phase 2 Technical Planning  
> **Status**: Architectural Proposal  

---

## 1. Architectural Philosophy

Skillo AI v2 adopts the **"Graph-Grounded AI Architecture"** (GGA) pattern:
1. **Mathematical Core for Structure**: Topological sorting, graph DAG validation, and resource optimization algorithms govern the hard structure of learning roadmaps.
2. **Dense Embeddings for Semantic Alignment**: Fast, local vector embeddings bridge user intent and taxonomy vocabulary.
3. **LLM at the Presentation Edge**: Generative models are invoked exclusively to synthesize clear pedagogical explanations, personalized milestone rationale, and contextual learning tips—never to invent taxonomy graph nodes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SKILLO AI v2 PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    1. User Goal & Skills   │
                      │  "I build web apps, want  │
                      │   to master ML & PyTorch" │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  2. Semantic Intent Parse │
                      │   (Sentence Transformer)  │
                      │   Cosine Match → Target   │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  3. Hybrid Gap Analysis   │
                      │  Exact Token + Semantic   │
                      │  Embedding Cosine Match   │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   4. DAG Path Generator   │
                      │  Kahn's Topological Sort  │
                      │  Pacing & Level Stages    │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  5. Constrained Ranker    │
                      │  Multi-factor Scoring     │
                      │  Relevance x Difficulty   │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │ 6. Grounded AI Synthesizer│
                      │   (Gemini Flash / Local)  │
                      │   Milestone Descriptions  │
                      └───────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Intent Classifier & Goal Parser (`services/goal_parser.py`)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors) or fast ONNX runtime inference.
- **Index**: Precomputed normalized embeddings for all roles in the taxonomy (combining role title, description, and required skill clusters).
- **Execution Flow**:
  1. Compute embedding vector $\mathbf{v}_{\text{goal}}$ for incoming user text.
  2. Compute cosine similarity against precomputed $\mathbf{V}_{\text{roles}}$.
  3. If $\max(\text{sim}) \ge \tau_{\text{confidence}}$ (e.g. 0.55), select top matching role.
  4. If ambiguous (top two within $\Delta \le 0.05$), return disambiguation options to the user or trigger LLM intent classification fallback.

### 2.2 Hybrid Gap Analyzer (`services/gap_analysis.py`)
- **Matching Pipeline**:
  1. **Phase A: Exact Normalized Match** (Casefold, punctuation strip, stemming).
  2. **Phase B: Dense Semantic Match** (Cosine similarity threshold $\ge 0.78$ against taxonomy skill vector index).
  3. **Phase C: Substring / Alias Coverage** (Domain-specific aliases like "k8s" $\rightarrow$ "Kubernetes").
- **Output**:
  - `matched_skills`: Skills the user already has (confidence $\ge 0.78$).
  - `missing_skills`: Gap skills requiring roadmap milestones.
  - `partially_matched_skills`: Skills requiring refresher units.

### 2.3 Constrained Recommendation Ranker (`services/resource_ranker.py`)
- **Scoring Function**:
  $$\text{Score}(r, s, u) = w_1 \cdot \text{Sim}(r_{\text{tags}}, s) + w_2 \cdot \text{DiffAlignment}(r_{\text{level}}, u_{\text{level}}) + w_3 \cdot \text{Quality}(r) + w_4 \cdot \text{FormatPreference}(r, u)$$
- Ensures every selected resource strictly belongs to the verified seed catalog with high quality ratings.

### 2.4 Grounded Narrative Synthesizer (`services/path_generator.py`)
- Takes the validated DAG and injects structured context into LLM prompt templates:
  - Input: Verified skill names, prerequisites, allocated hours, recommended resource titles.
  - Instruction: Generate clear milestone objectives, practical project ideas, and guidance without changing the skill nodes or order.

---

## 3. Data Flow & Latency Budget

| Step | Operation | Target Latency (P50) | Target Latency (P95) |
| :--- | :--- | :--- | :--- |
| 1 | Goal Vectorization & Cosine Search | 12 ms | 25 ms |
| 2 | Hybrid Skill Gap Resolution | 8 ms | 18 ms |
| 3 | DAG Construction & Topological Sort | 2 ms | 5 ms |
| 4 | Resource Multi-Factor Ranking | 5 ms | 12 ms |
| 5 | AI Narrative Synthesis (Streaming/Cached) | 450 ms | 1200 ms |
| **Total** | **Full Pipeline (Without AI synthesis / with cached AI)** | **< 30 ms** | **< 60 ms** |
