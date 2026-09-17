# Skillo AI — Evaluation & Baseline Metrics (v1.1.0)

**Date**: 2026-09-17  
**Release**: v1.1.0 (Stabilization)  
**Status**: Verified & Reproducible

---

## 1. Taxonomy Integrity & Dataset Counts

| Entity | Verified Count | Integrity Check |
|---|---|---|
| **Skills** | **36** | Complete descriptions & categorizations |
| **Career Roles** | **6** | Frontend, Backend, Full Stack, ML, AI, DevOps |
| **Prerequisite Edges** | **29** | 100% valid node IDs, Directed Acyclic Graph (DAG) |
| **Learning Resources** | **49** | Courses, documentations, and remedial refreshers |

---

## 2. Graph Theoretical Properties

- **DAG Validity**: `nx.is_directed_acyclic_graph = True` (0 cycles)
- **Longest Prerequisite Chain**: **5 edges**
- **Critical Path Example**: `Python (basic) -> Data Analysis & Pandas -> Machine Learning Fundamentals -> Deep Learning & PyTorch -> LLM Applications & RAG Systems -> Vector Databases & Embeddings`

---

## 3. ML Goal Classification Benchmark

- **Test Suite**: 12 diverse natural language career intent queries across all 6 career paths
- **Algorithm**: Character n-gram TF-IDF vectorization (`char_wb`, ngrams 3–5) + Cosine similarity (bounded ≤ 1.0) with alias boosts
- **Accuracy**: **12/12 (100.0%)**

| Query | Expected Role | Predicted Role | Status |
|---|---|---|:---:|
| "I want to become a backend developer building APIs and servers" | `role_backend_developer` | `Backend Developer` | ✅ PASS |
| "I want to learn database design, SQL, and FastAPI services" | `role_backend_developer` | `Backend Developer` | ✅ PASS |
| "I want to become a frontend engineer with React and CSS" | `role_frontend_developer` | `Frontend Developer` | ✅ PASS |
| "I want to design responsive user interfaces and modern web applications" | `role_frontend_developer` | `Frontend Developer` | ✅ PASS |
| "I want to become an AI engineer building LLMs and RAG agents" | `role_ai_engineer` | `AI Engineer` | ✅ PASS |
| "I want to build generative AI solutions and prompt pipelines" | `role_ai_engineer` | `AI Engineer` | ✅ PASS |
| "I want to build machine learning models and train neural networks" | `role_ml_engineer` | `Machine Learning Engineer` | ✅ PASS |
| "I want to work in data science, predictive modeling, and deep learning" | `role_ml_engineer` | `Machine Learning Engineer` | ✅ PASS |
| "I want to become a devops engineer managing cloud and kubernetes" | `role_devops_engineer` | `DevOps Engineer` | ✅ PASS |
| "I want to set up CI/CD pipelines, terraform infrastructure, and docker" | `role_devops_engineer` | `DevOps Engineer` | ✅ PASS |
| "I want to be a fullstack developer creating complete end to end apps" | `role_fullstack_developer` | `Full Stack Developer` | ✅ PASS |
| "I want to master MERN stack and frontend plus backend development" | `role_fullstack_developer` | `Full Stack Developer` | ✅ PASS |

---

## 4. Gap Analysis Coverage (Zero Prior Skills)

| Role | Total Skills in Roadmap Gap |
|---|:---:|
| **Backend Developer** | 8 skills |
| **Frontend Developer** | 8 skills |
| **Full Stack Developer** | 10 skills |
| **DevOps Engineer** | 7 skills |
| **Machine Learning Engineer** | 8 skills |
| **AI Engineer** | 8 skills |

---

## 5. Security & Verification Summary

- **Password Hashing**: `bcrypt` (adaptive work factor + auto salt)
- **CORS Handling**: `ALLOWED_ORIGINS` environment variable
- **API Error Handling**: HTTP 404 on missing learner profiles
- **Data Protection**: Local credentials and `.env` securely gitignored
