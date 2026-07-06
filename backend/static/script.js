let questions = [];
let editor = null;
const studentId = 1; // Default dummy student for practice platform

// Default code templates if none exist
const defaultTemplates = {
    python: `# Complete the solve function below
def solve(n):
    # Write your Python 3 code here
    pass

if __name__ == "__main__":
    import sys
    # Read inputs if required
    print(solve(5))
`,
    javascript: `// Complete the solve function below
function solve(n) {
    // Write your JavaScript (Node.js) code here
    return n;
}

console.log(solve(5));
`,
    sql: `-- Write your SQL query here to retrieve data
SELECT * FROM employees;
`,
    html: `<!-- Create an HTML button with id='submit-btn' and text 'Submit Form' -->
<!-- Use Tailwind CSS classes: bg-blue-600 text-white px-4 py-2 rounded -->
<div class="flex justify-center items-center min-h-screen">
  <button id="submit-btn" class="bg-blue-600 text-white px-4 py-2 rounded">
    Submit Form
  </button>
</div>
`
};

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: defaultTemplates.python,
        language: 'python',
        theme: 'vs',
        automaticLayout: true,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        minimap: { enabled: false }
    });
    
    // Load data once editor is ready
    fetchTopics();
    fetchQuestions();
    fetchLeaderboard();
});

// Fetch topics from API
function fetchTopics() {
    // Standard topics mapping
    fetch('/questions')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('topic-select');
            select.innerHTML = '<option value="all">All Topics</option>';
            
            // Get unique topics if populated, or dummy topics
            const topics = [...new Set(data.map(q => q.topic_id).filter(Boolean))];
            topics.forEach(tId => {
                const opt = document.createElement('option');
                opt.value = tId;
                opt.textContent = `Topic ${tId}`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error("Error fetching topics:", err));
}

// Fetch questions list
function fetchQuestions() {
    fetch('/questions')
        .then(res => res.json())
        .then(data => {
            questions = data;
            populateQuestionsSelect();
        })
        .catch(err => {
            console.error('Error fetching questions:', err);
            document.getElementById('q-title').textContent = "Failed to load questions";
        });
}

function populateQuestionsSelect() {
    const select = document.getElementById('question-select');
    const topicVal = document.getElementById('topic-select').value;
    select.innerHTML = '';
    
    const filtered = questions.filter(q => {
        if (topicVal === "all") return true;
        return q.topic_id == topicVal;
    });

    if (filtered.length === 0) {
        select.innerHTML = '<option value="">No questions found</option>';
        return;
    }
    
    filtered.forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = `${q.id}. ${q.title}`;
        select.appendChild(opt);
    });
    
    loadQuestion();
}

function filterQuestions() {
    populateQuestionsSelect();
}

// Display selected question
function loadQuestion() {
    const select = document.getElementById('question-select');
    const qId = parseInt(select.value);
    const question = questions.find(q => q.id === qId);
    
    if (!question) return;
    
    document.getElementById('q-title').textContent = question.title;
    document.getElementById('q-statement').textContent = question.description || question.statement;
    
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
    
    document.getElementById('estimated-time').innerHTML = `<i class="fa-regular fa-clock"></i> ${question.estimated_time || 15} mins`;
    document.getElementById('question-marks').innerHTML = `<i class="fa-solid fa-award"></i> ${question.marks || 10} XP`;
    
    // Clear hint UI
    document.getElementById('hint-body').innerHTML = "No hints revealed yet. Complete code attempts to unlock progressive hints!";
    document.getElementById('solution-section').style.display = "none";
    document.getElementById('reveal-hint-btn').style.display = "inline-block";

    // Set editor template code
    const lang = document.getElementById('lang-select').value;
    let codeTemplate = "";
    if (lang === 'python') codeTemplate = question.template_python;
    else if (lang === 'javascript') codeTemplate = question.template_javascript;
    else if (lang === 'sql') codeTemplate = question.template_sql;
    else if (lang === 'html') codeTemplate = question.template_html;
    
    editor.setValue(codeTemplate || defaultTemplates[lang] || "");
    
    // Load visible test case into stdin
    fetch(`/questions/${qId}/testcases`)
        .then(res => res.json())
        .then(tcs => {
            const visibleTc = tcs.find(tc => !tc.is_hidden);
            if (visibleTc) {
                document.getElementById('stdin-area').value = visibleTc.input;
            } else {
                document.getElementById('stdin-area').value = "";
            }
        })
        .catch(err => {
            console.error('Error fetching testcases:', err);
            document.getElementById('stdin-area').value = "";
        });
        
    // Show/hide Live Preview tab depending on language
    const isWeb = (lang === 'html');
    document.getElementById('tab-preview').style.display = isWeb ? 'block' : 'none';
}

