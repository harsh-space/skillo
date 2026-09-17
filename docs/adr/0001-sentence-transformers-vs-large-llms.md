# ADR-0001: Compact Sentence Transformers vs. Generative LLMs for Semantic Matching

- **Status**: Accepted
- **Date**: 2026-09-17
- **Deciders**: Skillo AI Core Team

---

## Context
Goal parsing and skill gap extraction require mapping free-text user inputs (e.g. *"I build web backends with python and want to get into generative AI"*) to standardized taxonomy concepts (Target Roles, Seed Skills).

In earlier hackathon prototypes and early designs, developers frequently defaulted to sending every user text to a frontier LLM (e.g. GPT-4, Gemini 1.5 Pro) with unstructured prompts. However, this approach presented critical issues:
1. **Unbounded Latency**: LLM round-trips take between 600ms and 3000ms.
2. **Non-Determinism & Hallucinations**: Prompt drift occasionally produced non-existent roles or skills outside the curated taxonomy.
3. **Availability / Quota Vulnerability**: Network timeouts or 429/503 HTTP status codes degraded user experience.
4. **Cost**: Per-request token fees for high-frequency autocomplete or real-time roadmap tweaking are unsustainable.

On the other end of the spectrum, character n-gram TF-IDF vectorizers (evaluated in v1.1) delivered sub-5ms CPU latency but achieved only 76.7% accuracy on benchmark queries due to lack of deep contextual semantics.

---

## Decision
We will use **compact, local Sentence Transformers** (specifically `sentence-transformers/all-MiniLM-L6-v2` or its quantized ONNX equivalent) as the primary ML engine for semantic intent classification and skill gap vector matching.

Generative LLMs (Gemini Flash / OpenAI) will be relegated strictly to:
1. Low-confidence ambiguous query fallback.
2. Presentation-layer narrative synthesis (generating coaching descriptions and project suggestions).

---

## Consequences

### Positive
- **Deterministic Latency**: Local embeddings compute in 5–20ms on CPU without external API round-trips.
- **Strict Grounding**: Vector search is executed against precomputed index tensors representing verified taxonomy entities; it is impossible for the vector search to invent an ungrounded entity.
- **Offline Resilience**: Roadmap generation can run completely offline or in low-connectivity environments.
- **Zero API Incurred Cost**: No per-token charges for matching.

### Negative / Trade-offs
- Requires lightweight model weights (~80MB-120MB) to be downloaded or bundled.
- Requires maintenance of embedding index refresh routines when taxonomy data is modified.
