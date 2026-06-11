from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.exceptions import RequestValidationError
from app.routes import health, questions, testcases, run, submissions
from app.utils.exceptions import CodingPlatformException

app = FastAPI(
    title="Coding Assessment Execution Service",
    description="FastAPI service for executing and evaluating coding tasks using Judge0 CE",
    version="1.0.0"
)

# Custom exception handler for CodingPlatformException
@app.exception_handler(CodingPlatformException)
async def coding_platform_exception_handler(request: Request, exc: CodingPlatformException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": exc.errors()[0]["msg"] if exc.errors() else "Validation failed"
            }
        }
    )

# Global fallback exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            }
        }
    )

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(questions.router, tags=["Questions"])
app.include_router(testcases.router, tags=["Test Cases"])
app.include_router(run.router, tags=["Run Code"])
app.include_router(submissions.router, tags=["Submissions"])

# Serve premium single-page frontend at root
@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS Sandbox Code Runner</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-primary: #08090d;
            --bg-secondary: #0f111a;
            --bg-tertiary: #161926;
            --border-color: rgba(255, 255, 255, 0.06);
            --accent-primary: #6366f1;
            --accent-primary-glow: rgba(99, 102, 241, 0.15);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --text-muted: #6b7280;
            --success: #10b981;
            --error: #ef4444;
            --warning: #f59e0b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Header */
        header {
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 64px;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-icon {
            font-size: 24px;
            background: linear-gradient(135deg, #818cf8, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .logo-text {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .status-container {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 500;
            color: var(--success);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--success);
        }

        /* Workspace Layout */
        .workspace {
            flex: 1;
            display: grid;
            grid-template-columns: 420px 1fr;
            overflow: hidden;
        }

        /* Left Side: Question Browser */
        .question-panel {
            background-color: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .panel-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .selector-label {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
            color: var(--text-secondary);
        }

        select {
            width: 100%;
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 10px 14px;
            border-radius: 8px;
            outline: none;
            font-family: inherit;
            font-size: 14px;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        select:focus {
            border-color: var(--accent-primary);
        }

        .question-content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .difficulty-badge {
            align-self: flex-start;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .difficulty-easy {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .difficulty-medium {
            background-color: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .difficulty-hard {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .question-title {
            font-size: 22px;
            font-weight: 600;
        }

        .question-statement {
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-secondary);
            white-space: pre-wrap;
        }

        /* Right Side: Code Editor and Terminal */
        .editor-panel {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-primary);
        }

        .editor-controls {
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .btn {
            background-color: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            outline: none;
        }

        .btn:hover {
            background-color: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-primary {
            background-color: var(--accent-primary);
            border-color: var(--accent-primary);
        }

        .btn-primary:hover {
            background-color: #4f46e5;
            border-color: #4f46e5;
            box-shadow: 0 0 12px var(--accent-primary-glow);
        }

        .btn-success {
            background-color: var(--success);
            border-color: var(--success);
        }

        .btn-success:hover {
            background-color: #059669;
            border-color: #059669;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }

        /* Editor Area */
        .editor-container-wrapper {
            flex: 1;
            position: relative;
            min-height: 200px;
            border-bottom: 1px solid var(--border-color);
        }

        #editor-container {
            width: 100%;
            height: 100%;
        }

        /* Results & Logs Area */
        .console-panel {
            height: 280px;
            background-color: var(--bg-secondary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .console-tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            background-color: rgba(0, 0, 0, 0.15);
        }

        .console-tab {
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            border-right: 1px solid var(--border-color);
            cursor: pointer;
            transition: all 0.2s;
            background-color: transparent;
        }

        .console-tab:hover {
            color: var(--text-primary);
            background-color: rgba(255, 255, 255, 0.02);
        }

        .console-tab.active {
            color: var(--text-primary);
            background-color: var(--bg-secondary);
            border-bottom: 2px solid var(--accent-primary);
        }

        .console-body {
            flex: 1;
            padding: 16px 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .tab-content {
            display: none;
            height: 100%;
        }

        .tab-content.active {
            display: block;
        }

        /* Custom Input (Stdin) */
        textarea.stdin-input {
            width: 100%;
            height: 120px;
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            border-radius: 8px;
            padding: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            outline: none;
            resize: none;
        }

        /* Terminal Output */
        .terminal-container {
            background-color: rgba(0, 0, 0, 0.25);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: #d1d5db;
            white-space: pre-wrap;
            overflow: auto;
            max-height: 100%;
            min-height: 80px;
        }

        .terminal-success {
            border-left: 4px solid var(--success);
        }

        .terminal-error {
            border-left: 4px solid var(--error);
            color: #fca5a5;
        }

        /* Metrics Layout */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 16px;
        }

        .metric-card {
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .metric-label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 16px;
            font-weight: 600;
        }

        /* Loading Spinner */
        .loader {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--text-primary);
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <header>
        <div class="logo-container">
            <i class="fa-solid fa-code logo-icon"></i>
            <span class="logo-text">LMS Code Runner</span>
        </div>
        <div class="status-container">
            <div class="status-dot"></div>
            <span>Judge0 CE Connected</span>
        </div>
    </header>

    <!-- Workspace -->
    <div class="workspace">
        <!-- Left Column: Question list -->
        <div class="question-panel">
            <div class="panel-header">
                <div class="selector-label">Select Problem</div>
                <select id="question-select" onchange="loadQuestion()">
                    <option value="">Loading problems...</option>
                </select>
            </div>
            <div class="question-content">
                <div id="diff-badge" class="difficulty-badge">--</div>
                <div id="q-title" class="question-title">Loading...</div>
                <div id="q-statement" class="question-statement">Select a problem to start coding.</div>
            </div>
        </div>

        <!-- Right Column: Code runner -->
        <div class="editor-panel">
            <div class="editor-controls">
                <div class="control-group">
                    <select id="lang-select" style="width: 140px; padding: 6px 10px;" onchange="updateLanguage()">
                        <option value="python">Python 3</option>
                        <option value="java">Java 11</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="sql">SQL (SQLite)</option>
                        <option value="html">HTML5 / CSS3</option>
                        <option value="react">React / JSX</option>
                    </select>
                </div>
                <div class="control-group">
                    <button id="run-btn" class="btn btn-primary" onclick="runCode()">
                        <i class="fa-solid fa-play"></i> Run Code
                    </button>
                    <button id="submit-btn" class="btn btn-success" onclick="submitCode()">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Submit
                    </button>
                </div>
            </div>

            <!-- Monaco Editor wrapper -->
            <div class="editor-container-wrapper">
                <div id="editor-container"></div>
            </div>

            <!-- Terminal Output and Inputs -->
            <div class="console-panel">
                <div class="console-tabs">
                    <div id="tab-input" class="console-tab active" onclick="switchTab('input')">Custom Input (stdin)</div>
                    <div id="tab-output" class="console-tab" onclick="switchTab('output')">Run Result</div>
                    <div id="tab-preview" class="console-tab" style="display: none;" onclick="switchTab('preview')">Live Preview</div>
                    <div id="tab-submit" class="console-tab" onclick="switchTab('submit')">Submission Outcome</div>
                </div>
                <div class="console-body">
                    <!-- Custom input (stdin) -->
                    <div id="content-input" class="tab-content active">
                        <textarea id="stdin-area" class="stdin-input" placeholder="Specify inputs (one line per variable)..."></textarea>
                    </div>

                    <!-- Live Preview tab content -->
                    <div id="content-preview" class="tab-content" style="height: 100%;">
                        <iframe id="preview-iframe" style="width: 100%; height: 210px; border: 1px solid var(--border-color); background-color: #fff; border-radius: 8px;"></iframe>
                    </div>

                    <!-- Run Code Result -->
                    <div id="content-output" class="tab-content">
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <span class="metric-label">Verdict</span>
                                <span id="run-verdict" class="metric-value">--</span>
                            </div>
                            <div class="metric-card">
                                <span class="metric-label">Status</span>
                                <span id="run-status" class="metric-value">--</span>
                            </div>
                            <div class="metric-card">
                                <span class="metric-label">CPU Time</span>
                                <span id="run-time" class="metric-value">--</span>
                            </div>
                            <div class="metric-card">
                                <span class="metric-label">Memory</span>
                                <span id="run-memory" class="metric-value">--</span>
                            </div>
                        </div>
                        <div class="selector-label" style="margin-bottom: 6px;">stdout</div>
                        <div id="run-stdout" class="terminal-container terminal-success">No output.</div>
                        <div class="selector-label" style="margin-top: 12px; margin-bottom: 6px;">stderr / compile log</div>
                        <div id="run-stderr" class="terminal-container terminal-error">No error logs.</div>
                    </div>

                    <!-- Submit Code Result -->
                    <div id="content-submit" class="tab-content">
                        <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="metric-card">
                                <span class="metric-label">Verdict</span>
                                <span id="sub-verdict" class="metric-value">--</span>
                            </div>
                            <div class="metric-card">
                                <span class="metric-label">Passed Cases</span>
                                <span id="sub-passed" class="metric-value">--</span>
                            </div>
                            <div class="metric-card">
                                <span class="metric-label">Total Cases</span>
                                <span id="sub-total" class="metric-value">--</span>
                            </div>
                        </div>
                        <div id="submit-result-text" style="font-size: 16px; font-weight: 500; color: var(--text-secondary);">
                            No submissions made yet. Click Submit above to run code against hidden test cases.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Monaco loader -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs/loader.min.js"></script>
    <script>
        let questions = [];
        let editor = null;

        // Default code templates if none exists in DB
        const defaultTemplates = {
            python: `# Write your Python 3 code here`,
            java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your Java code here
    }
}`,
            javascript: `// Write your JavaScript (Node.js) code here\n`,
            typescript: `// Write your TypeScript code here\n`,
            sql: `-- Write your SQL query here\n`,
            html: `<!-- Write your HTML5 / Tailwind code here -->\n`,
            react: `// Write your React component here\n`
        };

        // Initialize Monaco Editor
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: defaultTemplates.python,
                language: 'python',
                theme: 'vs-dark',
                automaticLayout: true,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                }
            });
            
            // Load questions after editor is ready
            fetchQuestions();
        });

        // Fetch questions from API
        function fetchQuestions() {
            fetch('/questions')
                .then(res => res.json())
                .then(data => {
                    questions = data;
                    const select = document.getElementById('question-select');
                    select.innerHTML = '';
                    
                    if (questions.length === 0) {
                        select.innerHTML = '<option value="">No questions seeded</option>';
                        return;
                    }
                    
                    questions.forEach(q => {
                        const opt = document.createElement('option');
                        opt.value = q.id;
                        opt.textContent = `${q.id}. ${q.title}`;
                        select.appendChild(opt);
                    });
                    
                    // Trigger first question details
                    loadQuestion();
                })
                .catch(err => {
                    console.error('Error fetching questions:', err);
                    document.getElementById('q-title').textContent = "Failed to load questions";
                });
        }

        // Display question details
        function loadQuestion() {
            const select = document.getElementById('question-select');
            const qId = parseInt(select.value);
            const question = questions.find(q => q.id === qId);
            
            if (!question) return;
            
            document.getElementById('q-title').textContent = question.title;
            document.getElementById('q-statement').textContent = question.statement;
            
            const badge = document.getElementById('diff-badge');
            badge.textContent = question.difficulty;
            badge.className = 'difficulty-badge';
            
            if (question.difficulty.toLowerCase() === 'easy') {
                badge.classList.add('difficulty-easy');
            } else if (question.difficulty.toLowerCase() === 'medium') {
                badge.classList.add('difficulty-medium');
            } else {
                badge.classList.add('difficulty-hard');
            }
            
            // Fetch visible testcase for input
            fetch(`/questions/${qId}/testcases`)
                .then(res => res.json())
                .then(tcs => {
                    const visibleTc = tcs.find(tc => !tc.is_hidden);
                    if (visibleTc) {
                        document.getElementById('stdin-area').value = visibleTc.input_data;
                    } else {
                        document.getElementById('stdin-area').value = "";
                    }
                })
                .catch(err => {
                    console.error('Error fetching testcases:', err);
                    document.getElementById('stdin-area').value = "";
                });
                
            // Set editor content to the question template for selected language
            const lang = document.getElementById('lang-select').value;
            let codeTemplate = "";
            if (lang === 'python') codeTemplate = question.template_python;
            else if (lang === 'java') codeTemplate = question.template_java;
            else if (lang === 'javascript') codeTemplate = question.template_javascript;
            else if (lang === 'typescript') codeTemplate = question.template_typescript;
            else if (lang === 'sql') codeTemplate = question.template_sql;
            else if (lang === 'html') codeTemplate = question.template_html;
            else if (lang === 'react') codeTemplate = question.template_react;
            
            editor.setValue(codeTemplate || defaultTemplates[lang] || "");
            
            // Show/hide Live Preview tab depending on language
            const isWeb = (lang === 'html' || lang === 'react');
            document.getElementById('tab-preview').style.display = isWeb ? 'block' : 'none';
        }

        // Change editor language
        function updateLanguage() {
            if (!editor) return;
            const lang = document.getElementById('lang-select').value;
            
            let monacoLang = lang;
            if (lang === 'sql') monacoLang = 'sql';
            else if (lang === 'html') monacoLang = 'html';
            else if (lang === 'react') monacoLang = 'javascript'; // React JSX uses Javascript parser
            else if (lang === 'javascript') monacoLang = 'javascript';
            else if (lang === 'typescript') monacoLang = 'typescript';
            
            monaco.editor.setModelLanguage(editor.getModel(), monacoLang);
            
            const select = document.getElementById('question-select');
            const qId = parseInt(select.value);
            const question = questions.find(q => q.id === qId);
            
            let codeTemplate = "";
            if (question) {
                if (lang === 'python') codeTemplate = question.template_python;
                else if (lang === 'java') codeTemplate = question.template_java;
                else if (lang === 'javascript') codeTemplate = question.template_javascript;
                else if (lang === 'typescript') codeTemplate = question.template_typescript;
                else if (lang === 'sql') codeTemplate = question.template_sql;
                else if (lang === 'html') codeTemplate = question.template_html;
                else if (lang === 'react') codeTemplate = question.template_react;
            }
            
            editor.setValue(codeTemplate || defaultTemplates[lang] || "");
            
            // Show/hide Live Preview tab depending on language
            const isWeb = (lang === 'html' || lang === 'react');
            document.getElementById('tab-preview').style.display = isWeb ? 'block' : 'none';
            if (!isWeb && document.getElementById('tab-preview').classList.contains('active')) {
                switchTab('input');
            }
        }

        // Switch bottom tabs
        function switchTab(tabName) {
            document.querySelectorAll('.console-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.getElementById(`tab-${tabName}`).classList.add('active');
            document.getElementById(`content-${tabName}`).classList.add('active');
        }

        // Run Code Action
        function runCode() {
            if (!editor) return;
            
            const runBtn = document.getElementById('run-btn');
            const lang = document.getElementById('lang-select').value;
            
            // Client-side HTML/React Live Preview Rendering
            if (lang === 'html' || lang === 'react') {
                switchTab('preview');
                const iframe = document.getElementById('preview-iframe');
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const userCode = editor.getValue();
                
                let htmlContent = "";
                if (lang === 'html') {
                    htmlContent = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <script src="https://cdn.tailwindcss.com"><` + `/script>
                        </head>
                        <body class="bg-gray-50 text-gray-900 p-4">
                          ${userCode}
                        </body>
                      </html>
                    `;
                } else if (lang === 'react') {
                    htmlContent = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><` + `/script>
                          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><` + `/script>
                          <script src="https://unpkg.com/@babel/standalone/babel.min.js"><` + `/script>
                          <script src="https://cdn.tailwindcss.com"><` + `/script>
                        </head>
                        <body class="bg-gray-50 text-gray-900 p-4">
                          <div id="root"></div>
                          <script type="text/babel">
                            try {
                              ${userCode}
                            } catch (err) {
                              document.getElementById('root').innerHTML = '<div class="text-red-500 font-bold p-4">React Compilation Error: ' + err.message + '</div>';
                            }
                          <` + `/script>
                        </body>
                      </html>
                    `;
                }
                
                doc.open();
                doc.write(htmlContent);
                doc.close();
                return;
            }
            
            runBtn.disabled = true;
            runBtn.innerHTML = '<span class="loader"></span> Running...';
            
            switchTab('output');
            
            // Clear outputs
            document.getElementById('run-verdict').textContent = "Running...";
            document.getElementById('run-status').textContent = "Processing";
            document.getElementById('run-time').textContent = "--";
            document.getElementById('run-memory').textContent = "--";
            document.getElementById('run-stdout').textContent = "Executing code in Judge0 CE sandbox...";
            document.getElementById('run-stderr').textContent = "Waiting for terminal output...";
            
            const payload = {
                language: lang,
                code: editor.getValue(),
                input: document.getElementById('stdin-area').value
            };
            
            fetch('/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Code';
                
                if (data.error) {
                    document.getElementById('run-verdict').textContent = "API Error";
                    document.getElementById('run-stdout').textContent = "";
                    document.getElementById('run-stderr').textContent = data.error.message || JSON.stringify(data.error);
                    return;
                }
                
                document.getElementById('run-verdict').textContent = data.status;
                document.getElementById('run-status').textContent = data.status;
                document.getElementById('run-time').textContent = data.execution_time + "s";
                document.getElementById('run-memory').textContent = (data.memory / 1024).toFixed(1) + " MB";
                
                document.getElementById('run-stdout').textContent = data.stdout || "No stdout produced.";
                document.getElementById('run-stderr').textContent = data.stderr || "No compile errors or stderr.";
            })
            .catch(err => {
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Code';
                
                document.getElementById('run-verdict').textContent = "Net Error";
                document.getElementById('run-stdout').textContent = "";
                document.getElementById('run-stderr').textContent = err.message || err;
            });
        }

        // Submit Code Action
        function submitCode() {
            if (!editor) return;
            
            const select = document.getElementById('question-select');
            if (!select.value) {
                alert("Please select a problem first.");
                return;
            }
            
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loader"></span> Evaluating...';
            
            switchTab('submit');
            
            document.getElementById('sub-verdict').textContent = "Evaluating...";
            document.getElementById('sub-passed').textContent = "--";
            document.getElementById('sub-total').textContent = "--";
            document.getElementById('submit-result-text').textContent = "Evaluating all hidden test cases in parallel...";
            
            const payload = {
                student_id: 1, // Dummy student ID
                question_id: parseInt(select.value),
                language: document.getElementById('lang-select').value,
                code: editor.getValue()
            };
            
            fetch('/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit';
                
                if (data.error) {
                    document.getElementById('sub-verdict').textContent = "Error";
                    document.getElementById('submit-result-text').textContent = data.error.message || JSON.stringify(data.error);
                    return;
                }
                
                document.getElementById('sub-verdict').textContent = data.verdict;
                document.getElementById('sub-passed').textContent = data.passed;
                document.getElementById('sub-total').textContent = data.total;
                
                if (data.verdict === 'Accepted') {
                    document.getElementById('submit-result-text').innerHTML = 
                        '<span style="color: var(--success); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> All Test Cases Passed!</span>';
                } else {
                    document.getElementById('submit-result-text').innerHTML = 
                        '<span style="color: var(--error); font-weight: 600;"><i class="fa-solid fa-circle-xmark"></i> Failed. Verdict: ' + data.verdict + '</span>';
                }
            })
            .catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit';
                
                document.getElementById('sub-verdict').textContent = "Error";
                document.getElementById('submit-result-text').textContent = err.message || err;
            });
        }
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content, status_code=200)

