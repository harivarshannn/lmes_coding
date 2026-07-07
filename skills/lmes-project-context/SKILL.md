---
name: lmes-project-context
description: "Holds the absolute project context, database structure, container maps, and visual system updates for LMES DevArena. Use to bootstrap new agent workspaces."
category: project
risk: safe
source: local
date_added: "2026-07-07"
metadata:
  last_updated: "2026-07-07T05:17:10.109Z"
  status: "active"
---

# LMES DevArena Project Context & System Documentation

This skill serves as the single source of truth for the codebase context. It is automatically updated upon code/test executions.

## 🛠️ Architecture & Containers
* **Backend API (`backend-api`)**: Express Node.js backend. Port `8008` (external) maps to `8000` (internal).
* **Database (`mongodb`)**: MongoDB instance `mongo:6-jammy` on port `27017`.
* **Redis (`redis`)**: Redis queue broker on `6379`.
* **Judge0 CE Components**:
  * Server (`lmes_portal-server-1`) on `2358`
  * Worker (`lmes_portal-worker-1`) executing submissions
* **Legacy Queue Database (`postgres`)**: PostgreSQL 16 on `5435` mapping to `5432` for Judge0 queue storage.

## 📦 Domain-Driven Modular Monolith
The codebase is refactored from a flat structure into modular folder groups under `app/modules/`:
* **auth/**: Mock login and token authentication logic.
* **users/**: User profiles, registration, and streaks lookup.
* **coding/**: Consolidates coding questions, sandboxed runs, testcases, and submissions.
* **mcq/**: MCQ quizzes, question management, shuffling options, and auto-grading.
* **assignment/**: Assignments with deadlines, file/inline code submission, and auto + manual grading.
* **bugfix/**: Intentionally buggy challenges, progressive hints, and Judge0-based fix validation.
* **gamification/**: Streaks, leaderboard XP, and achievements/badge awarding.
* **topics/**: Management of catalog topic tags.

## 🚀 MongoDB Schema Patterns
* **Sequential Integer IDs**: Primary keys use sequential integers (stored in both `_id` and `id`). Never use Hex ObjectIds. Lookups use helper `getNextSequenceValue(...)`.
* **Unique Indices**:
  * Users: username, email
  * Questions: slug
  * Achievements: compound user_id + badge_id
  * Progress: compound user_id + question_id
  * MCQ Quizzes: slug
  * Assignments: slug
  * Bugfix Challenges: slug
  * Assignment Submissions: compound assignment_id + user_id

## 🎨 UI & Styles
* **Branding Theme**: Redressed with Wrench Wise visual system (Emerald green `#00B67A` and Cyan `#00d294` accents, light glassmorphism card panels with backdrop blur, light Monaco IDE theme).
* **Static Mirror**: The high-fidelity Pencil mirror page is served at [pencil_mirror.html](file:///K:/lmes_portal/backend/static/pencil_mirror.html).

## ⚡ Async Submission Polling Architecture
Replaces synchronous HTTP blocking with fire-and-forget queue processing to prevent browser timeouts:
* **POST `/submit`**: Creates a MongoDB record (`status: "In Queue"`), pushes to Redis queue, returns `submission_id` within ~100ms.
* **Background Worker**: Continuously pops from `submissions_queue` in Redis, calls `processSubmission()` which runs test cases via Judge0, writes final verdict to MongoDB.
* **GET `/submissions/:id/status`**: Lightweight polling endpoint returning only `{ submission_id, status, passed, total }` — no code/stdout payload.
* **Frontend Polling**: Polls every 2s with a 120-second timeout guard. Shows elapsed time. Transient network errors don't kill the polling loop.
* **Redis Fallback**: If Redis is unavailable, processing is spawned as a fire-and-forget async task (never blocks the HTTP response).
* **Judge0 Timeout**: Judge0 sandbox kills any program exceeding the time limit (status `id: 5`, "Time Limit Exceeded").
