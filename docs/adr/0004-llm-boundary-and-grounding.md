# ADR-0004: LLM Boundary and Taxonomy Grounding Invariants

- **Status**: Accepted
- **Date**: 2026-09-17
- **Deciders**: Skillo AI Core Team

---

## Context
Generative Large Language Models (LLMs) excel at natural language synthesis, contextual summarization, and motivational pedagogy. However, using generative LLMs as the unconstrained end-to-end decider of learning paths introduces severe production flaws:
1. **DAG Cycles & Broken Prerequisites**: LLMs frequently schedule advanced topics (e.g. distributed systems or PyTorch neural networks) before fundamental prerequisites (e.g. Python basics or linear algebra).
2. **Taxonomy Incoherence**: Models invent arbitrary skill names that do not map to course catalogs, assessments, or skill tracking databases.
3. **Flaky Structure**: Outputting complex nested JSON structures via LLMs is prone to syntax truncations and schema schema mismatch under load.

---

## Decision
We enforce a **strict structural boundary between Deterministic Algorithms and Generative AI**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DETERMINISTIC GRAPH ENGINE                      │
│                                                                        │
│   • Taxonomy Entity Resolution (Embeddings & Cosine Search)            │
│   • Skill Gap Identification (Hybrid Matcher)                          │
│   • Dependency DAG Topological Sort (Kahn's Algorithm)                 │
│   • Step Pacing, Duration Allocation, and Difficulty Levels            │
│   • Validated Resource Assignment (Constrained Ranker)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │  Validated JSON Structure
                                    │  (Fixed Node IDs & Sequence)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       LLM PRESENTATION / SYNTHESIS                     │
│                                                                        │
│   • Generate milestone summary narrative                               │
│   • Articulate "Why this step matters for your specific goal"         │
│   • Suggest hands-on practical capstone project ideas                  │
│   • Invariant: LLM cannot insert, delete, or reorder skill nodes       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Graph Invariant Rule**: The roadmap sequence, skill IDs, prerequisite edges, and assigned resource IDs are computed exclusively by the deterministic graph engine.
2. **Synthesis Grounding Rule**: The LLM prompt is strictly bounded. The LLM receives the fixed roadmap skeleton and is tasked only with adding motivational explanations, practical project suggestions, and study tips.
3. **Fail-Safe Fallback**: If the LLM call fails, times out, or violates JSON validation, the system instantly delivers the deterministic template descriptions with 0ms delay.

---

## Consequences

### Positive
- **0.0% Hallucination Rate**: Mathematically impossible to produce hallucinated skills or invalid nodes.
- **100% DAG Topological Validity**: Guaranteed zero cyclic dependencies.
- **High User Engagement**: Learners still benefit from rich, personalized AI coaching and tailored project ideas.
- **Graceful Degradation**: Platform is 100% resilient to third-party AI outages.

### Negative / Trade-offs
- Prompts must be strictly structured and validated with Pydantic schemas.
