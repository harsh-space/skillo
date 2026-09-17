# ADR-0002: Exact and Semantic Hybrid Matching Architecture

- **Status**: Accepted
- **Date**: 2026-09-17
- **Deciders**: Skillo AI Core Team

---

## Context
Skill gap analysis compares a user's stated skills against the required skills for a target role. In software engineering and AI disciplines, skill naming presents a dual challenge:
1. **Acronyms and specific tool names** (e.g. `K8s`, `PostgreSQL`, `JWT`, `CSS3`) require exact lexical or alias precision; embedding models can occasionally smear subtle version or tool differences.
2. **Descriptive concepts and competencies** (e.g. `Relational Database Management` vs `SQL & Relational Databases`, or `API Engineering` vs `REST APIs`) require deep semantic representation that lexical string matching fails on completely.

In v1.1 baseline testing, pure token heuristics achieved only 60.0% recall on skill equivalence.

---

## Decision
We adopt a **3-tier hierarchical hybrid matching pipeline** in `gap_analysis.py`:

```
Incoming Learner Skill String
              │
              ▼
   ┌───────────────────────┐
   │ Tier 1: Exact Match   │ ──(Score = 1.0)──► MATCH
   │ Normalized / Alias    │
   └──────────┬────────────┘
              │ (No match)
              ▼
   ┌───────────────────────┐
   │ Tier 2: Dense Vector  │ ──(Cosine >= 0.80)──► MATCH
   │ Cosine Similarity     │
   └──────────┬────────────┘
              │ (Cosine 0.65 - 0.79)
              ▼
   ┌───────────────────────┐
   │ Tier 3: Calibrated    │ ──(Confidence calibrated)──► PARTIAL_MATCH
   │ Partial Match Scoring │
   └──────────┬────────────┘
              │ (Cosine < 0.65)
              ▼
             GAP (Requires learning milestone)
```

1. **Tier 1 (Lexical / Alias)**: Fast lowercase normalization, symbol stripping, and domain synonym dictionary (e.g., `k8s` $\rightarrow$ `Kubernetes`).
2. **Tier 2 (Dense Cosine Similarity)**: Dense vector cosine similarity computed using normalized embeddings. If similarity $\ge 0.80$, classify as full match.
3. **Tier 3 (Calibrated Partial Match)**: If similarity is between $0.65$ and $0.79$, classify as `PARTIAL_MATCH` (triggering an accelerated refresher milestone rather than a full zero-to-one unit).

---

## Consequences

### Positive
- **High Precision + High Recall**: Combines the precision of deterministic alias tables with the generalizability of sentence embeddings.
- **Differentiated Learning Paths**: Users with adjacent skills receive targeted refresher milestones instead of being treated as complete novices.
- **Benchmark F1 Target**: Designed to elevate benchmark F1 from 0.750 to $> 0.900$.

### Negative / Trade-offs
- Requires threshold tuning and validation across the benchmark suite to avoid false-positive semantic drift.
