function validateQuizCreation(body) {
  const errors = [];
  if (!body.title) errors.push('title is required');
  if (!body.slug) errors.push('slug is required');
  if (body.time_limit_minutes !== undefined && (typeof body.time_limit_minutes !== 'number' || body.time_limit_minutes < 1)) {
    errors.push('time_limit_minutes must be a positive number');
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateQuestionCreation(body) {
  const errors = [];
  if (!body.question_text) errors.push('question_text is required');
  if (!body.options || !Array.isArray(body.options) || body.options.length < 2) {
    errors.push('options must be an array with at least 2 items');
  }
  if (!body.correct_answer) errors.push('correct_answer is required');
  if (body.options && body.correct_answer) {
    const keys = body.options.map(o => o.key);
    if (!keys.includes(body.correct_answer)) {
      errors.push('correct_answer must match one of the option keys');
    }
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateAttemptSubmission(body) {
  const errors = [];
  if (!body.answers || typeof body.answers !== 'object') {
    errors.push('answers object is required');
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

module.exports = { validateQuizCreation, validateQuestionCreation, validateAttemptSubmission };
