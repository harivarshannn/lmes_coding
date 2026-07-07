# AI Agent Handoff & Project Context

This file serves as a memory checkpoint for AI coding agents (like Antigravity or others) to restore full context, design rationale, and system-level configuration states for this repository.

---

## 1. Project Mission
Build a production-grade multi-assessment platform supporting:
1. **Coding Challenges**: Sandboxed code execution (Python, JS, SQL) against test cases.
2. **MCQ Quizzes**: Randomized question and option sorting with auto-grading.
3. **Assignments**: Practical template-driven coding projects with auto-grading & manual grading.
4. **Bug Fixing Challenges**: Debugging practices with progressive attempt-based hints.

---

## 2. Architecture & Modular Layout
The system is built as a **Domain-Driven Modular Monolith** in Express:
- **Shared Infrastructure**: Located in `backend/app/common/`. Provides authorization/role middlewares, exception classes, and standard response helpers.
- **Modules**: Located in `backend/app/modules/`.
  - `auth/` (mock credentials login/authentication)
  - `users/` (streaks, badge awards, progress)
  - `coding/` (question CRUD, code submissions)
  - `mcq/` (MCQ quizzes and attempts)
  - `assignment/` (project tasks and auto/manual grading)
  - `bugfix/` (buggy challenges and fix attempts)
  - `gamification/` (leaderboard rankings and streaker status)
  - `topics/` (system categorization topics)

---

## 3. Sandboxing & Virtualization
Windows 11 host runs WSL2 and Docker Desktop.
- **Judge0 CE**: Runs isolated sandboxed executions inside Docker.
- **Redis Queue**: Buffer for submissions processing via a background worker (`startBackgroundWorker`).
- **Mock Service Fallback**: During unit testing (`npm run test`), `JUDGE0_URL` is empty, causing the evaluator to run against `MockJudge0Service` for fast local testing.

---

## 4. Verification Commands

### Seeding Collections
To drop, recreate collections, and seed mock assessment data:
* Local: `$env:DATABASE_URL="mongodb://127.0.0.1:27017/coding_platform"; npm run seed`
* Inside Docker: `docker compose exec backend-api node app/seed/seed_data.js`

### Running Integration Tests
To execute all 9 test suites covering authentication, coding CRUD, testcase CRUD, run executions, submissions, MCQ quizzes, assignments, and bugfixing challenges:
* Local: `$env:DATABASE_URL="mongodb://127.0.0.1:27017/coding_platform"; npm run test`
* Inside Docker: `docker compose exec backend-api npm run test`

---

## 5. Active Container Info
- **Express Backend API Port:** `8008` (external) -> `8000` (internal)
- **MongoDB Port:** `27017`
- **Redis Port:** `6379`
- **Judge0 CE Port:** `2358`
