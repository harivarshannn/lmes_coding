const test = require('node:test');
const assert = require('assert');

function registerAssignmentTests(BASE_URL) {
  test('Assignment CRUD, submission and grading flows', async () => {
    // 1. Create an assignment
    const createRes = await fetch(`${BASE_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Binary Tree Traversal',
        slug: 'binary-tree-traversal',
        description: 'Implement inorder, preorder and postorder tree traversals.',
        difficulty: 'Medium',
        max_marks: 100,
        deadline: new Date(Date.now() + 1000 * 3600 * 24).toISOString(), // Tomorrow
        language: 'python',
        starter_code: 'def inorder(root): pass',
        auto_grade_enabled: true,
        test_cases: [
          { input: 'tree1', expected_output: '1 2 3', is_hidden: false }
        ]
      })
    });
    assert.strictEqual(createRes.status, 201);
    const assignment = await createRes.json();
    assert.ok(assignment.id > 0);

    // 2. Submit solution
    const submitRes = await fetch(`${BASE_URL}/assignments/${assignment.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 2,
        code: 'def inorder(root):\n    # student solution\n    print("1 2 3")',
        language: 'python'
      })
    });
    assert.strictEqual(submitRes.status, 201);
    const submission = await submitRes.json();
    assert.ok(submission.id > 0);
    assert.strictEqual(submission.status, 'Graded'); // auto-graded because auto_grade_enabled = true

    // 3. View all submissions
    const listRes = await fetch(`${BASE_URL}/assignments/${assignment.id}/submissions`);
    assert.strictEqual(listRes.status, 200);
    const list = await listRes.json();
    assert.ok(list.length > 0);

    // 4. Manual Grading override
    const gradeRes = await fetch(`${BASE_URL}/assignments/submissions/${submission.id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 95,
        feedback: 'Excellent work! A few formatting issues, but logic is perfect.'
      })
    });
    assert.strictEqual(gradeRes.status, 200);
    const graded = await gradeRes.json();
    assert.strictEqual(graded.final_score, 95);
    assert.strictEqual(graded.manual_grade_score, 95);
    assert.strictEqual(graded.feedback, 'Excellent work! A few formatting issues, but logic is perfect.');
  });
}

module.exports = registerAssignmentTests;
