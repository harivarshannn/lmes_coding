const { USER_ROLES } = require('../constants');

// Mock token-based auth middleware (to be replaced with JWT in production)
const TOKEN_MAP = {
  'mock-admin-token-12345': { user_id: 1, username: 'admin', role: USER_ROLES.ADMIN },
  'mock-student-token-54321': { user_id: 2, username: 'student', role: USER_ROLES.STUDENT },
  'mock-instructor-token-99999': { user_id: 3, username: 'instructor', role: USER_ROLES.INSTRUCTOR }
};

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is required'
      }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const user = TOKEN_MAP[token];

  if (!user) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      }
    });
  }

  req.user = user;
  next();
}

// Optional auth - attaches user if token present, but doesn't require it
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const user = TOKEN_MAP[token];
    if (user) {
      req.user = user;
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
