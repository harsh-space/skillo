"""
Skillo AI v1.1 — Baseline Evaluation Runner
============================================

Runs the goal classification benchmark, skill gap analysis benchmark,
and roadmap invariant checks. Outputs structured results to
evaluation/results/baseline_results.json.

Usage:
    cd <project_root>
    python evaluation/baselines/run_baseline_evaluation.py

Requirements:
    - Backend dependencies installed (pip install -r backend/requirements.txt)
    - Taxonomy seeded (python scripts/seed_db.py)
"""

import json
import sys
import time
import statistics
import os
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add project root and backend to path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from backend.app.services.goal_parser import _semantic_embed_parse
from backend.app.services.gap_analysis import run_gap_analysis
from backend.app.services.path_generator import generate_learning_path
from backend.app.services.db import db

DATASETS_DIR = PROJECT_ROOT / "evaluation" / "datasets"
RESULTS_DIR = PROJECT_ROOT / "evaluation" / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Goal Classification Benchmark
# ─────────────────────────────────────────────────────────────────────────────

def run_goal_classification_benchmark():
    print("\n[1] Running Goal Classification Benchmark...")

    with open(DATASETS_DIR / "goal_classification_benchmark.json") as f:
        cases = json.load(f)

    roles = db.list_documents("roles")
    skills = db.list_documents("skills")

    # Only evaluate cases with a single clear expected role
    clear_cases = [c for c in cases if isinstance(c.get("expected_role_id"), str) and c.get("expected_role_id")]

    correct = 0
    total = len(clear_cases)
    results = []
    latencies = []

    for case in clear_cases:
        query = case["query"]
        expected_id = case["expected_role_id"]
        t0 = time.perf_counter()
        parsed = _semantic_embed_parse(query, roles, skills)
        latency_ms = (time.perf_counter() - t0) * 1000
        latencies.append(latency_ms)
        predicted_id = parsed.target_role_id
        status = "PASS" if predicted_id == expected_id else "FAIL"
        if status == "PASS":
            correct += 1
        results.append({
            "query": query,
            "type": case.get("type", "clear"),
            "expected_role_id": expected_id,
            "predicted_role_id": predicted_id,
            "status": status,
            "latency_ms": round(latency_ms, 2)
        })
        print(f"  [{status}] '{query[:60]}...' → {predicted_id}")

    accuracy = correct / total if total > 0 else 0.0
    p50 = statistics.median(latencies)
    p95 = sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0.0

    summary = {
        "total": total,
        "correct": correct,
        "accuracy": round(accuracy, 4),
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "results": results
    }
    print(f"\n  → Accuracy: {correct}/{total} ({accuracy * 100:.1f}%)")
    print(f"  → Latency P50: {p50:.1f}ms  P95: {p95:.1f}ms")
    return summary


# ─────────────────────────────────────────────────────────────────────────────
# 2. Skill Gap Benchmark
# ─────────────────────────────────────────────────────────────────────────────

