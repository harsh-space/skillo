# Skillo AI v2 — Success Criteria & Exit Gates

> **Phase**: Phase 2 Technical Planning  
> **Status**: Defined Release Gates  

---

## 1. Quantitative Benchmark Gates

To graduate from v2 development to production release, the system must meet or exceed all quantitative benchmark targets established during the v1.1 freeze:

| Pipeline Stage | Metric | v1.1 Baseline | v2 Minimum Gate | v2 Stretch Target |
| :--- | :--- | :--- | :--- | :--- |
| **Goal Classification** | Top-1 Accuracy | 76.7% (23/30) | $\ge 90.0\%$ (27/30) | $\ge 96.7\%$ (29/30) |
| **Goal Classification** | Latency (P50) | 4.6 ms | $< 25.0$ ms | $< 10.0$ ms |
| **Goal Classification** | Latency (P95) | 9.7 ms | $< 50.0$ ms | $< 20.0$ ms |
| **Skill Gap Analysis** | Precision | 1.000 | $\ge 0.950$ | 1.000 |
| **Skill Gap Analysis** | Recall | 0.600 | $\ge 0.900$ | $\ge 0.950$ |
| **Skill Gap Analysis** | F1 Score | 0.750 | $\ge 0.900$ | $\ge 0.950$ |
| **Roadmap Generation** | Invariant Violations | 0 violations | 0 violations | 0 violations |
| **Roadmap Generation** | DAG Cycles / Orphans | 0 | 0 | 0 |
| **Resource Ranking** | Valid Catalog Link Rate | 100% | 100% | 100% |
| **LLM Output Grounding** | Hallucinated Skill Rate | 0.0% | 0.0% | 0.0% |

---

## 2. Qualitative Acceptance Criteria

1. **Deterministic Fallbacks**: If external LLM APIs (Gemini/OpenAI) fail, timeout, or hit rate limits, the entire roadmap generation pipeline must complete locally using the embedding model and rule-based graph solver without throwing errors.
2. **Pedagogical Clarity**: Roadmap milestones must contain actionable descriptions, realistic estimated completion hours, and clearly delineated prerequisites.
3. **Reproducibility**: All evaluation runs must be fully deterministic and reproducible using `python evaluation/baselines/run_baseline_evaluation.py`.
4. **Code Quality**: All tests in `backend/tests/` must pass cleanly without warnings or deprecated syntax.

---

## 3. Go / No-Go Decision Rubric

A release candidate will be approved only if:
- [ ] All 10 invariant checks in `Roadmap Invariant Checks` pass with 0 errors.
- [ ] Skill Gap F1 score strictly exceeds 0.900.
- [ ] Goal classification accuracy strictly exceeds 90.0%.
- [ ] End-to-end deterministic pipeline latency (P95) is below 100ms on CPU.
- [ ] All 4 Architecture Decision Records (ADRs) are adhered to in code.
