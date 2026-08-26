# context.md — What Exactly We Are Building

This document narrows HCL's brief (see `PRD.md`) into a concrete, buildable MVP scope. Where HCL's brief is open-ended, this document makes an explicit choice so the team isn't debating scope mid-build. Every scoping decision below is a recommendation to adopt or override as a team — flag anything you want changed before building starts.

---

## 1. One-Line Description

A web app where a learner types their career goal in plain English, gets a personalized, explainable, prerequisite-ordered learning roadmap built from their current skills, and watches that roadmap adapt as they complete quizzes/modules.

---

## 2. Scope Decision: Single Domain Track

To make the AI genuinely work well (rather than shallowly "supporting everything"), the MVP targets **one domain**: **Software/Web Development career paths** (e.g., target roles like "Frontend Developer," "Backend Developer," "Data Analyst," "ML Engineer").

Rationale: this is the domain the team already has technical fluency in, making it fast to curate a believable, accurate course/skill dataset — and judges explicitly reward a working system over a broad-but-shallow one (Functionality is the single highest-weighted criterion).

*(If your team has stronger data/content in another domain, swap the domain — the architecture doesn't change.)*

---

## 3. Core User Flow (the exact thing to build)

```
1. Learner signs in (simple auth or even a name-based session for the demo)
2. Onboarding: learner states current skills (multi-select or free text) 
   and career goal (free text, e.g. "I want to become a backend developer")
3. System (Conversational Interface) parses the goal → structured target role + target skills
4. System (Profiling Engine) builds/updates the learner's skill profile
5. System (Recommendation Engine) runs Skill Gap Analysis:
   target skills − learner's current skills = gap
6. System (Path Engine) orders the gap into a roadmap respecting prerequisites (DAG)
7. Dashboard renders the roadmap: courses/projects/assessments in sequence
8. Each roadmap item shows an "Explain" affordance → 
   XAI Engine generates a plain-language justification
9. Learner marks an item complete / takes a quiz → score submitted
10. Adaptive Feedback Loop re-ranks/adjusts the remaining path based on that signal
11. Dashboard updates: progress, skill graph, milestones, "what's next"
```

Steps 3–10 are the parts that must be real, working logic — this is the spine of the demo video and the live pitch.

---

## 4. User Personas

**Persona A — "The Career Switcher"**
A student who knows Python basics and wants to become a backend developer but doesn't know what order to learn things in (APIs? Databases? Auth? Deployment?).

**Persona B — "The Skill Gap-Filler"**
A student who has done a few scattered courses and wants the system to tell them what's *missing* to be job-ready for a specific role, not another generic course list.

Use these two personas when scripting the demo video — showing the system solve both problems (goal-driven + gap-driven) demonstrates breadth without needing extra domains.

---

## 5. MVP Feature List

### Must-Have (build these first — this is the judged core)
- [ ] Free-text goal input → structured target skills (LLM-based parsing)
- [ ] Learner profile with current skills (manual entry is fine for MVP — no need for resume parsing)
- [ ] Skill Gap Analysis via embedding similarity between learner skills and target-role skill requirements
- [ ] Prerequisite-respecting roadmap generation (DAG + topological sort) over a curated course/skill dataset
- [ ] Roadmap displayed as an ordered list/timeline with course → project → assessment structure
- [ ] Per-item "Why this?" explanation, generated from real gap-analysis + prerequisite data (not hardcoded strings)
- [ ] A feedback action (mark complete / submit quiz score) that visibly changes the remaining roadmap
- [ ] Dashboard: current progress, skills acquired vs. remaining, next recommended item

### Nice-to-Have (only after the must-haves fully work)
- [ ] Chat-style Q&A about the roadmap ("why not X instead?")
- [ ] Skill graph visualization (node graph, not just a list)
- [ ] Multiple target roles to choose from, comparison view
- [ ] Downloadable/shareable roadmap

### Explicitly Out of Scope
- Resume/LinkedIn import
- Real course content/video hosting (link out to real external courses by name/URL is enough)
- Multi-domain support beyond the one chosen track
- True reinforcement learning (use rule-based re-ranking, and say so honestly in the docs)
- User authentication hardening beyond a basic login/session

---

## 6. Worked Example (use this exact scenario to validate the build)

**Input**: Learner profile — knows: `HTML, CSS, basic Python`. Goal (free text): *"I want to become a backend developer."*

**Expected system behavior**:
1. Goal parser extracts target role: `Backend Developer`, target skills: `[Python (advanced), REST APIs, SQL/Databases, Authentication, Git, Deployment/Docker, ...]`
2. Gap analysis: learner has `HTML, CSS, basic Python` → overlaps weakly with `Python`, no overlap with the rest → gap = `[Python (advanced), REST APIs, SQL/Databases, Authentication, Git, Deployment]`
3. Prerequisite graph says: `Python (advanced)` before `REST APIs`; `REST APIs` + `SQL/Databases` before `Authentication`; `Authentication` before `Deployment`
4. Generated roadmap (in order): Python (advanced) → SQL/Databases → REST APIs → Git → Authentication → Deployment/Docker, each with a linked course/resource and a project checkpoint
5. Explanation for "REST APIs" item: *"Recommended after Python and before Authentication — REST APIs is a direct prerequisite for building the Authentication module in your target role, and closes a skill gap identified from your goal."*
6. Learner completes a "Python (advanced)" quiz scoring 40% → Adaptive Loop inserts a remedial "Python fundamentals refresher" step before continuing, and dashboard reflects the change.

If your running MVP reproduces this exact scenario correctly, the core judged functionality is done.

---

## 7. Data Requirements

**Skill taxonomy**: a flat list of ~30–50 skills relevant to the chosen domain (e.g., Python, SQL, REST APIs, Git, Docker, System Design, React, etc.), each with a short description (used for embeddings).

**Role → required skills mapping**: 3–5 target roles (Backend Developer, Frontend Developer, Data Analyst, ML Engineer, DevOps Engineer), each mapped to its required skill set.

**Prerequisite graph**: directed edges between skills (`SQL → Authentication`, `Python → REST APIs`, etc.) — hand-curated, ~40–60 edges is plenty for a convincing demo.

**Course/resource catalog**: 1–3 real, linkable resources per skill (can be real course URLs — no need to host content). A small hand-curated CSV/JSON (~50–100 rows) is sufficient and safer than scraping under time pressure.

All of the above can be static seed data (JSON/CSV loaded into the database at startup) — dynamically scraping a live catalog is unnecessary risk for a 6-day build.

---

## 8. Explicit MVP Boundary Statement

**We are building**: a single-domain (software/web dev), single-user-flow, end-to-end working prototype that takes a stated goal + stated skills, produces an explainable, prerequisite-ordered roadmap from a curated dataset, and visibly adapts to one feedback signal (quiz score / completion).

**We are not building**: a multi-domain platform, a system with real course content, a trained-from-scratch ML model, or a production system with real users' data at scale.
