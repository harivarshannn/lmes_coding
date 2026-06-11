# Backend Architecture & Future Integration Playbook

This document is designed for backend engineers and architects who want to understand the inner workings of the Coding Assessment Execution Service, optimize its performance, or integrate it with future LMS platforms.

> [!NOTE]
> For instructions on how to add questions, define custom boilerplates/templates, and seed test cases, please refer to the dedicated [QUESTIONS_GUIDE.md](file:///K:/lmes_portal/QUESTIONS_GUIDE.md).

---

## 1. Internal Code Architecture & Data Flow

### The "/run" Endpoint (Ad-hoc Execution)
```
[Client] -> POST /run 
            -> Resolve Language ID (language_mapper.py)
            -> Submit to Judge0 (judge0_service.py)
            -> Poll Submission Status (In Queue -> Processing -> Accepted/Error)
            -> Return Output, Stderr, Time, Memory to Client
```

### The "/submit" Endpoint (Test Case Evaluation)
```
[Client] -> POST /submit
            -> Query Question & associated Test Cases (PostgreSQL)
            -> Loop through Test Cases (evaluator.py)
                 -> Submit each run to Judge0
                 -> Poll until completion
                 -> If Compile Error / TLE / MLE / Runtime Error: short-circuit immediately
                 -> If Output matches Expected: passed_counter++
            -> Persist Submission record (Submission model)
            -> Return evaluation summary (verdict, passed, total) to Client
```

---

## 2. Playbook: Integrating with an LMS Platform

When integrating with Learning Management Systems (LMS) like Canvas, Moodle, or a custom portal, you need to transition from synchronous execution to asynchronous execution with webhook callbacks.

### Step A: Database Schema Extension
Add LMS-specific fields to the [Submission](file:///K:/lmes_portal/backend/app/models/submission.py) table to track courses, assignments, and LTI parameters:

```python
# app/models/submission.py
class Submission(Base):
    __tablename__ = "submissions"
    
    # Existing fields...
    student_id = Column(Integer, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Future LMS fields:
    lms_course_id = Column(String, nullable=True)
    lms_assignment_id = Column(String, nullable=True)
    lti_result_sourcedid = Column(String, nullable=True)  # For LTI outcomes postback
```

### Step B: Asynchronous Processing & Webhook Postbacks
Instead of holding the HTTP request open while executing code:
1. Save the submission with status `Processing`.
2. Return a `202 Accepted` response with a `submission_id` immediately.
3. Queue the task inside an asynchronous worker (FastAPI `BackgroundTasks` or Celery).
4. Perform the evaluation against Judge0.
5. Post the results back to the LMS webhook endpoint or Canvas LTI Grades service once done.

Example FastAPI background task setup:

```python
# app/routes/submissions.py
from fastapi import BackgroundTasks

@router.post("/submit", status_code=status.HTTP_202_ACCEPTED)
def submit_code(submission_in: SubmissionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Create a DB submission record with "Processing" status
    db_submission = create_pending_submission(db, submission_in)
    
    # 2. Enqueue the evaluation task to run in the background
    background_tasks.add_task(evaluate_and_postback, db_submission.id)
    
    # 3. Return immediately
    return {"submission_id": db_submission.id, "status": "processing"}
```

---

## 3. Playbook: Supporting New Languages

To add support for a new programming language (e.g. Go, Rust, Ruby):

### Step A: Update the Language Mapper
Add the language identifier mapping to Judge0's official Language IDs in [language_mapper.py](file:///K:/lmes_portal/backend/app/services/language_mapper.py):

```python
# app/services/language_mapper.py
LANGUAGE_MAP = {
    "python": 71,
    "cpp": 54,
    "java": 62,
    "go": 60,      # Added Go
    "rust": 73     # Added Rust
}
```

### Step B: Install Compilers/Interpreters in Judge0 Worker
If a compiler/interpreter is not already pre-installed in the `judge0/judge0:latest` Docker image, you must update the worker environment to install it.
Modify the container's environment or run a custom installation script:

```bash
# Example inside judge0-worker-1:
apt-get update && apt-get install -y golang-go
```

---

## 4. Playbook: Scaling with Batch Submissions

To optimize performance and avoid sequential polling bottlenecks when evaluating a submission against 20+ hidden test cases:

1. **Use Judge0 Batch Submission API:**
   Use the `POST /submissions/batch?base64_encoded=false` endpoint to submit all test cases in a single payload.
   
   ```python
   # Inside app/services/judge0_service.py
   def submit_batch(self, submissions: List[dict]) -> List[str]:
       # payload format: {"submissions": [{"source_code": ..., "language_id": ..., "stdin": ...}]}
       url = f"{self.base_url}/submissions/batch?base64_encoded=false"
       response = requests.post(url, json={"submissions": submissions})
       return [item["token"] for item in response.json()]
   ```

2. **Poll in Batches:**
   Query all tokens at once using `GET /submissions/batch?tokens=token1,token2,...&base64_encoded=false`.
   This reduces network round-trips from `O(N)` to `O(1)` per polling cycle.

---

## 5. Playbook: Custom Sandbox Security & Resource Limits

To adjust sandbox security limits:
- **FastAPI Level:** You can add `cpu_limit` and `memory_limit` fields to [TestCase](file:///K:/lmes_portal/backend/app/models/testcase.py) so limits are defined dynamically per question.
- **Judge0 Level:** Modify the default sandbox parameters passed in `submit_code` inside [judge0_service.py](file:///K:/lmes_portal/backend/app/services/judge0_service.py):

```python
payload = {
    "source_code": source_code,
    "language_id": language_id,
    "stdin": stdin,
    # Custom resource limits:
    "cpu_limit": 2.0,           # limit execution to 2.0s
    "memory_limit": 128000,      # limit memory to 128MB
    "stack_limit": 64000         # limit stack space to 64MB
}
```
These parameters are forwarded to `isolate` under cgroups v2 (`cg_root`) and enforced strictly by the Linux kernel.
