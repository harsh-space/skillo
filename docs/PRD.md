# Product Requirements Document (PRD)
## AI-Powered Personalized Learning Path Recommender
### HCLTech AMPlified · Season 1 · 2026 — Round 2 (Pathfinder Prototype)

---

## 1. Document Purpose

This PRD captures every requirement, constraint, and evaluation criterion issued by HCLTech/HackerEarth for the Round 2 "Pathfinder Prototype" challenge, so the team builds exactly what is being judged — nothing more, nothing less — within the available time.

---

## 2. Event Context

| Field | Value |
|---|---|
| Event | HCLTech AMPlified · Season 1 · 2026 (powered by HackerEarth) |
| Current stage | Round 2 — Pathfinder Prototype |
| Format | Team round — 3 to 5 members per team |
| Eligibility | Every team member must have cleared Round 1 and be on their college's AMPlified roster. Solo entries are not accepted in Round 2. |
| Round 2 opened | Tue, 11 Aug 2026 |
| Submission deadline | **Sun, 30 Aug 2026, 23:59 IST** |
| Evaluation window | 3 days after close |
| Top 25 announced | Thu, 3 Sep 2026 |
| Live judging (Top 25 pitch) | Wed, 9 Sep 2026 |
| Winners announced | Fri, 11 Sep 2026 |
| Prizes | MacBook 13", iPad Air M4, iPad A16 |
| Scoring | One score per team — every member gets the same score. Only one submission per team is evaluated (nominate a captain on HackerEarth). |

---

## 3. Problem Statement (as issued by HCLTech)

Online learning platforms offer thousands of courses across diverse domains. While recommendation systems can suggest relevant courses, learners often struggle to identify the right *sequence* of resources needed to reach a specific goal. Learners differ in skill level, interests, career aspirations, and learning preferences — so a one-size-fits-all approach doesn't work.

An AI-powered Personalized Learning Path Recommender should bridge this gap by:
- understanding a learner's profile,
- analyzing their learning objectives,
- identifying skill gaps,
- and generating a structured roadmap of courses, projects, and assessments tailored to the individual.

## 4. Stated Goal (as issued by HCLTech)

> Design and build an intelligent learning assistant that recommends personalized learning paths based on a learner's interests, goals, previous learning history and skill level. The solution should generate a structured learning roadmap, explain its recommendations, and adapt suggestions based on user feedback and progress.

---

## 5. Functional Requirements

These map directly to the official system architecture diagram and "Key Modules & Capabilities" section of the brief. Every box in HCL's architecture diagram must be represented by working code — this is explicitly part of what's judged (see §8).

### 5.1 Conversational Interface (NLP)
- Accepts natural-language description of a career/learning goal.
- Performs goal extraction — parses free text into structured target competencies.
- Supports interactive Q&A / feedback (learner can ask "why this course?" or similar).

### 5.2 Learner Profiling Engine
- Maintains a dynamic learner profile: baseline skills, completed coursework, interests, target outcomes.
- Skill Matrix Mapping — represent learner's current skills in a structured, comparable form.
- Tracks experience & history.
- Captures career preferences.

