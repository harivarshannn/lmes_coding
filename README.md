# 🚀 LMES DevArena: Multi-Module Assessment Practice Platform

Welcome to the backend API and sandbox execution environment for **LMES DevArena**, redressed in the high-fidelity, light-glassmorphic **Wrench Wise** visual system. 

The codebase has been evolved from a single-purpose Judge0 coding executor into an organized **Domain-Driven Modular Monolith** supporting multiple assessment types (Coding, MCQs, Projects/Assignments, and Bug-fixing challenges).

---

## 🛠️ Technology Stack & System Architecture

The platform integrates modern, decoupled technologies:
* **Backend Framework:** Node.js (Express) with a modular domain-driven router structure.
* **Database Caching & Task Queues:** Redis (using `ioredis`) for storing the asynchronous submissions queue and caching queries.
* **Database Engine:** MongoDB (using the official Node.js Driver) for all student progress, submissions, questions, daily streaks, achievements, and leaderboard statistics.
* **Isolation Sandbox:** Judge0 CE (running inside isolated cgroups v2-patched Docker environments) to compile and execute student Python, JavaScript, and SQL submissions safely.
* **AI Feedback Microservice:** FastAPI Python server providing real-time reviews of code submissions (utilizing fallback outputs if disconnected).

---

## 📂 Modular Monolith Domain Layout

The application logic has been refactored under `backend/app/` into isolated domain modules:

```
app/
├── common/                  # Shared infrastructure
│   ├── middleware/          # Auth verification and role route guards
│   ├── utils/               # Exceptions, rate limits, validators, response helpers
│   └── constants.js         # Shared enums (Statuses, Difficulties, Roles)
│
├── modules/                 # Modular domain domains
│   ├── auth/                # Login authentication logic
│   ├── users/               # Student profile and streak management
│   ├── topics/              # Catalog topic tags
│   ├── coding/              # Coding question execution and evaluation
│   ├── mcq/                 # MCQ quizzes, timing rules, option shuffling
│   ├── assignment/          # Multi-file assignments, deadlines, auto + manual grading
│   └── bugfix/              # Bugfixing challenges with progressive hint loops
```

---

## 🎯 Assessment Module Capabilities

### 1. 💻 Coding Challenges (`coding/`)
* Sandboxed execution of student code (Python, JS, SQL) against testcases in isolated cgroups.
* Real-time XP awarding, streaker updates, and leaderboard rankings logic.

### 2. 📝 MCQ Quizzes (`mcq/`)
* Time-limited quizzes with randomized question option ordering to prevent cheating.
* Auto-grading evaluation engine returning detailed correctness reports and explanations.

### 3. 📂 Practical Assignments (`assignment/`)
* Project assignments with template starter codes and strict deadlines.
* Hybrid grading pipeline supporting both Judge0-based auto-grading and instructor manual overrides with feedback.

### 4. 🐛 Bug Fixing Challenges (`bugfix/`)
* Debugging challenges presenting intentionally buggy code.
* Progressive attempt-based hints revealed incrementally to guide students to the solution.

---

## 🚀 Local Quickstart Guide

### Prerequisite: Docker Environment
Verify that Docker Desktop / WSL2 is running.

### 1. Build and Start the Stack
Spin up the MongoDB, Redis, Postgres, Judge0 CE sandbox, and API containers:
```bash
docker compose up -d --build
```

### 2. Seed the Database
Initialize collections, indexes, and seed mock assessment data for all modules:
```bash
docker compose exec backend-api node app/seed/seed_data.js
```

### 3. Run Integration Tests
Verify all 9 integration test suites (verifying Auth, Coding, MCQ, Assignment, Bugfix, and Leaderboard flows):
```bash
docker compose exec backend-api npm run test
```
*(All 9 subtests are expected to return green `ok` status)*.

---

## 🎨 Visual System: Wrench Wise Accents

The static mirror served at `/static/pencil_mirror.html` adopts the high-end engineering visual theme:
* **Emerald Green (`#00B67A`)** success states, badge highlights, and button CTA hover transitions.
* **Cyan Accent (`#00d294`)** for interactive elements, streaks counters, and highlight overlays.
* **Light Backdrop Blur** panels with glassmorphic cards and a light Monaco IDE theme workspace.
