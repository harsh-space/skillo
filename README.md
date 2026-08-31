# Skillo AI

## A personalized learning app that creates a custom career roadmap based on what you already know

> Most learning websites just show you a list of courses. Skillo AI figures out *which skills you already have*, *which ones you're missing*, and builds a step-by-step plan in the right order — and adjusts it based on how well you're doing.

> [!IMPORTANT]
> You can test the application directly using the following deployed environments:
> - **Live Web App & Full Stack API**: [skillo-frontend-amber.vercel.app](https://skillo-frontend-amber.vercel.app/)

---

## What Is Skillo AI?

Skillo AI is a web app that helps you plan your career learning path. You tell it what skills you currently have and what kind of job you want to get (for example: *"I know basic HTML and Python and want to become a backend developer"*), and it:

1. **Understands your goal** — You write your goal in plain sentences, no specific format needed. The app reads it and figures out which job role you're aiming for.
2. **Finds your skill gaps** — It compares what you already know against what the target job requires, and identifies exactly what's missing.
3. **Builds a learning plan in the right order** — Some skills depend on others (you need to know Python basics before you can learn advanced Python). Skillo AI respects these dependencies and always shows you what to learn *first*.
4. **Explains every step** — For each skill in your plan, you can click to see *why* it's there: what it builds on and what it unlocks next.
5. **Adapts based on your quiz results** — After each quiz:
   - **If you score below 50%**: A short refresher lesson is automatically added to your plan right after that step.
   - **If you score 90% or above**: Following steps that you're clearly ready for get marked as skippable.
   - **Otherwise**: Your progress moves forward and is saved.

---

## The Problem It Solves

When you search for "how to become a backend developer" online, you get a flood of articles, videos, and courses — but no guidance on *where to start* based on *what you already know*. Common issues:

1. **Search engines don't know what you already know** — They show you everything, including stuff you've already learned or don't need yet.
2. **Generic roadmaps treat everyone the same** — They assume you're starting from zero, so experienced people have to sit through things they already know.
3. **Most platforms don't explain why** — They tell you *what* to learn but not *why this topic comes before that one*.
4. **No adjustment when you struggle** — If you fail a quiz, most platforms just mark it failed. They don't change your plan to help you fill the gap.

---

## Features

- **User accounts & session saving** — Secure sign up and login so your custom roadmaps, quizzes, and completed tasks are saved to your personal profile.
- **Plain-language goal input** — Just type what you want to become. No dropdowns or complicated forms needed.
- **Skill gap detection** — Shows exactly which skills you're missing versus which ones you already have.
- **Ordered learning plan** — Steps are arranged so each one builds naturally on the previous one.
- **"Why is this here?" explanations** — Click any step to get a clear explanation of why it comes at that point in your plan.
- **Quizzes with real-time plan adjustment** — Your roadmap actually changes based on your quiz results.
- **Progress tracking** — Your completed steps, percentage progress, and quiz history are all saved.
- **Career history sidebar** — Like a chat history in ChatGPT, you can switch between different career paths you've explored before, and your full roadmap is restored instantly.
- **Ultra-lightweight & cloud ready** — Uses under 60MB of RAM, making it fast and completely free to host on platforms like Render and Vercel.
- **Works offline too** — If no internet database is connected, everything automatically saves locally on your machine.

---

## Supported Career Paths

Skillo AI currently supports 6 career paths:

<div align="center">

| Career Path | What You'll Learn |
|:---:|:---|
| **Frontend Developer** | HTML, CSS, JavaScript, TypeScript, React, Next.js |
| **Backend Developer** | Python, SQL, REST APIs, Authentication, Docker |
| **Full Stack Developer** | Both frontend and backend skills combined |
| **Machine Learning Engineer** | Python, Data Analysis, ML algorithms, Deep Learning |
| **AI Engineer** | Python, ML, Deep Learning, LLMs, Vector Databases |
| **DevOps Engineer** | Linux, Git, Docker, Kubernetes, Cloud, CI/CD |

</div>

---

## System Architecture

The app is split into two main parts:

**Backend (the "brain")** — A Python server that:
- Reads your goal text and identifies which career path you're aiming for
- Checks your current skills against the requirements
- Calculates which missing skills need to come first (based on what depends on what)
- Generates the explanation for each step
- Updates your plan whenever you submit a quiz

**Frontend (what you see)** — A web interface built with Next.js that:
- Shows the onboarding wizard (name, current skills, goal)
- Displays your personalized roadmap as a visual timeline
- Shows progress stats, skill gap breakdown, and a side panel explanation
- Has a sliding history drawer to switch between past roadmaps

### How data is stored

All your progress, skills, and roadmaps are stored in a database. By default it connects to **Google Firestore** (Google's cloud database). If that's not available, it automatically falls back to a local file on your computer — no setup needed.

### How everything connects
<!-- <p align="center">
  <img src="docs\career_ai_backend_flow_architecturea.png" width="650" alt="Skillo AI Backend Flow Architecture"/>
  <br/>
  <em>Figure 1: How data flows from your goal input through to the final roadmap</em>
</p> -->

<p align="center">
  <img src="docs\career_ai_architecture_layersa.png" width="650" alt="Skillo AI Architectural Layers"/>
  <br/>
  <em>Figure 1: The different layers of the system and how they work together</em>
</p>

---

## How to Run It

### What you need installed first
- **Python 3.10 or newer**
- **Node.js 18 or newer** and **npm**

---

### Step 1 — Download the code
```bash
git clone https://github.com/harsh-space/skillo.git
cd skillo
```

### Step 2 — Set up and start the backend server
```bash
# Create an isolated Python environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate
# Activate it (Mac/Linux)
source venv/bin/activate

# Install all required Python packages
pip install -r backend/requirements.txt

# (Optional) Add your API keys to a .env file:
# GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-key.json
# GEMINI_API_KEY=your_key_here

# Fill the database with the initial skills and roles data
python scripts/seed_db.py

# Run automated tests to make sure everything works
pytest backend/tests/test_backend.py -v

# Start the backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend runs at `http://127.0.0.1:8000`. You can browse all available API endpoints at `http://127.0.0.1:8000/docs`.

### Step 3 — Set up and start the frontend (in a new terminal window)
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Alternative: Run with Docker (one command)
If you have Docker installed, you can run the whole app with:
```bash
docker build -t skillo-ai .
docker run -p 8000:8000 skillo-ai
```
---

## Try This Example

Here's a quick walkthrough to see the app in action:

1. **Sign up / log in** — Create an account on the login screen.
2. **Choose your current skills** — Select `HTML`, `CSS`, and `Python (basic)` from the skill picker.
3. **Type your goal** — Write: *"I want to become a backend developer"*
4. **See your roadmap** — Your personalized plan appears. Steps are ordered correctly: Python (advanced) → SQL → REST APIs → Git → Authentication → Docker.
5. **Click "Why this?"** on the `REST APIs` step to see the explanation:
   > *"Building on your Python and SQL knowledge, REST APIs let you expose your data to other apps — a core requirement for backend development. This unlocks Authentication and Docker next."*
6. **Take a quiz** on Step 1 (`Python (advanced)`) and choose **Score: 40% (Fail)**:
   > A **refresher lesson** is automatically added right after that step to help you before moving on.

---

## Project Folder Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # The server endpoints (what the frontend talks to)
│   │   ├── services/     # The core logic (goal reading, gap finding, path building, quizzes)
│   │   ├── models/       # Data structure definitions
│   │   ├── data/         # The skills, roles, and relationships database files
│   │   └── main.py       # The server entry point
│   ├── tests/            # Automated tests
│   └── requirements.txt  # List of Python packages needed
├── frontend/
│   ├── app/              # The main pages
│   ├── components/       # Individual UI pieces (quiz, roadmap, skill picker, etc.)
│   └── lib/              # Helpers for talking to the backend
├── docs/                 # Additional documentation and diagrams
├── scripts/
│   └── seed_db.py        # Script to pre-fill the database with skills and roles
├── Dockerfile            # Instructions to package the app into a container
└── README.md             # This file
```

---

## Current Limitations

1. **Limited career paths for now** — The app currently covers 6 software-related careers. Adding a new career (like cybersecurity or data engineering) requires adding the relevant skills and their relationships to the database.
2. **Simple quiz-based adaptation** — The plan adjusts based on fixed rules (fail → add refresher, ace → skip ahead). It doesn't yet learn from large amounts of learner data over time.
3. **Best for individual use** — Works great for one person at a time. Multi-user team management is supported when connected to the cloud database.

## What's Coming Next

1. **GitHub & LinkedIn skill detection** — Automatically read your GitHub projects to figure out what skills you already have, without you having to select them manually.
2. **Smarter adaptation over time** — Instead of fixed rules, the app would learn from what actually works for different types of learners.
3. **Team dashboards** — Let engineering managers see skill gaps across their whole team and plan training for everyone at once.
