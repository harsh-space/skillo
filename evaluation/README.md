# Skillo AI — Evaluation & Benchmark Suite

This directory contains the automated evaluation framework, curated benchmark datasets, and baseline metrics used to evaluate and ensure the quality of Skillo AI.

---

## 1. Directory Structure

```
evaluation/
├── README.md                                  # This documentation
├── baselines/
│   └── run_baseline_evaluation.py             # Automated benchmark runner script
├── datasets/
│   ├── goal_classification_benchmark.json     # 30 curated goal prompts across 6 target roles
│   ├── skill_gap_benchmark.json               # Labeled skill pair relationship test cases
│   └── failure_cases.json                     # Edge cases, typos, and out-of-distribution queries
└── results/
    └── v1.1_baseline_results.json             # Frozen v1.1 release gate benchmark results
```

---

## 2. Benchmark Datasets

### 2.1 Goal Classification Benchmark (`datasets/goal_classification_benchmark.json`)
- **Total Test Cases**: 30
- **Test Categories**:
  - `clear`: Standard, explicit goal statements across all 6 roles.
  - `short`: Minimalist single-token or phrase queries (e.g. `"devops"`, `"machine learning career"`).
  - `typo`: Heavily misspelled or colloquial goal descriptions (e.g. `"fruntend develper with reeact"`, `"bacend develoment"`).
  - `context_rich`: Realistic multi-sentence career background transitions.
  - `synonym`: Goals using industry synonyms rather than literal role titles (e.g. `"statistical modeling"`).

### 2.2 Skill Gap Benchmark (`datasets/skill_gap_benchmark.json`)
- **Total Test Pairs**: Labeled pairs covering:
  - Exact match (`MATCH`)
  - Semantic equivalent / synonym (`MATCH`)
  - True skill gap / distinct competency (`GAP`)
  - Subsumed / prerequisite relationship (`PARTIAL_MATCH`)

### 2.3 Failure Cases (`datasets/failure_cases.json`)
- High-difficulty edge cases, multi-target ambitions, out-of-scope requests, and semantic confounders used to test system guardrails.

---

## 3. How to Run Evaluations

To run the complete benchmark suite locally:

```bash
# 1. Ensure backend dependencies are installed
pip install -r backend/requirements.txt

# 2. Run the evaluation suite
python evaluation/baselines/run_baseline_evaluation.py
```

---

## 4. Frozen v1.1 Release Gate Baselines

Below are the official results recorded from the v1.1 release gate run:

| Metric | Result | Target for v2 |
| :--- | :--- | :--- |
| **Goal Classification Accuracy** | **76.7%** (23/30) | $\ge 90.0\%$ |
| **Goal Classification Latency (P50)** | **4.6 ms** | $< 25.0$ ms |
| **Goal Classification Latency (P95)** | **9.7 ms** | $< 50.0$ ms |
| **Skill Gap Precision** | **1.000** | $\ge 0.950$ |
| **Skill Gap Recall** | **0.600** | $\ge 0.900$ |
| **Skill Gap F1 Score** | **0.750** | $\ge 0.900$ |
| **Roadmap Invariant Violations** | **0** | **0** |
| **Roadmap Generation Latency (P50)** | **7.0 ms** | $< 20.0$ ms |
