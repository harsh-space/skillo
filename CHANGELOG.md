# Changelog

All notable changes to this project are documented here, organized by release.

---

## [Unreleased — v2 Development]

> v2 is in the planning stage. See [`docs/v2-planning/`](docs/v2-planning/) for the problem statement, architecture design, and experiment definitions.

---

## [v1.1.0] — Stabilization Release

> The final corrected, honest, and reproducible version of the original hackathon architecture.
> This is the **Phase 1 freeze point** and the baseline for all v2 measurements.

### Fixed

- **Cosine Similarity Bounds**: Similarity scores in the goal parser were not strictly bounded and could exceed `1.0`. Fixed by clamping all similarity values to `[0.0, 1.0]` after alias boost application.
- **Hardcoded Python Similarity Exception**: The skill gap analyzer previously contained a hardcoded rule forcing `Python (basic)` vs `Python (advanced)` to be treated as a mismatch regardless of the cosine score. Removed entirely — the character n-gram TF-IDF model naturally produces a sub-threshold score for this pair.
- **Goal Fallback Label**: Unrecognized career goal queries previously silently returned a default role. Fixed so that all low-confidence parses explicitly include a `low confidence` label in the parsed intent field.
- **DAG Cycle Handling**: The prerequisite graph path generator previously silently fell back to an unordered list when a cycle was detected. Now raises a structured error and logs cycle details explicitly. (Note: the seeded taxonomy has 0 cycles.)
- **Roadmap Deletion Lifecycle**: Deleting a roadmap from the History drawer previously reappeared on page refresh due to an automatic re-seeding fallback in `GET /history/{learner_id}`. Removed the fallback entirely. Deletion now permanently removes the entry from both `roadmap_history` and `roadmaps` collections.
- **Active Roadmap Auto-Generation**: `GET /roadmap/{learner_id}` previously auto-generated a new roadmap when none existed. Now returns `HTTP 404`. Roadmaps are only created via explicit user-triggered `POST /recommend`.
- **Password Security**: Replaced fast SHA-256 password hashing with bcrypt adaptive hashing (`bcrypt.hashpw` + per-user salt), matching security best practices.
- **Authorization Enforcement**: Added learner ownership verification (Bearer token check) to all protected routes. Requests with mismatched tokens return `HTTP 403`.
- **CORS Hardening**: Replaced wildcard `*` CORS origin with strict `ALLOWED_ORIGINS` environment variable configuration.
- **Profile Integrity**: Requests for non-existent learner profiles now return `HTTP 404` rather than silently creating empty profiles or returning empty data.

### Documentation

- **README Rewrite**: Rewrote the top-level `README.md` from scratch to accurately reflect the actual v1.1 implementation, ML stack, architecture, and dataset counts.
- **Corrected ML Stack Documentation**: Previous README described `all-MiniLM-L6-v2` sentence-transformers as the ML backbone. Updated to accurately document Character n-gram TF-IDF with Cosine Similarity as the actual implementation.
- **Corrected Dataset Counts**: Dataset counts in documentation now match actual seeded data (36 skills, 6 roles, 29 prerequisite edges, 49 resources).
- **Architecture Diagrams**: Replaced inaccurate static PNG architecture diagrams with accurate centered images (`career_ai_pipeline_flow.png`, `career_ai_full_detail_flow.png`).
- **v1.1 Architecture Snapshot**: Created `docs/v1.1-architecture-snapshot.md` as a permanent reference document for the Phase 1 system design.
- **Limitations Document**: Created `docs/v1.1-limitations.md` documenting honest current constraints of the ML, recommendation, data, and LLM subsystems.
- **CHANGELOG**: Added this file.

### Testing

- **Expanded Test Suite**: Grew backend pytest suite from 7 to 21 tests covering ML correctness, DAG validation, taxonomy integrity, security, and API behavior.
- **Roadmap Deletion Lifecycle Test**: Added `test_roadmap_deletion_and_history_lifecycle` verifying end-to-end deletion does not ghost-resurface roadmaps.
- **Similarity Bound Tests**: Added `test_cosine_similarity_bounded` and `test_similarity_score_clamped` verifying scores are mathematically valid.
- **Prerequisite-Order Invariants**: Added `test_dag_no_cycles` using NetworkX cycle detection on the full prerequisite graph.
- **Taxonomy Validation**: Added `test_seed_counts_exact`, `test_no_orphaned_prereq_ids`, and `test_no_orphaned_resource_skill_ids`.
- **Security Tests**: Added `test_password_hash_is_bcrypt`, `test_password_verify_correct`, `test_password_verify_wrong`.
- **API Behavior Tests**: Added `test_api_unknown_learner_returns_404` and `test_auth_signup_login_roundtrip`.

### Evaluation

- **ML Baseline Established**: Created `BASELINE.md` with goal classification accuracy (12/12 correct on diverse test set), DAG validity, gap coverage by role, and security summary.
- **Evaluation Framework Created**: Created `evaluation/` directory with structured goal classification benchmark, skill gap benchmark, roadmap invariant tests, failure case dataset, performance benchmarks, and README.

### Not Changed

> These items were explicitly **not** changed in v1.1. They define the boundary between v1.1 and v2.

- Core TF-IDF character n-gram semantic matching architecture.
- Global cosine similarity threshold (τ = 0.60).
- NetworkX DAG-based prerequisite graph and topological ordering.
- Rule-based adaptive feedback (score-threshold mutation: `<50%` → remedial, `≥90%` → accelerate).
- Manual skill taxonomy (no automated taxonomy expansion).
- Resource selection (first matching resource per skill, no ranking model).
- Frontend UI architecture and component structure.
- Dual-tier storage engine (Firestore + local JSON fallback).

---

## [v1.0-hackathon] — Original Hackathon Submission

> Initial working prototype submitted for the HCLTech AI Challenge.

### Features at Submission

- Natural language goal parsing with character n-gram TF-IDF and alias keyword boosts.
- Skill gap analysis using cosine similarity matrix against curated role taxonomy.
- Prerequisite-respecting DAG learning path generation using NetworkX topological sort.
- Fact-grounded XAI rationale synthesis from graph dependency structure.
- Adaptive quiz feedback loop with remedial insertion and skip-acceleration rules.
- Dual-tier persistence: Firebase Firestore with transparent local JSON fallback.
- Next.js frontend with onboarding wizard, roadmap timeline dashboard, and quiz modals.
- FastAPI backend with RESTful endpoints for all operations.
- Docker containerization for deployment.
