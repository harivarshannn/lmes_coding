# Backend Architecture & Future Integration Playbook

This document explains the inner workings of the Coding Practice Platform's async pipeline, caching rules, and services integration.

---

## 1. Internal Code Architecture & Data Flow

### The "/run" Endpoint (Ad-hoc Execution)
```
[Client] -> POST /run 
            -> Validate Rate Limit (rate_limit.py)
            -> Validate Language ID (language_mapper.py)
            -> Submit to Judge0 (judge0_service.py)
            -> Return Output, Stderr, Time, Memory to Client
```

### The Asynchronous "/submit" Pipeline (Task 6)
```
[Client] -> POST /submit
            -> Verify Rate Limit (rate_limit.py)
            -> Verify Question (question_repo.py)
            -> Write Submission with status "In Queue" (Postgres)
            -> Push Submission ID to Redis Queue (submissions_queue)
            -> Return 201 Created immediately with submission_id
            
[Worker Daemon Thread] (Runs inside FastAPI Process)
            -> Listens to Redis Queue (pop submission_id)
            -> Updates status to "Processing"
            -> Pulls associated Test Cases (testcase_repo.py)
            -> Loops and evaluates code against Judge0 Sandbox (evaluator.py)
            -> Computes final grade status (Accepted, Wrong Answer, etc.)
            -> Awards student XP, updates Streaks, invalidates Caches (Postgres/Redis)
            -> Finishes execution (Sets status to final verdict)
```

---

## 2. Redis Caching & Queue Integration (Task 3)

The caching implementation resides in `backend/app/database/redis.py` and uses a **cache-aside** design pattern:
1. **Questions List:** Cached at `questions:all`. Invalidated automatically when admin creates, modifies, duplicates, or deletes questions.
2. **Individual Question Details:** Cached at `question:id:{id}`. Invalidated on question updates.
3. **Leaderboard Roster:** Cached at `leaderboard:top50` for 60 seconds to save database performance.

### Queue Implementation:
The Redis queue uses list-based operations (`rpush` and `lpop` via `RedisQueue.push` and `RedisQueue.pop` wrapper functions) to guarantee FIFO processing.

---

## 3. Playbook: Supporting New Languages

To add support for a new programming language in Judge0:
1. **Update `Dockerfile.compilers`:** Add the package installation instructions (e.g. `apt-get install -y golang-go` for Go).
2. **Rebuild the Compiler base image:** Run `docker build -t judge0-compilers:lightweight -f judge0/Dockerfile.compilers ./judge0`.
3. **Add Language to Active List:** Append the language metadata and sandbox execution paths to `judge0/db/languages/active.rb` so Judge0 seeds it on startup.
4. **Update Backend Mapper:** Map the language string to Judge0's official Language ID inside `backend/app/services/language_mapper.py`.

---

## 4. Web Sandbox (HTML/CSS) Integration (Task 7)

For HTML/CSS questions, the evaluation model shifts from Judge0 sandboxing to client-side DOM checking:
1. **Sandboxing:** Code is rendered inside a secure `iframe` with `sandbox="allow-scripts"`.
2. **Validation:** Checks are run in `backend/static/script.js` which performs assertions on:
   - Specific element existence (e.g. `button#submit-btn`).
   - Specific CSS and Tailwind utility classes (e.g. `bg-blue-600`, `text-white`).
   - JavaScript interactivity (click event listeners).
3. **Outcome Persistence:** Upon passing client-side validation, the client issues a POST `/submit` containing the solved code. The backend worker runs a lightweight script verifying the layout template correctness and persists the `Accepted` state to the database, awarding student XP and updating streaks.
