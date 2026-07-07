function validateAssignmentCreation(body) {
  const errors = [];
  if (!body.title) errors.push('title is required');
  if (!body.slug) errors.push('slug is required');
  if (body.max_marks !== undefined && (typeof body.max_marks !== 'number' || body.max_marks < 0)) {
    errors.push('max_marks must be a non-negative number');
  }
  if (body.deadline) {
    const d = new Date(body.deadline);
    if (isNaN(d.getTime())) errors.push('deadline must be a valid date');
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateSubmission(body) {
  const errors = [];
  if (!body.code && body.code !== '') errors.push('code is required');
  if (!body.user_id) errors.push('user_id is required');
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateGrading(body) {
  const errors = [];
  if (body.score === undefined || body.score === null) errors.push('score is required');
  if (typeof body.score === 'number' && body.score < 0) errors.push('score must be non-negative');
  return errors.length > 0 ? errors.join('; ') : null;
}

module.exports = { validateAssignmentCreation, validateSubmission, validateGrading };
