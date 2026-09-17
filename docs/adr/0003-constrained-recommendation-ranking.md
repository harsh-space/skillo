# ADR-0003: Constrained Multi-Factor Learning Resource Ranking

- **Status**: Accepted
- **Date**: 2026-09-17
- **Deciders**: Skillo AI Core Team

---

## Context
When learning milestones are generated, learners require curated resources (courses, interactive tutorials, official documentation, reference repositories).

In unconstrained LLM architectures, models frequently hallucinate non-existent URLs, recommend stale deprecated libraries, or provide low-quality blog posts.
In v1.1, Skillo AI resolved this with a static JSON catalog (`seed_resources.json`) and a simple dictionary lookup per skill. However, this lacked personalization: beginner learners were shown advanced deep-dives, and duration/difficulty pacing was unoptimized.

---

## Decision
We implement a **constrained multi-factor scoring and ranking algorithm** (`services/resource_ranker.py`):

1. **Hard Constraint (Zero Hallucination)**: Recommended resources must be strictly drawn from the validated database (`resources` collection / `seed_resources.json`). No generative creation of external links is allowed.
2. **Multi-Factor Score**:
   $$\text{FinalScore}(r) = w_r \cdot S_{\text{relevance}}(r, s) + w_d \cdot S_{\text{difficulty}}(r, l) + w_q \cdot S_{\text{quality}}(r) + w_f \cdot S_{\text{format}}(r, p)$$
   Where:
   - $S_{\text{relevance}}$: Vector similarity between milestone skill embedding and resource tags/description.
   - $S_{\text{difficulty}}$: Penalty distance between learner proficiency level $l$ and resource difficulty target.
   - $S_{\text{quality}}$: Seed quality score and community review weight.
   - $S_{\text{format}}$: Learner preference alignment (video vs documentation vs interactive coding).

---

## Consequences

### Positive
- **100% Valid Resource URLs**: Guarantees zero 404 dead links or fabricated domains.
- **Personalized Pacing**: Novices receive beginner-friendly interactive courses; experienced engineers transitioning disciplines receive high-density architectural documentation and codebases.
- **Fast Execution**: Pure algebraic vector-matrix ranking executes in $< 10$ms on CPU.

### Negative / Trade-offs
- The catalog depth is bounded by curated seed resources. Adding new courses requires running the taxonomy ingestion pipeline rather than relying on dynamic web search during inference.