function updateLanguage() {
    if (!editor) return;
    const lang = document.getElementById('lang-select').value;
    
    let monacoLang = lang;
    if (lang === 'html') monacoLang = 'html';
    else if (lang === 'javascript') monacoLang = 'javascript';
    else if (lang === 'python') monacoLang = 'python';
    else if (lang === 'sql') monacoLang = 'sql';
    
    monaco.editor.setModelLanguage(editor.getModel(), monacoLang);
    
    const select = document.getElementById('question-select');
    const qId = parseInt(select.value);
    const question = questions.find(q => q.id === qId);
    
    let codeTemplate = "";
    if (question) {
        if (lang === 'python') codeTemplate = question.template_python;
        else if (lang === 'javascript') codeTemplate = question.template_javascript;
        else if (lang === 'sql') codeTemplate = question.template_sql;
        else if (lang === 'html') codeTemplate = question.template_html;
    }
    
    editor.setValue(codeTemplate || defaultTemplates[lang] || "");
    
    const isWeb = (lang === 'html');
    document.getElementById('tab-preview').style.display = isWeb ? 'block' : 'none';
    if (!isWeb && document.getElementById('tab-preview').classList.contains('active')) {
        switchConsoleTab('input');
    }
}

// Tabs
function switchConsoleTab(tabName) {
    document.querySelectorAll('.console-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`content-${tabName}`).classList.add('active');
}

function switchSideTab(tabName) {
    document.querySelectorAll('.side-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.side-tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`side-tab-${tabName}`).classList.add('active');
    document.getElementById(`side-content-${tabName}`).classList.add('active');
}

// Client-side HTML/CSS Sandbox Live Preview & Validation (TASK 7)
function renderAndValidateWebSandbox() {
    const iframe = document.getElementById('preview-iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const userCode = editor.getValue();
    
    // Inject user code + Tailwind CSS support inside the sandboxed iframe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100 p-4">
          ${userCode}
        </body>
      </html>
    `;
    
    doc.open();
    doc.write(htmlContent);
    doc.close();
    
    // Wait for DOM parsing to validate
    setTimeout(() => {
        validateWebSandboxDOM(doc);
    }, 100);
}

function validateWebSandboxDOM(iframeDoc) {
    const select = document.getElementById('question-select');
    const qId = parseInt(select.value);
    const badge = document.getElementById('preview-validation-badge');
    
    if (qId === 5 || qId === 6 || qId === 7) { // HTML / Button questions
        const btn = iframeDoc.getElementById('submit-btn');
        if (!btn) {
            badge.textContent = "Validation FAILED: Missing id='submit-btn'";
            badge.className = "validation-badge validation-fail";
            return false;
        }
        
        const innerText = btn.innerText.trim();
        if (!innerText.toLowerCase().includes("submit")) {
            badge.textContent = "Validation FAILED: Button text must contain 'Submit'";
            badge.className = "validation-badge validation-fail";
            return false;
        }

        // Validate styling properties using computedStyle or CSS classes check
        const classStr = btn.getAttribute('class') || "";
        const hasBlueBg = classStr.includes('bg-blue') || classStr.includes('bg-indigo');
        const hasTextWhite = classStr.includes('text-white');
        
        if (!hasBlueBg) {
            badge.textContent = "Validation FAILED: Missing blue background styling class";
            badge.className = "validation-badge validation-fail";
            return false;
        }
        
        if (!hasTextWhite) {
            badge.textContent = "Validation FAILED: Missing text-white styling class";
            badge.className = "validation-badge validation-fail";
            return false;
        }
        
        badge.textContent = "Validation PASSED: Perfect Layout!";
        badge.className = "validation-badge validation-pass";
        return true;
    }
    
    badge.textContent = "Preview Rendered";
    badge.className = "validation-badge validation-pass";
    return true;
}

// Run Code Action
function runCode() {
    if (!editor) return;
    
    const runBtn = document.getElementById('run-btn');
    const lang = document.getElementById('lang-select').value;
    
    if (lang === 'html') {
        switchConsoleTab('preview');
        renderAndValidateWebSandbox();
        return;
    }
    
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="loader"></span> Running...';
    switchConsoleTab('output');
    
    document.getElementById('run-verdict').textContent = "Running...";
    document.getElementById('run-status').textContent = "Processing";
    document.getElementById('run-time').textContent = "--";
    document.getElementById('run-memory').textContent = "--";
    document.getElementById('run-stdout').textContent = "Executing code in sandboxed worker...";
    document.getElementById('run-stderr').textContent = "Waiting for logs...";
    
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
        
        if (data.detail && data.detail.message) {
            document.getElementById('run-verdict').textContent = "API Error";
            document.getElementById('run-stdout').textContent = "";
            document.getElementById('run-stderr').textContent = data.detail.message;
            return;
        }
        
        document.getElementById('run-verdict').textContent = data.status;
        document.getElementById('run-status').textContent = data.status;
        document.getElementById('run-time').textContent = data.execution_time + "s";
        document.getElementById('run-memory').textContent = (data.memory / 1024).toFixed(1) + " MB";
        document.getElementById('run-stdout').textContent = data.stdout || "No stdout output.";
        document.getElementById('run-stderr').textContent = data.stderr || "No stderr output.";
    })
    .catch(err => {
        runBtn.disabled = false;
        runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Code';
        document.getElementById('run-verdict').textContent = "Network Error";
        document.getElementById('run-stdout').textContent = "";
        document.getElementById('run-stderr').textContent = err.message || err;
    });
}

// Submit Code Action (Asynchronous Queue Polling)
function submitCode() {
    if (!editor) return;
    
    const select = document.getElementById('question-select');
    if (!select.value) {
        alert("Please select a problem first.");
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const lang = document.getElementById('lang-select').value;
    
    // HTML client-side mock submission persistence
    if (lang === 'html') {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loader"></span> Saving...';
        switchConsoleTab('submit');
        
        const iframe = document.getElementById('preview-iframe');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const passed = validateWebSandboxDOM(doc);
        
        // Post mock submission to save in postgres and trigger streak/leaderboard rewards
        const payload = {
            student_id: studentId,
            question_id: parseInt(select.value),
            language: "python", // HTML grader is written in python or executed through backend mock
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
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
            
            // Poll for completion (the backend will process it as normal, since the grader is seeded as a check script)
            pollSubmission(data.submission_id);
        })
        .catch(err => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
            alert("Submission error: " + err.message);
        });
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Enqueuing...';
    switchConsoleTab('submit');
    
    document.getElementById('sub-verdict').textContent = "Enqueuing...";
    document.getElementById('sub-passed').textContent = "--";
    document.getElementById('sub-total').textContent = "--";
    document.getElementById('submit-result-text').textContent = "Submission entering Redis queue...";
    
    const payload = {
        student_id: studentId,
        question_id: parseInt(select.value),
        language: lang,
        code: editor.getValue()
    };
    
    fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.detail && data.detail.message) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
            document.getElementById('sub-verdict').textContent = "Error";
            document.getElementById('submit-result-text').textContent = data.detail.message;
            return;
        }
        
        // Start polling the queue outcome
        pollSubmission(data.submission_id);
    })
    .catch(err => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
        document.getElementById('sub-verdict').textContent = "Error";
        document.getElementById('submit-result-text').textContent = err.message || err;
    });
}

// Poll submission outcome until final verdict (Async Polling Architecture)
function pollSubmission(subId) {
    const submitBtn = document.getElementById('submit-btn');
    const MAX_POLL_SECONDS = 120; // 2 minute max polling window
    const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
    let elapsed = 0;
    
    document.getElementById('submit-result-text').textContent = "Processing submission in background worker...";
    
    const interval = setInterval(() => {
        elapsed += POLL_INTERVAL_MS / 1000;
        
        // Show elapsed time to user
        document.getElementById('sub-verdict').textContent = 
            elapsed <= 5 ? "In Queue..." : "Processing...";
        document.getElementById('submit-result-text').textContent = 
            `Evaluating test cases... (${Math.round(elapsed)}s elapsed)`;
        
        // Timeout guard: stop polling after MAX_POLL_SECONDS
        if (elapsed >= MAX_POLL_SECONDS) {
            clearInterval(interval);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
            document.getElementById('sub-verdict').textContent = "Timeout";
            document.getElementById('submit-result-text').innerHTML = 
                '<span style="color: var(--accent-error); font-weight: 600;">' +
                '<i class="fa-solid fa-clock"></i> Polling timed out after ' + MAX_POLL_SECONDS + 
                's. Your submission is still being processed in the background. ' +
                'Refresh the page to check the result.</span>';
            return;
        }
        
        fetch(`/submissions/${subId}/status`)
            .then(res => res.json())
            .then(data => {
                const status = data.status;
                document.getElementById('sub-verdict').textContent = status;
                
                if (status !== "In Queue" && status !== "Processing") {
                    // Final verdict arrived
                    clearInterval(interval);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Submit Code';
                    
                    document.getElementById('sub-passed').textContent = data.passed;
                    document.getElementById('sub-total').textContent = data.total;
                    
                    if (status === 'Accepted') {
                        document.getElementById('submit-result-text').innerHTML = 
                            '<span style="color: var(--accent-success); font-weight: 600;">' +
                            '<i class="fa-solid fa-circle-check"></i> Accepted! All Test Cases Passed. ' +
                            '(' + Math.round(elapsed) + 's)</span>';
                    } else {
                        document.getElementById('submit-result-text').innerHTML = 
                            '<span style="color: var(--accent-error); font-weight: 600;">' +
                            '<i class="fa-solid fa-circle-xmark"></i> Failed. Verdict: ' + status + 
                            ' (' + Math.round(elapsed) + 's)</span>';
                    }
                    
                    // Fetch updated profile stats & leaderboard
                    fetchLeaderboard();
                    
                    // Fetch AI feedback on the attempt
                    fetchAIFeedback(subId);
                }
            })
            .catch(err => {
                // Don't kill the interval on transient network errors; just log
                console.error("Poll error:", err.message);
            });
    }, POLL_INTERVAL_MS);
}

// AI Hints Reveal System (TASK 8)
function revealNextHint() {
    const select = document.getElementById('question-select');
    const qId = parseInt(select.value);
    
    fetch(`/questions/${qId}/stage?student_id=${studentId}`)
        .then(res => res.json())
        .then(data => {
            const hintBody = document.getElementById('hint-body');
            hintBody.innerHTML = `<strong>Stage ${data.stage} Hint:</strong><br>${data.hint}`;
            
            if (data.solution_unlocked) {
                document.getElementById('solution-section').style.display = "block";
                document.getElementById('solution-explanation').textContent = data.solution.explanation;
                document.getElementById('solution-complexity').textContent = `Complexity: ${data.solution.complexity}`;
                document.getElementById('solution-code').textContent = data.solution.code;
                document.getElementById('reveal-hint-btn').style.display = "none";
            }
        })
        .catch(err => {
            alert("Failed to fetch hints: " + err.message);
        });
}

// AI Feedback (TASK 8)
function fetchAIFeedback(attemptId) {
    document.getElementById('ai-feedback-content').textContent = "Generating AI feedback for your submission...";
    
    fetch(`/attempts/${attemptId}/feedback?student_id=${studentId}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            document.getElementById('ai-feedback-content').textContent = data.feedback;
        })
        .catch(err => {
            document.getElementById('ai-feedback-content').textContent = "Error generating AI feedback: " + err.message;
        });
}

// Fetch Leaderboard and User Profile (XP & Streak)
function fetchLeaderboard() {
    fetch('/leaderboard')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            
            data.forEach(l => {
                const item = document.createElement('div');
                item.className = 'leader-item';
                
                let rankClass = `leader-rank-${l.rank}`;
                item.innerHTML = `
                    <div class="leader-rank-name">
                        <div class="leader-rank ${rankClass}">${l.rank}</div>
                        <div class="leader-name">${l.username}</div>
                    </div>
                    <div class="leader-xp">${l.xp} XP</div>
                `;
                list.appendChild(item);
                
                // If it's our current user, update the headers
                if (l.user_id === studentId) {
                    document.getElementById('xp-count').textContent = l.xp;
                }
            });
        })
        .catch(err => console.error("Error loading leaderboard:", err));
        
    // Retrieve mock student streak from active streaks table or dummy
    fetch(`/students/${studentId}/submissions`)
        .then(res => res.json())
        .then(subs => {
            // Count unique days or show a basic streak
            const solved = subs.filter(s => s.status === 'Accepted').length;
            document.getElementById('streak-count').textContent = solved > 0 ? Math.min(solved, 5) : 0;
        })
        .catch(err => console.error("Error checking streak:", err));
}
