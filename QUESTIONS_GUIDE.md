# Walkthrough: Adding New Assessments & Custom Templates

This guide explains how to add new questions, MCQ quizzes, assignments, and bugfixing challenges to the LMES platform.

---

## 1. Coding Challenges (Coding Module)

Coding challenges are executed inside the Judge0 CE container and verified against input/expected output test cases.

### Creating a New Coding Challenge via API
* **Endpoint:** `POST /questions`
* **Payload Structure:**
  ```json
  {
    "title": "Array Sum",
    "slug": "array-sum",
    "description": "Given an array of integers, return their sum.",
    "difficulty": "Easy",
    "estimated_time": 5,
    "marks": 5,
    "tags": ["array"],
    "starter_codes": {
      "python": "def arraySum(arr):\n    pass",
      "javascript": "function arraySum(arr) {\n    \n}"
    }
  }
  ```

### Adding Test Cases
* **Endpoint:** `POST /questions/:id/testcases`
* **Payload Structure:**
  ```json
  {
    "input": "1 2 3 4",
    "expected_output": "10",
    "is_hidden": false
  }
  ```

---

## 2. MCQ Quizzes (MCQ Module)

MCQ quizzes present a series of multiple choice questions with randomized option placement.

### Creating a New Quiz
* **Endpoint:** `POST /mcq/quizzes`
* **Payload Structure:**
  ```json
  {
    "title": "Data Structures Basics Quiz",
    "slug": "ds-basics-quiz",
    "description": "Test your fundamentals on Stacks, Queues, and Arrays.",
    "topic_id": 1,
    "difficulty": "Easy",
    "time_limit_minutes": 15
  }
  ```

### Adding Questions to a Quiz
* **Endpoint:** `POST /mcq/quizzes/:id/questions`
* **Payload Structure:**
  ```json
  {
    "question_text": "Which data structure follows the LIFO principle?",
    "options": [
      { "key": "A", "text": "Queue" },
      { "key": "B", "text": "Stack" },
      { "key": "C", "text": "Linked List" },
      { "key": "D", "text": "Array" }
    ],
    "correct_answer": "B",
    "explanation": "A Stack is a Last In First Out (LIFO) data structure.",
    "marks": 2,
    "order": 1
  }
  ```

---

## 3. Practical Assignments (Assignment Module)

Assignments support longer-form tasks with specific deadlines and templates.

### Creating a New Assignment
* **Endpoint:** `POST /assignments`
* **Payload Structure:**
  ```json
  {
    "title": "Stack Implementation",
    "slug": "stack-implementation",
    "description": "Implement a Stack class in Python.",
    "topic_id": 1,
    "difficulty": "Easy",
    "instructions_md": "## Requirements\nImplement the Stack class...",
    "max_marks": 100,
    "deadline": "2026-07-20T23:59:59.000Z",
    "language": "python",
    "starter_code": "class Stack:\n    def __init__(self):\n        self.items = []",
    "auto_grade_enabled": true,
    "test_cases": [
      { "input": "push 5\npop", "expected_output": "5", "is_hidden": false }
    ]
  }
  ```

---

## 4. Bug Fixing Challenges (Bugfix Module)

Bug fixing challenges present intentionally buggy code that the student must fix.

### Creating a New Bugfix Challenge
* **Endpoint:** `POST /bugfix/challenges`
* **Payload Structure:**
  ```json
  {
    "title": "Fix Array Search",
    "slug": "fix-array-search",
    "description": "Find and fix the premature return bug.",
    "difficulty": "Easy",
    "language": "python",
    "buggy_code": "def search(arr, target):\n    for x in arr:\n        if x == target: return True\n        else: return False",
    "correct_code": "def search(arr, target):\n    for x in arr:\n        if x == target: return True\n    return False",
    "hints": [
      "Check the loop boundaries and premature else clause.",
      "Move the default return outside the loop."
    ],
    "test_cases": [
      { "input": "1 2 3\n2", "expected_output": "True", "is_hidden": false }
    ],
    "max_attempts": 5,
    "xp_reward": 50
  }
  ```

---

## 5. Seeding Data via Script

Assessments can be seeded using Node.js seeding scripts:
* **MCQ Seed:** `backend/app/seed/seed_mcq.js`
* **Assignment Seed:** `backend/app/seed/seed_assignments.js`
* **Bugfix Seed:** `backend/app/seed/seed_bugfix.js`
* **Orchestration Runner:** `backend/app/seed/seed_data.js`

To run the seed scripts:
```bash
docker compose exec backend-api node app/seed/seed_data.js
```
