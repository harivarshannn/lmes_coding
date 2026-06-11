# Walkthrough: Adding New Questions & Custom Templates

This guide explains how to add new questions and custom starter templates to the Coding Assessment Execution Service. 

By following this workflow, your questions will:
1. **Load dynamically in the Web IDE editor.**
2. **Present "half-completed" starter boilerplates** (handles input parsing and output rendering, but leaves the core function blank).
3. **Execute and evaluate automatically** against Judge0 CE using the hidden/visible test cases in the database.

---

## 1. Supported Languages & Evaluation Models

The system supports backend languages (Python, Java, JavaScript, TypeScript, SQL) and frontend web technologies (HTML5/CSS3, React).

### Backend Execution (Python, Java, JS, TS)
*   **Workflow:** The grader executes the submitted code, feeds `input_data` to `stdin`, and compares `stdout` against `expected_output`.
*   **Templates:** Starter templates read inputs via standard modules (`sys.stdin` for Python, `BufferedReader` for Java, `readline` for Node.js).

### SQL (SQLite) Execution
*   **Workflow:** The backend automatically prepends the schema setups (`input_data`) to the user's query (`code`) and runs the combined script inside SQLite.
*   **Templates:** Include a comment indicating the table structures (e.g. `-- Write your SQL query here. employees table is already defined...`).
*   **Test Case Setup:** Set `input_data` to the schema creation and data insertion queries:
    ```sql
    CREATE TABLE employees (id INT, name TEXT, salary INT);
    INSERT INTO employees VALUES (1, 'Alice', 60000);
    ```
    Set `expected_output` to the expected output format of SQLite (columns separated by `|`):
    ```
    Alice|60000
    ```

### Frontend Execution (HTML5, React)
*   **Workflow:**
    1.  **Run Code:** Renders the page *instantly* inside a dedicated **Live Preview iframe** on the client side. React is compiled on-the-fly using *Babel Standalone*, and styles are processed via the *Tailwind CSS CDN*.
    2.  **Submit Grader:** Submits the code to the backend. The test case's `input_data` holds a **Python validation script** that parses the submitted HTML/React string (using regex or search patterns) and asserts its correctness.
*   **Templates:** Provide base tags and container structures with blank sections for styling or component details.
*   **React Test Case Grader Setup:** Set the test case `input_data` to the python validation code:
    ```python
    import sys
    code = sys.stdin.read()
    if 'useState' in code and 'onClick' in code:
        print("validation PASSED")
    else:
        print("validation FAILED: Make sure you use state variables.")
    ```
    Set `expected_output` to `validation PASSED`.

---

## 2. Dynamic Templates Example

Here is a full suite of templates for **Array Sum**:

### JavaScript Node.js Template
```javascript
function arraySum(arr) {
    // Write your code here to return the sum of the array
    
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

### TypeScript Template
```typescript
function arraySum(arr: number[]): number {
    // Write your code here to return the sum of the array
    
}

// Read inputs from stdin
import * as readline from 'readline';
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

---

## 3. Injecting via Swagger UI

1. Open your browser and go to `http://localhost:8000/docs`.
2. Locate the `POST /questions` endpoint.
3. Populate the JSON request with the respective language templates (e.g. `template_javascript`, `template_typescript`, `template_sql`, `template_html`, `template_react`).
4. Execute and create test cases via `POST /questions/{id}/testcases`.
5. Open the Web IDE at `http://localhost:8000/` to immediately view and compile your new question.
