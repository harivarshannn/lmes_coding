function isValidId(value) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0;
}

function isNonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function isPaginated(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function requireFields(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

module.exports = {
  isValidId,
  isNonEmpty,
  isPaginated,
  requireFields
};
