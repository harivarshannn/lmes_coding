const test = require('node:test');
const assert = require('assert');

function registerMcqTests(BASE_URL) {
  test('MCQ Quiz CRUD, Question Management, and Attempt Flows', async () => {
    // 1. Create a quiz (Admin role simulation)
    const createQuizRes = await fetch(`${BASE_URL}/mcq/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Algorithms Midterm',
        slug: 'algo-midterm',
        description: 'Midterm quiz covering sorting and recursion.',
        difficulty: 'Medium',
        time_limit_minutes: 20
      })
    });
    assert.strictEqual(createQuizRes.status, 201);
    const quiz = await createQuizRes.json();
    assert.strictEqual(quiz.title, 'Algorithms Midterm');
    assert.ok(quiz.id > 0);

    // 2. Add question to quiz
    const addQRes = await fetch(`${BASE_URL}/mcq/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_text: 'What is the worst-case complexity of QuickSort?',
        options: [
          { key: 'A', text: 'O(N log N)' },
          { key: 'B', text: 'O(N^2)' },
          { key: 'C', text: 'O(N)' },
          { key: 'D', text: 'O(log N)' }
        ],
        correct_answer: 'B',
        explanation: 'In the worst case (already sorted array with bad pivot choices), QuickSort runs in O(N^2).',
        marks: 5,
        order: 1
      })
    });
    assert.strictEqual(addQRes.status, 201);
    const question = await addQRes.json();
    assert.strictEqual(question.correct_answer, 'B');

    // 3. Start attempt (Student role)
    const startRes = await fetch(`${BASE_URL}/mcq/quizzes/${quiz.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }) // Mock student
    });
    assert.strictEqual(startRes.status, 201);
    const attempt = await startRes.json();
    assert.ok(attempt.attempt_id > 0);
    assert.strictEqual(attempt.questions.length, 1);

    // 4. Submit attempt answers (correct answer)
    const answers = {};
    answers[String(question.id)] = 'B';

    const submitRes = await fetch(`${BASE_URL}/mcq/attempts/${attempt.attempt_id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: answers,
        time_taken_seconds: 120
      })
    });
    assert.strictEqual(submitRes.status, 200);
    const result = await submitRes.json();
    assert.strictEqual(result.status, 'Completed');
    assert.strictEqual(result.score, 5);

    // 5. Get attempt result
    const resultRes = await fetch(`${BASE_URL}/mcq/attempts/${attempt.attempt_id}/result`);
    assert.strictEqual(resultRes.status, 200);
    const resultDetails = await resultRes.json();
    assert.strictEqual(resultDetails.percentage, 100);
    assert.strictEqual(resultDetails.details[0].is_correct, true);
  });
}

module.exports = registerMcqTests;
