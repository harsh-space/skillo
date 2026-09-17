# Skillo AI v2 — Experiment Plan & Methodology

> **Phase**: Phase 2 Technical Planning  
> **Status**: Experiment Matrix Defined  

---

## 1. Overview & Evaluation Harness

All v2 improvements will be developed following strict hypothesis testing against frozen benchmark datasets in `evaluation/datasets/`. Every proposed architectural change must demonstrate statistically significant improvement against the v1.1 baselines without violating roadmap invariants or latency budgets.

---

## 2. Experiment Matrix

### Experiment 1: Semantic Intent Classifier vs. TF-IDF
- **Hypothesis**: Replacing character n-gram TF-IDF cosine matching with dense vector embeddings (`all-MiniLM-L6-v2`) will raise goal classification accuracy from 76.7% to $\ge 90.0\%$ on benchmark test cases (including typos, short queries, and multi-clause inputs).
- **Control (v1.1)**: TF-IDF vectorizer + alias mapping (Accuracy: 76.7%, P50: 4.6ms).
- **Treatment A**: Pretrained `sentence-transformers/all-MiniLM-L6-v2` with PyTorch runtime.
- **Treatment B**: Quantized `all-MiniLM-L6-v2` (ONNX Runtime, INT8) for sub-10ms CPU inference.
- **Metrics**: Top-1 Accuracy, Top-2 Recall, P50 Latency, P95 Latency.

### Experiment 2: Hybrid Skill Gap Analysis vs. Exact/Token Heuristic
- **Hypothesis**: A 3-tier hybrid matcher (Exact Token $\rightarrow$ Dense Semantic Cosine $\ge 0.78$ $\rightarrow$ Domain Alias Lookup) will increase Skill Gap Recall from 0.600 to $\ge 0.900$ and F1 score from 0.750 to $\ge 0.900$, while maintaining Precision $\ge 0.950$.
- **Control (v1.1)**: Exact string matching with TF-IDF fallback (F1: 0.750, Precision: 1.000, Recall: 0.600).
- **Treatment A**: Dense Semantic Cosine with fixed threshold $\tau = 0.75$.
- **Treatment B**: Dense Semantic Cosine with calibrated threshold $\tau = 0.82$ + Lemmatized Exact Token match.
- **Metrics**: Precision, Recall, F1 Score, False Positive Rate (FPR), False Negative Rate (FNR).

### Experiment 3: Constrained Resource Re-ranking vs. Static Table Lookup
- **Hypothesis**: Multi-factor scoring ($w_1 \cdot \text{SemanticRelevance} + w_2 \cdot \text{DifficultyAlignment} + w_3 \cdot \text{QualityScore}$) provides more relevant resource assignments per milestone than static seed mapping without introducing out-of-catalog links.
- **Control (v1.1)**: Direct skill-to-resource dictionary lookup.
- **Treatment**: Dynamic vector search across seed resources filtered by milestone skill domain and learner current experience level.
- **Metrics**: Mean Reciprocal Rank (MRR@3), Precision@1, Invalid URL rate (Target: 0.0%).

### Experiment 4: LLM Boundary & Hallucination Invariant
- **Hypothesis**: Supplying the LLM strictly with structured milestone IDs, verified skill names, and fixed graph topology as a prompt constraint eliminates ungrounded hallucinated skills while allowing creative pedagogical milestone descriptions.
- **Metrics**: Hallucination Rate (Target: 0.0% ungrounded skills), Schema Conformity Rate (Target: 100%), Prompt Injection Resistance.

---

## 3. Experiment Execution Protocol

1. **Pre-test check**: Ensure database is seeded with `python scripts/seed_db.py`.
2. **Execution**: Run `python evaluation/baselines/run_baseline_evaluation.py`.
3. **Artifact Recording**: Record output json in `evaluation/results/` with git commit SHA and configuration parameters.
4. **Regression Check**: Automated assertion that Roadmap Invariant Violations remains strictly `0`.
