const test = require('node:test');
const assert = require('assert');

function registerBugfixTests(BASE_URL) {
  test('Bugfix challenge CRUD, attempt submission, progressive hints flows', async () => {
    // 1. Create a challenge
    const createRes = await fetch(`${BASE_URL}/bugfix/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Fix Loop Bug',
        slug: 'fix-loop-bug',
        description: 'Fix the infinite loop in the search function.',
        difficulty: 'Easy',
        language: 'python',
        buggy_code: 'def f():\n  while True: pass',
        correct_code: 'def f():\n  pass',
        hints: [
          'Break the loop.',
          'Just remove the while block.'
        ],
        test_cases: [],
        max_attempts: 3,
        xp_reward: 30
      })
    });
    assert.strictEqual(createRes.status, 201);
    const challenge = await createRes.json();
    assert.ok(challenge.id > 0);

    // 2. Submit wrong fix attempt
    const submitWrongRes = await fetch(`${BASE_URL}/bugfix/challenges/${challenge.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 2,
        submitted_code: 'def f():\n  # still buggy'
      })
    });
    assert.strictEqual(submitWrongRes.status, 201);
    const attempt1 = await submitWrongRes.json();
    assert.strictEqual(attempt1.is_accepted, false);
    assert.strictEqual(attempt1.attempt_number, 1);
    assert.strictEqual(attempt1.hint, 'Break the loop.'); // First hint revealed

    // 3. Submit second wrong fix attempt
    const submitWrong2Res = await fetch(`${BASE_URL}/bugfix/challenges/${challenge.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 2,
        submitted_code: 'def f():\n  # still buggy 2'
      })
    });
    assert.strictEqual(submitWrong2Res.status, 201);
    const attempt2 = await submitWrong2Res.json();
    assert.strictEqual(attempt2.is_accepted, false);
    assert.strictEqual(attempt2.attempt_number, 2);
    assert.strictEqual(attempt2.hint, 'Just remove the while block.'); // Second hint revealed

    // 4. Submit correct fix
    const submitCorrectRes = await fetch(`${BASE_URL}/bugfix/challenges/${challenge.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 2,
        submitted_code: 'def f():\n  pass'
      })
    });
    assert.strictEqual(submitCorrectRes.status, 201);
    const attempt3 = await submitCorrectRes.json();
    assert.strictEqual(attempt3.is_accepted, true);
    assert.strictEqual(attempt3.status, 'Accepted');

    // 5. Get attempt result details
    const resultRes = await fetch(`${BASE_URL}/bugfix/attempts/${attempt3.attempt_id}/result`);
    assert.strictEqual(resultRes.status, 200);
    const attemptDetails = await resultRes.json();
    assert.strictEqual(attemptDetails.status, 'Accepted');
  });
}

module.exports = registerBugfixTests;
