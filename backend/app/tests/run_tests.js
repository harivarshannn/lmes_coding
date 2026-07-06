process.env.NODE_ENV = 'test';
process.env.JUDGE0_URL = ''; // Force MockJudge0Service

const test = require('node:test');
const assert = require('assert');
const app = require('../main');
const seed = require('../seed/seed_data');
const db = require('../database/session');

let server;
const PORT = 8001;
const BASE_URL = `http://localhost:${PORT}`;

test.before(async () => {
  await seed();
  server = app.listen(PORT);
  await new Promise(resolve => setTimeout(resolve, 500));
});

test.after(async () => {
  if (server) {
    server.close();
  }
  await db.close();
  // Wait briefly for all sockets to close
  await new Promise(resolve => setTimeout(resolve, 500));
  // Force process exit to ensure test runner finishes cleanly
  process.exit(0);
});

test('GET /health returns status ok', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data, { status: 'ok' });
});

test('POST /login handles admin and student roles', async () => {
  // Invalid login
  const resErr = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'invalid', password: 'password' })
  });
  assert.strictEqual(resErr.status, 401);
  const dataErr = await resErr.json();
  assert.ok(dataErr.error.message.includes('Invalid credentials'));

  // Admin login
  const resAdmin = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  assert.strictEqual(resAdmin.status, 200);
  const dataAdmin = await resAdmin.json();
  assert.strictEqual(dataAdmin.role, 'admin');

  // Student login
  const resStudent = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'student', password: 'student123' })
  });
  assert.strictEqual(resStudent.status, 200);
  const dataStudent = await resStudent.json();
  assert.strictEqual(dataStudent.role, 'student');
});

test('GET /questions and CRUD operations', async () => {
  const resAll = await fetch(`${BASE_URL}/questions`);
  assert.strictEqual(resAll.status, 200);
  const questions = await resAll.json();
  assert.ok(questions.length >= 5);

  const resOne = await fetch(`${BASE_URL}/questions/1`);
  assert.strictEqual(resOne.status, 200);
  const q1 = await resOne.json();
  assert.strictEqual(q1.id, 1);
  assert.strictEqual(q1.slug, 'two-sum');

  const res404 = await fetch(`${BASE_URL}/questions/999`);
  assert.strictEqual(res404.status, 404);

  const createRes = await fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'New Question',
      slug: 'new-question',
      description: 'Solve this new challenge',
      difficulty: 'Medium'
    })
  });
  assert.strictEqual(createRes.status, 201);
  const newQ = await createRes.json();
  assert.strictEqual(newQ.title, 'New Question');

  const dupRealRes = await fetch(`${BASE_URL}/questions/${newQ.id}/duplicate`, { method: 'POST' });
  assert.strictEqual(dupRealRes.status, 201);
  const dupQ = await dupRealRes.json();
  assert.strictEqual(dupQ.title, 'New Question (Duplicate)');

  const delRes = await fetch(`${BASE_URL}/questions/${newQ.id}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 204);
});

test('TestCase CRUD operations', async () => {
  const createRes = await fetch(`${BASE_URL}/questions/1/testcases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: '1 2 3',
      expected_output: '6',
      is_hidden: false
    })
  });
  assert.strictEqual(createRes.status, 201);
  const newTc = await createRes.json();
  assert.strictEqual(newTc.question_id, 1);

  const getRes = await fetch(`${BASE_URL}/questions/1/testcases`);
  assert.strictEqual(getRes.status, 200);
  const testcases = await getRes.json();
  assert.ok(testcases.length > 0);

  const delRes = await fetch(`${BASE_URL}/testcases/${newTc.id}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 204);
});

test('POST /run runs code successfully', async () => {
  const res = await fetch(`${BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      code: "print('hello')",
      input: ''
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'Accepted');
  assert.strictEqual(data.stdout, 'hello\n');

  const resErr = await fetch(`${BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'rust',
      code: 'fn main() {}',
      input: ''
    })
  });
  assert.strictEqual(resErr.status, 400);
  const dataErr = await resErr.json();
  assert.strictEqual(dataErr.error.code, 'INVALID_LANGUAGE');
});

test('Submissions and Leaderboard flows', async () => {
  const submitRes = await fetch(`${BASE_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: 1,
      question_id: 1,
      language: 'python',
      code: "print('hello')"
    })
  });
  assert.strictEqual(submitRes.status, 201);
  const subData = await submitRes.json();
  assert.ok(subData.submission_id > 0);

  const studentSubs = await fetch(`${BASE_URL}/students/1/submissions`);
  assert.strictEqual(studentSubs.status, 200);
  const list = await studentSubs.json();
  assert.ok(list.length > 0);

  const leaderRes = await fetch(`${BASE_URL}/leaderboard`);
  assert.strictEqual(leaderRes.status, 200);
  const leaderboard = await leaderRes.json();
  assert.ok(leaderboard.length > 0);
});
