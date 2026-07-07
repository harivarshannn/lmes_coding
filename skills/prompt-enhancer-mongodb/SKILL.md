---
name: prompt-enhancer-mongodb
description: "Use when developing, debugging, or querying devArena with MongoDB. Provides prompt templates, environment constraints, and the full project context to preserve MongoDB integration."
category: discipline
risk: safe
source: local
date_added: "2026-07-07"
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
* **Shared / Leaderboard:**
  * `topics`: `{ name: 1 }` unique
  * `languages`: `{ name: 1 }` unique, `{ judge0_language_id: 1 }` unique
  * `badges`: `{ name: 1 }` unique
  * `achievements`: `{ user_id: 1, badge_id: 1 }` unique
  * `daily_streaks`: `{ user_id: 1 }` unique
  * `leaderboard`: `{ user_id: 1 }` unique, `{ xp: -1 }`
  * `progress`: `{ user_id: 1, question_id: 1 }` unique
  * `bookmarks`: `{ user_id: 1, question_id: 1 }` unique
  * `favorites`: `{ user_id: 1, question_id: 1 }` unique
* **Coding Module:**
  * `questions`: `{ slug: 1 }` unique
  * `testcases`: `{ question_id: 1 }`
  * `hints`: `{ question_id: 1 }`
  * `solutions`: `{ question_id: 1 }`
  * `submissions`: `{ student_id: 1 }`, `{ judge0_token: 1 }`
* **MCQ Module:**
  * `mcq_quizzes`: `{ slug: 1 }` unique, `{ topic_id: 1 }`
  * `mcq_questions`: `{ quiz_id: 1 }`
  * `mcq_attempts`: `{ user_id: 1, quiz_id: 1 }`, `{ user_id: 1 }`
* **Assignment Module:**
  * `assignments`: `{ slug: 1 }` unique, `{ topic_id: 1 }`
  * `assignment_submissions`: `{ assignment_id: 1, user_id: 1 }` unique, `{ assignment_id: 1 }`
* **Bugfix Module:**
  * `bugfix_challenges`: `{ slug: 1 }` unique, `{ topic_id: 1 }`
  * `bugfix_attempts`: `{ user_id: 1, challenge_id: 1 }`, `{ user_id: 1 }`

---

## 🛠️ CLI Operations Checklist

### 1. Seeding and Initializing Database
To drop and re-seed all collections with mock data:
* Local: `$env:DATABASE_URL="mongodb://localhost:27017/coding_platform"; npm run seed`
* Docker: `docker compose exec backend-api node app/seed/seed_data.js`

### 2. Running Test Suite
Always validate repository modifications using the integration tests:
* Local: `$env:DATABASE_URL="mongodb://localhost:27017/coding_platform"; npm run test`
* Docker: `docker compose exec backend-api npm run test`

### 3. Native Health Check Verify
Check if the Node.js API container is running and healthy:
```bash
wget --no-verbose --tries=1 --spider http://127.0.0.1:8008/health
```

---

## 📝 Full Project Context (Latest Status - July 7, 2026)

### 1. Completed Refactoring & Multi-Module Integration:
* Restructured flat backend routing, services, and repositories into a modular domain-driven architecture under `app/modules/`.
* Created the **MCQ Module** supporting quiz creation, random option shuffling, timing rules, and automatic grading.
* Created the **Assignment Module** supporting assignment deadlines, template starter code, and auto-grading using the Judge0 sandbox alongside instructor manual grade overrides.
* Created the **Bug Fixing Module** supporting debugging challenges, progressive attempt-based hints, and diff-based correction checks.
* Updated `db_init.js` and all seed files to initialize and populate MongoDB indexes and collections for all new modules.
* Preserved 100% backward compatibility with existing code files by utilizing safe delegating wrappers under `modules/` and redirecting old utility files.
* Integration tests updated to include 9 test suites covering all modules (Auth, Coding, MCQ, Assignment, Bugfix) with 100% success (all green checks).

### 2. Execution Health & Integration Tests:
* All docker compose containers are active, healthy, and operational.
* Background queue worker properly evaluates scripts in the Judge0 sandbox.
