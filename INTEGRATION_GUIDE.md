# Backend Architecture & Future Integration Playbook

This document explains the inner workings of the Coding Practice Platform's async pipeline, caching rules, and services integration.

---

## 1. Internal Code Architecture & Data Flow

### The "/run" Endpoint (Ad-hoc Execution)
```
[Client] -> POST /run 
            -> Validate Rate Limit (rate_limit.js)
            -> Validate Language ID (language_mapper.js)
            -> Submit to Judge0 (judge0_service.js)
            -> Return Output, Stderr, Time, Memory to Client
```

### The Asynchronous "/submit" Pipeline (Coding Module)
```
[Client] -> POST /submit
            -> Verify Rate Limit (rate_limit.js)
            -> Verify Question (coding.repo.js)
            -> Write Submission with status "In Queue" (MongoDB)
            -> Push Submission ID to Redis Queue (submissions_queue)
            -> Return 201 Created immediately with submission_id
            
[Worker Daemon Thread] (Runs inside Node.js Express Backend process)
            -> Listens to Redis Queue (pop submission_id)
            -> Updates status to "Processing"
            -> Pulls associated Test Cases (coding.repo.js)
            -> Loops and evaluates code against Judge0 Sandbox (evaluator.js)
            -> Computes final grade status (Accepted, Wrong Answer, etc.)
            -> Awards student XP, updates Streaks, invalidates Caches (MongoDB/Redis)
            -> Finishes execution (Sets status to final verdict)
```

### MCQ Attempt & Evaluation Flow
```
[Client] -> POST /mcq/quizzes/:id/attempt
            -> Start attempt record in MongoDB (status "In Progress")
            -> Return randomized questions & options without answers
            
[Client] -> POST /mcq/attempts/:id/submit
            -> Evaluate user answers against correct answer key in MongoDB
            -> Calculate score, percentage, and time taken status ("Completed" or "Timed Out")
            -> Persist final score & return result report
```

### Assignment Submission & Grading Flow
```
[Client] -> POST /assignments/:id/submit
            -> Write or update submission record
            -> Check deadline date (status: "Submitted" or "Late")
            -> (Optional) If auto_grade_enabled: run code against test cases in Judge0
            -> Update score & final_score
            
[Instructor] -> PUT /assignments/submissions/:id/grade
            -> Oversee results and override with manual_grade_score & instructor feedback
```

### Bug Fixing Flow
```
[Client] -> POST /bugfix/challenges/:id/attempt
            -> Validate attempts counts limit
            -> (Optional) If test_cases exists: evaluate code against Judge0 Sandbox
            -> (Fallback) String comparison check against correct_code
            -> If wrong: reveal progressive hint corresponding to attempt number
```

---

## 2. Redis Caching & Queue Integration

The caching implementation resides in `backend/app/database/redis.py` and uses a **cache-aside** design pattern:
1. **Questions List:** Cached at `questions:all`. Invalidated automatically when admin modifies questions.
2. **Individual Question Details:** Cached at `question:id:{id}`. Invalidated on question updates.
3. **Leaderboard Roster:** Cached at `leaderboard:top50` for 60 seconds.
4. **Quizzes and Challenges Lists:** Cached at `mcq:quizzes:all`, `assignments:all`, and `bugfix:challenges:all` for fast lists retrieval.

### Queue Implementation:
The Redis queue uses list-based operations (`rpush` and `blpop` via `RedisQueue.push` and `RedisQueue.pop` wrapper functions) to guarantee FIFO processing.

---

## 3. Playbook: Supporting New Languages

To add support for a new programming language in Judge0:
1. **Update `Dockerfile.compilers`:** Add compiler package install instructions (e.g. `apt-get install -y golang-go` for Go).
2. **Rebuild Compiler base image:** Run `docker build -t judge0-compilers:lightweight -f judge0/Dockerfile.compilers ./judge0`.
3. **Add Language to Active List:** Append language metadata and execution path to `judge0/db/languages/active.rb`.
4. **Update Backend Mapper:** Map language string to Judge0 Language ID inside `backend/app/services/language_mapper.js`.

---

## 4. Web Sandbox (HTML/CSS) Integration

For HTML/CSS questions, the evaluation model shifts from Judge0 sandboxing to client-side DOM checking:
1. **Sandboxing:** Code is rendered inside a secure `iframe` with `sandbox="allow-scripts"`.
2. **Validation:** Checks are run in `backend/static/script.js` which performs assertions on element existence and CSS/Tailwind utility classes.
3. **Outcome Persistence:** Upon passing client-side validation, the client issues a POST `/submit` containing the solved code. The backend worker runs a lightweight script verifying correctness and persists the `Accepted` state, awarding XP and updating streaks.
