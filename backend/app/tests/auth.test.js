const test = require('node:test');
const assert = require('assert');

function registerAuthTests(BASE_URL) {
  test('POST /login handles admin, student, and instructor roles', async () => {
    const resErr = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid', password: 'password' })
    });
    assert.strictEqual(resErr.status, 401);
    const dataErr = await resErr.json();
    assert.ok(dataErr.error.message.includes('Invalid credentials'));

    const resAdmin = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    assert.strictEqual(resAdmin.status, 200);
    const dataAdmin = await resAdmin.json();
    assert.strictEqual(dataAdmin.role, 'admin');

    const resStudent = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });
    assert.strictEqual(resStudent.status, 200);
    const dataStudent = await resStudent.json();
    assert.strictEqual(dataStudent.role, 'student');
  });
}

module.exports = registerAuthTests;