### 5.3 Recommendation & Path Engine
- Skill Gap Analysis — compares learner profile against the target role/skill vector to find missing competencies.
- Sequence/Roadmap Generator — orders the gap-filling items into a coherent path.
- Prerequisites & Milestones — respects dependency order (can't recommend an advanced topic before its prerequisite).

### 5.4 Explainable AI (XAI) Engine
- Justification Generation — every roadmap item must come with a plain-language reason ("why this, why now").
- Dynamic Adaptive Loop — the explanation and path must be able to change as new information arrives (quiz results, feedback).
- Must field learner queries about the path (interactive explainability, not just static text).

### 5.5 Interactive Analytics Dashboard
- Visualizes skill progression.
- Shows completed milestones.
- Shows current progress.
- Shows recommended next steps.

### 5.6 Adaptive Feedback Loop
- Recalibrates recommendations in response to: quiz results, module completions, explicit user feedback.

---

## 6. Non-Functional Requirements

- **Functionality first**: core flows must actually run end-to-end, not be mockups (explicitly called out as a judging factor).
- **Real AI/ML in the loop**: profiling, recommendation, and adaptation must use genuine models/logic — not hardcoded fake output. Judges expect the team to be able to explain the models and data used.
- **Usability**: a first-time learner should be able to navigate the product without hand-holding.
- **Code quality**: clean, readable, modular code; realistic performance on realistic inputs; clean git history reflecting distributed contribution across the team.
- **Deployability**: preferably a live, deployed URL judges can open directly. If not deployed, the README must give clear, reliable local setup/execution instructions as fallback.

---

## 7. Required AI/ML Techniques (explicitly named in the brief)

The brief names specific techniques HCL expects to see reflected in the solution:

| Technique | Purpose |
|---|---|
| Goal Extraction & NLP Parsing | Intent recognition + entity extraction to turn a raw user query into structured target competencies |
| Skill Gap Analysis | Graph-based trajectory matching *or* vector similarity search, comparing user profile vectors against target skill vectors |
| Topological Sequence Generation | DAG (Directed Acyclic Graph) sorting to guarantee prerequisites are satisfied before downstream content |
| Explainability Engine | Translates matrix/embedding distances and prerequisite dependencies into plain-language explanations |
| Adaptive Re-Ranking | Reinforcement learning *or* rule-based feedback heuristics that adjust the remaining path based on scores/feedback |

Note: the brief explicitly allows rule-based approaches as an alternative to more complex ML (graph-based *or* vector similarity; RL *or* rule-based) — this matters for scoping the MVP realistically within days, not weeks.

---

## 8. Evaluation Criteria & Weightage (fixed for Season 1)

| Criterion | Weight | What it rewards |
|---|---|---|
| Functionality & Feature Completeness | 25% | End-to-end working execution across conversational UI, profiling engine, path generator, explainability mechanism, and dashboard |
| Problem Understanding & Solution Design | 20% | Comprehensive domain framing, end-to-end architecture, alignment with the brief |
| AI/ML Implementation | 20% | Functional ML model integration for profiling, path sequencing, justification generation, adaptive feedback logic |
| Innovation & Creativity | 15% | Novel approaches to skill-gap estimation, path visualizer design, explainability mechanisms |
| User Experience & Interface | 10% | Intuitive UX, self-guided navigation, clean design, effective data presentation |
| Performance & Code Quality | 10% | Clean code structure, modularity, robust execution, clean repo history |

**Implication for prioritization**: Functionality (25%) + AI/ML (20%) + Problem Understanding (20%) = 65% of the score. Get the end-to-end flow genuinely working with real (even if simple) AI/ML logic before investing in UI polish or "wow" features.

---

## 9. Required Submission Deliverables

All five items must be submitted on HackerEarth before **Sun, 30 Aug 2026, 23:59 IST**. Incomplete submissions are not evaluated.

1. **Source Code (ZIP)**
   - Standard archive, no virtual environments or build artifacts (exclude `.venv`, `node_modules`, `__pycache__`, build outputs).
   - Must include a README with step-by-step setup and execution instructions.
2. **Source Code Repository**
   - Public or access-shared GitHub link.
   - Commit history must demonstrate active, distributed development across the team.
3. **Solution Documentation (PDF/PPT)**
   - Problem understanding and solution approach.
   - System architecture and AI/ML algorithms/techniques used.
   - Key features and core workflows.
   - Engineering challenges faced and how they were resolved.
4. **Demo Video (3–5 minutes)**
   - Walkthrough of core functionality and user experience.
   - Demonstration of the end-to-end execution flow.
5. **Application Access**
   - Primary: a deployed application URL.
   - Fallback: standardized local deployment instructions in the README.

---

## 10. Constraints & Rules

- Team size: 3–5 members, formed on HackerEarth.
- Every member must have cleared Round 1 and be on the college roster.
- Only one submission is evaluated per team; nominate a captain to manage final submission.
- Submissions must be original — plagiarism checks apply.
- Do not share solution/dataset publicly during the live window.

---

## 11. Out of Scope for the MVP (explicitly deprioritized given the timeline)

- Training large custom ML models from scratch (embedding/LLM APIs and lightweight models are acceptable and expected).
- Production-grade authentication, payments, or multi-tenant security hardening.
- A course catalog spanning "all domains" — a focused, well-populated single track is stronger than a shallow, broad one.
- True reinforcement learning for adaptive re-ranking — the brief explicitly permits rule-based heuristics as an equally valid approach.
- Mobile app / native clients — a responsive web app is sufficient.

---

## 12. Success Definition

The MVP is successful if, in a single continuous demo, a judge can:
1. Enter a learning goal in plain language.
2. See the system extract structured target skills from it.
3. See a gap analysis against a stated/entered profile.
4. See a generated, prerequisite-respecting roadmap.
5. See a plain-language explanation for at least one roadmap item, generated from real signals (not hardcoded text).
6. Trigger a feedback event (e.g., a quiz score) and see the roadmap visibly adapt.
7. See progress reflected on a dashboard.

Every one of those seven steps maps to a specific line item in the judging rubric.
