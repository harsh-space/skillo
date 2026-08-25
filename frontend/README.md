# Pathfinder AI — Frontend Web Application

Modern Next.js 14 web application featuring dark-mode glassmorphic aesthetics, interactive roadmap timelines, grounded Explainable AI (XAI) drawers, real-time DAG competency visualization, and adaptive assessment simulation.

---

## 🎨 UI Features & Component Structure

- `components/GoalInput.tsx`: Onboarding screen with searchable competency badges, natural-language goal input, and one-click benchmark persona presets.
- `components/Dashboard.tsx`: High-level command center displaying target role, progress metrics, and adaptive signals.
- `components/RoadmapTimeline.tsx`: Topologically ordered learning sequence with status badges, direct prerequisite chips, and external learning resource cards.
- `components/XaiDrawer.tsx`: Grounded Explainable AI rationale modal highlighting dependency graph constraints and gap similarity indices.
- `components/QuizModal.tsx`: Interactive assessment simulator triggering real-time roadmap adaptations.
- `components/SkillGraphVisualizer.tsx`: Visual overview of mastered, in-progress, gap, and remedial skills.

---

## 🚀 Running Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.
