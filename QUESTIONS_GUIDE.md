# Walkthrough: Adding New Questions & Custom Templates

This guide explains how to add new questions and custom starter templates to the Coding Practice Platform. 

By following this workflow, your questions will:
1. **Load dynamically in the Web IDE editor.**
2. **Present "half-completed" starter boilerplates** (handles input parsing and output rendering, but leaves the core function blank).
3. **Execute and evaluate automatically** against Judge0 CE (for Python/JS) or client-side HTML sandboxes.

---

## 1. Supported Languages & Evaluation Models

The system is optimized for three main execution models:
* **Python 3:** Executed inside Judge0 sandboxes using standard `sys.stdin` input parsing.
* **JavaScript (Node.js):** Executed inside Judge0 sandboxes using standard Node.js `readline` interfaces.
* **HTML5/CSS3:** Rendered inside a client-side sandboxed iframe with automated DOM element, styling, and interactivity validation.

### Backend Execution (Python, JavaScript)
* **Grader Flow:** The backend worker spins up the execution sandbox, feeds testcase `input` to `stdin`, and compares `stdout` against `expected_output`.
* **Templates:** Starter templates read inputs via standard modules (`sys.stdin` for Python, `readline` for Node.js).

### Frontend Web Execution (HTML5/CSS3)
* **Grader Flow:** 
  1. **Run Code:** Renders the page *instantly* inside a dedicated **Live Web Sandbox iframe** on the client side, pulling Tailwind CSS for utilities.
  2. **Submit Grader:** Validates the DOM structure directly. In production databases, HTML questions are bound to a verification test case (`input="validate"`, `expected_output="validation PASSED"`).
* **Templates:** Provide base tags and placeholder elements for students to styling or populate.

---

## 2. Dynamic Templates Examples

Here is a full suite of templates for **Array Sum**:

### Python 3 Template
```python
def arraySum(arr):
    # Write your Python 3 code here to return the sum of the array
    pass

if __name__ == "__main__":
    import sys
    line = sys.stdin.read().strip()
    if line:
        arr = [int(x) for x in line.split()]
        print(arraySum(arr))
```

### JavaScript Node.js Template
```javascript
function arraySum(arr) {
    // Write your JavaScript code here to return the sum of the array
    
}

// Read inputs from stdin
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    const arr = line.trim().split(/\s+/).map(Number);
    console.log(arraySum(arr));
});
```

### HTML5 Template
```html
<!-- Create an HTML button with id='submit-btn' and text 'Submit Form' -->
<!-- Use Tailwind CSS classes: bg-blue-600 text-white px-4 py-2 rounded -->
<div class="flex justify-center items-center min-h-screen">
  <button id="submit-btn" class="bg-blue-600 text-white px-4 py-2 rounded">
    Submit Form
  </button>
</div>
```

---

## 3. Injecting via Swagger UI or Seed Script

### Via Swagger UI (Admin APIs)
1. Open your browser and go to `http://localhost:8000/docs`.
2. Locate the `POST /questions` endpoint.
3. Populate the JSON request with the respective language templates:
   ```json
   {
     "title": "Array Sum",
     "slug": "array-sum",
     "description": "Given an array of integers, return their sum.",
     "difficulty": "Easy",
     "template_python": "...",
     "template_javascript": "...",
     "template_html": "..."
   }
   ```
4. Create test cases via `POST /questions/{id}/testcases`. Note that the field name is **`input`** (not `input_data`).
5. Open the Web IDE at `http://localhost:8000/` to instantly load, compile, and solve your new question.

### Via Database Seeding
Modify the database seed script in [seed_data.py](file:///K:/lmes_portal/backend/app/seed/seed_data.py) to declare topics, questions, testcases, solutions, and hints directly using SQLAlchemy models. Run the script using:
```bash
docker compose exec backend-api python app/seed/seed_data.py
```
