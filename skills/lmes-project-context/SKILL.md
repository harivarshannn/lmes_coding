---
name: lmes-project-context
description: "Holds the absolute project context, database structure, container maps, and visual system updates for LMES DevArena. Use to bootstrap new agent workspaces."
category: project
risk: safe
source: local
date_added: "2026-07-06"
metadata:
  last_updated: "2026-07-06T06:46:32.736Z"
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

## 🚀 MongoDB Schema Patterns
* **Sequential Integer IDs**: Primary keys use sequential integers (stored in both `_id` and `id`). Never use Hex ObjectIds. Lookups use helper `getNextSequenceValue(...)`.
* **Unique Indices**:
  * Users: username, email
  * Questions: slug
  * Achievements: compound user_id + badge_id
  * Progress: compound user_id + question_id

## 🎨 UI & Styles
* **Branding Theme**: Redressed with Wrench Wise visual system (Emerald green `#00B67A` and Cyan `#00d294` accents, light glassmorphism card panels with backdrop blur, light Monaco IDE theme).
* **Static Mirror**: The high-fidelity Pencil mirror page is served at [pencil_mirror.html](file:///K:/lmes_portal/backend/static/pencil_mirror.html).
