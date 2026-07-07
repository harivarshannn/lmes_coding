process.env.NODE_ENV = 'test';
process.env.JUDGE0_URL = ''; // Force MockJudge0Service

const test = require('node:test');
const assert = require('assert');
const app = require('../main');
const seed = require('../seed/seed_data');
const db = require('../database/session');

const registerAuthTests = require('./auth.test');
const registerCodingTests = require('./coding.test');
const registerMcqTests = require('./mcq.test');
const registerAssignmentTests = require('./assignment.test');
const registerBugfixTests = require('./bugfix.test');

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

  try {
    const updateSkills = require('../../scripts/update_context');
    updateSkills();
  } catch (err) {
    console.error('Failed to auto-update skills context:', err);
  }

  // Wait briefly for all sockets to close
  await new Promise(resolve => setTimeout(resolve, 500));
  // Force process exit to ensure test runner finishes cleanly
  process.exit(0);
});

// Core / health tests
test('GET /health returns status ok', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.deepStrictEqual(data, { status: 'ok' });
});

// Register module test suites
registerAuthTests(BASE_URL);
registerCodingTests(BASE_URL);
registerMcqTests(BASE_URL);
registerAssignmentTests(BASE_URL);
registerBugfixTests(BASE_URL);
