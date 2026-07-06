---
name: prompt-enhancer-mongodb
description: "Use when developing, debugging, or querying devArena with MongoDB. Provides prompt templates, environment constraints, and the full project context to preserve MongoDB integration."
category: discipline
risk: safe
source: local
date_added: "2026-07-06"
metadata:
  category: discipline
  triggers: mongodb, mongo, seed_data, session, counters, nextSequenceValue, migration
---

# MongoDB & Node.js Workflow Prompt Enhancer

This skill ensures that coding assistants and developers maintain integrity when modifying the MongoDB backend code for devArena, ensuring that relational patterns (like integer auto-increment IDs) are preserved correctly on top of document stores.

## When to Use
Automatically activate when:
- Modifying backend schemas, seed scripts, or repositories.
- Generating database queries or updating collections.
- Testing the application or restarting containers in WSL2.
- Writing prompt templates or onboarding notes for other agents.

---

## 📋 Standard Handoff Process
After completing any development or refactoring task:
1. **Always push the changes to GitHub** (commit and push to the remote repository).
2. **Always draft a summary update email in the chat** for the user (explaining changes, test status, and remaining work) since mail MCP may not be connected.
3. **Always update the project context** under the "Full Project Context" section in this `SKILL.md` file.

---

## 🚀 The MongoDB Schema & Constraints Reference

### 1. Integer Auto-Increment IDs
To keep absolute compatibility with existing REST endpoints and frontend routers, **do NOT use MongoDB ObjectId hex strings for primary keys**. Use sequential integers.
* **Auto-increment counters:** Stored in the `counters` collection.
* **Database Session helper:** Use `getNextSequenceValue(sequenceName)` exported from `app/database/session.js`.
* **Insert Pattern:**
  ```javascript
  const nextId = await getNextSequenceValue('questions');
  await db.collection('questions').insertOne({
    _id: nextId,
    id: nextId,
    ...data
  });
  ```
  *(Always store the integer ID in both `_id` and `id` to ensure compatibility with standard repository lookups and REST responses).*

### 2. Indexes and Collection Schemas
Before deploying schemas, double-check that database indices are correctly generated inside `app/database/db_init.js`:
* **Questions:** `{ slug: 1 }` (unique)
* **Users:** `{ username: 1 }` (unique), `{ email: 1 }` (unique)
* **Achievements:** `{ user_id: 1, badge_id: 1 }` (unique compound index)
* **Progress:** `{ user_id: 1, question_id: 1 }` (unique compound index)

---

## 🛠️ CLI Operations Checklist

### 1. Seeding and Initializing Database
To drop and re-seed all collections with mock data:
```bash
wsl -d Ubuntu docker compose exec backend-api node app/seed/seed_data.js
```

### 2. Running Test Suite
Always validate repository modifications using the integration tests:
```bash
wsl -d Ubuntu docker compose exec backend-api npm run test
```

### 3. Native Health Check Verify
Check if the Node.js API container is running and healthy:
```bash
wsl -d Ubuntu docker compose exec backend-api wget --no-verbose --tries=1 --spider http://127.0.0.1:8000/health
```

---

## 📝 Full Project Context (Latest Status - July 6, 2026)

### 1. Completed Migration:
* Rewrote the backend API service completely from Python (FastAPI/SQLAlchemy) to Node.js (Express/MongoDB Driver).
* Swapped out `postgres` in the main application flow for a `mongo:6-jammy` container.
* Preserved the `db` (PostgreSQL 16) container **only** as an internal runtime queue/metadata store for Judge0 CE isolation.
* Rebuilt the Docker Compose stack with custom network separation.
* Redesigned DevArena UI (the "Forge" interactive version) to adopt the premium, glassmorphic Wrench Wise branding (emerald `#00B67A` and cyan `#00d294` accents, light workspace design, custom animations, rounded pills/badges, and a light-themed Monaco code editor workspace).
* Built a static high-fidelity replication of Wrench Wise at `backend/static/pencil_mirror.html` (the static "Pencil" mirror).

### 2. Execution Health & Integration Tests:
* All 7 containers are fully active, running, and healthy.
* Integration test suite (`npm run test` inside `backend-api`) passes 100% with **6/6 green checks**:
  * `GET /health` (status: ok)
  * `POST /login` credentials verification
  * `GET /questions` and question CRUD queries
  * TestCase CRUD queries
  * `POST /run` code sandbox validation
  * Submissions and Leaderboard database flow
* Background submission queue worker loops on Redis and successfully evaluates python scripts in the Judge0 sandbox, updating MongoDB state correctly.

### 3. Async Submission Polling Architecture (Implemented July 6, 2026):
* **Problem Solved**: Browser HTTP timeout (50s) when Judge0 takes longer to execute code.
* **Backend Changes**:
  * `submission_service.js`: `enqueueSubmission()` always returns immediately. Redis fallback spawns fire-and-forget async task instead of blocking.
  * `submissions.js`: Added `GET /submissions/:id/status` lightweight endpoint (returns only status, passed, total — no code/stdout).
* **Frontend Changes**:
  * `script.js`: `pollSubmission()` uses `/submissions/:id/status` every 2s, shows elapsed time, has 120s timeout guard, and transient network errors don't kill the polling loop.
* **Flow**: POST /submit → DB record "In Queue" → Redis push → instant response → Worker processes → Frontend polls status → Final verdict displayed.
