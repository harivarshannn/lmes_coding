const { USER_ROLES } = require('../constants');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${roles.join(', ')}` 
        }
      });
    }

    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole(USER_ROLES.ADMIN)(req, res, next);
}

function requireInstructor(req, res, next) {
  return requireRole(USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR)(req, res, next);
}

function requireStudent(req, res, next) {
  return requireRole(USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.INSTRUCTOR)(req, res, next);
}

module.exports = { requireRole, requireAdmin, requireInstructor, requireStudent };