def run_skill_gap_benchmark():
    print("\n[2] Running Skill Gap Benchmark...")

    with open(DATASETS_DIR / "skill_gap_benchmark.json") as f:
        cases = json.load(f)

    # Only evaluate exact MATCH / GAP cases (not PARTIAL_MATCH for now)
    binary_cases = [c for c in cases if c["expected_relationship"] in ("MATCH", "GAP")]

    tp = fp = tn = fn = 0
    results = []
    latencies = []

    for case in binary_cases:
        req_skill = case["required_skill"]
        req_skill_id = case["required_skill_id"]
        learner_skill = case["learner_skill"]
        expected = case["expected_relationship"]

        t0 = time.perf_counter()
        gap_result = run_gap_analysis(
            current_skills=[learner_skill],
            target_role_id="role_backend_developer"  # dummy role — we inspect just this pair
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        latencies.append(latency_ms)

        # Find the specific skill in results
        detail = next((d for d in gap_result.details if d.skill_id == req_skill_id), None)
        if detail is None:
            predicted = "GAP"  # not in role's required skills — skip
        else:
            predicted = "MATCH" if detail.status == "matched" else "GAP"

        status = "PASS" if predicted == expected else "FAIL"
        sim_score = detail.similarity_score if detail else 0.0

        if expected == "MATCH" and predicted == "MATCH":
            tp += 1
        elif expected == "GAP" and predicted == "GAP":
            tn += 1
        elif expected == "MATCH" and predicted == "GAP":
            fn += 1
        elif expected == "GAP" and predicted == "MATCH":
            fp += 1

        results.append({
            "required_skill": req_skill,
            "learner_skill": learner_skill,
            "expected": expected,
            "predicted": predicted,
            "similarity_score": sim_score,
            "status": status,
            "latency_ms": round(latency_ms, 2)
        })
        print(f"  [{status}] {req_skill!r} vs {learner_skill!r} → sim={sim_score:.3f} predicted={predicted}")

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    p50 = statistics.median(latencies) if latencies else 0.0
    p95 = sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0.0

    summary = {
        "total_binary_cases": len(binary_cases),
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "results": results
    }
    print(f"\n  → Precision: {precision:.3f}  Recall: {recall:.3f}  F1: {f1:.3f}")
    print(f"  → Latency P50: {p50:.1f}ms  P95: {p95:.1f}ms")
    return summary


# ─────────────────────────────────────────────────────────────────────────────
# 3. Roadmap Invariant Checks
# ─────────────────────────────────────────────────────────────────────────────

def run_roadmap_invariant_checks():
    print("\n[3] Running Roadmap Invariant Checks...")
    roles = db.list_documents("roles")
    all_skills = db.list_documents("skills")
    all_resources = db.list_documents("resources")
    prereqs = db.list_documents("prerequisites")

    skill_ids = {s["skill_id"] for s in all_skills}
    resource_skill_ids = {r["skill_id"] for r in all_resources}

    violations = {
        "duplicate_skills_in_roadmap": [],
        "prerequisite_order_violations": [],
        "missing_skill_ids": [],
        "missing_resources": [],
    }

    # Build prerequisite lookup
    prereq_map = {}  # skill_id → set of prerequisite skill_ids
    for p in prereqs:
        to_id = p["to_skill_id"]
        from_id = p["from_skill_id"]
        prereq_map.setdefault(to_id, set()).add(from_id)

    role_results = []
    latencies = []

    for role in roles:
        role_id = role["role_id"]
        role_name = role["name"]
        required_skill_ids = role.get("required_skills", [])

        t0 = time.perf_counter()
        # Run gap analysis with 0 current skills → all required skills are gaps
        gap = run_gap_analysis([], role_id)
        steps = generate_learning_path(
            missing_skill_ids=gap.missing_skills,
            current_skill_ids=[],
            gap_scores={d.name: d.similarity_score for d in gap.details}
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        latencies.append(latency_ms)

        step_skill_ids = [s.skill_id for s in steps]
        seen_skills = set()
        duplicates = []
        prereq_violations = []
        missing_ids = []
        missing_res = []

        for i, step in enumerate(steps):
            # Duplicate check
            if step.skill_id in seen_skills:
                duplicates.append(step.skill_id)
            seen_skills.add(step.skill_id)

            # Missing skill ID check
            if step.skill_id not in skill_ids:
                missing_ids.append(step.skill_id)

            # Missing resource check
            if step.skill_id not in resource_skill_ids:
                missing_res.append(step.skill_id)

            # Prerequisite order check
            for prereq_id in prereq_map.get(step.skill_id, set()):
                if prereq_id in [s.skill_id for s in steps]:  # only check if prereq is in roadmap
                    prereq_position = next((j for j, s in enumerate(steps) if s.skill_id == prereq_id), None)
                    if prereq_position is not None and prereq_position > i:
                        prereq_violations.append({
                            "skill": step.skill_id,
                            "prerequisite": prereq_id,
                            "skill_position": i,
                            "prereq_position": prereq_position
                        })

        role_result = {
            "role_id": role_id,
            "role_name": role_name,
            "total_steps": len(steps),
            "latency_ms": round(latency_ms, 2),
            "violations": {
                "duplicates": duplicates,
                "prerequisite_order_violations": prereq_violations,
                "missing_skill_ids": missing_ids,
                "missing_resources": missing_res
            },
            "pass": not duplicates and not prereq_violations and not missing_ids and not missing_res
        }
        status = "PASS" if role_result["pass"] else "FAIL"
        print(f"  [{status}] {role_name}: {len(steps)} steps, {len(prereq_violations)} prereq violations, {len(duplicates)} duplicates")
        role_results.append(role_result)

    total_violations = sum(
        len(r["violations"]["duplicates"]) +
        len(r["violations"]["prerequisite_order_violations"]) +
        len(r["violations"]["missing_skill_ids"]) +
        len(r["violations"]["missing_resources"])
        for r in role_results
    )
    p50 = statistics.median(latencies) if latencies else 0.0
    p95 = sorted(latencies)[int(0.95 * len(latencies))] if latencies else 0.0

    print(f"\n  → Total invariant violations: {total_violations}")
    print(f"  → Latency P50: {p50:.1f}ms  P95: {p95:.1f}ms")
    return {
        "total_violations": total_violations,
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "role_results": role_results
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main Runner
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Skillo AI — v1.1 Baseline Evaluation")
    print("=" * 60)

    results = {
        "version": "v1.1.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "goal_classification": run_goal_classification_benchmark(),
        "skill_gap_analysis": run_skill_gap_benchmark(),
        "roadmap_invariants": run_roadmap_invariant_checks()
    }

    output_path = RESULTS_DIR / "v1.1_baseline_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 60)
    print(f"  Results saved to: {output_path}")
    print("=" * 60)

    # Print summary
    gc = results["goal_classification"]
    sg = results["skill_gap_analysis"]
    ri = results["roadmap_invariants"]
    print(f"\n  SUMMARY")
    print(f"  ─────────────────────────────────────────")
    print(f"  Goal Classification Accuracy : {gc['accuracy'] * 100:.1f}%  ({gc['correct']}/{gc['total']})")
    print(f"  Goal Classification P50      : {gc['p50_latency_ms']:.1f}ms")
    print(f"  Skill Gap F1 Score           : {sg['f1']:.3f}")
    print(f"  Skill Gap Precision          : {sg['precision']:.3f}")
    print(f"  Skill Gap Recall             : {sg['recall']:.3f}")
    print(f"  Roadmap Invariant Violations : {ri['total_violations']}")
    print(f"  Roadmap Generation P50       : {ri['p50_latency_ms']:.1f}ms")
    print(f"  ─────────────────────────────────────────")


if __name__ == "__main__":
    main()
