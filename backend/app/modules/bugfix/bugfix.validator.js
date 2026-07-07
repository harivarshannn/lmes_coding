function validateChallengeCreation(body) {
  const errors = [];
  if (!body.title) errors.push('title is required');
  if (!body.slug) errors.push('slug is required');
  if (!body.buggy_code) errors.push('buggy_code is required');
  if (!body.language) errors.push('language is required');
  if (body.max_attempts !== undefined && (typeof body.max_attempts !== 'number' || body.max_attempts < 1)) {
    errors.push('max_attempts must be a positive number');
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateFixAttempt(body) {
  const errors = [];
  if (!body.submitted_code && body.submitted_code !== '') errors.push('submitted_code is required');
  if (!body.user_id) errors.push('user_id is required');
  return errors.length > 0 ? errors.join('; ') : null;
}

module.exports = { validateChallengeCreation, validateFixAttempt };
