function success(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

function created(res, data) {
  return res.status(201).json(data);
}

function error(res, code, message, statusCode = 400) {
  return res.status(statusCode).json({
    error: {
      code: code,
      message: message
    }
  });
}

function notFound(res, resource, id) {
  return error(res, `${resource.toUpperCase()}_NOT_FOUND`, `${resource} with ID ${id} not found`, 404);
}

function noContent(res) {
  return res.status(204).end();
}

module.exports = {
  success,
  created,
  error,
  notFound,
  noContent
};
