const { RedisRateLimiter } = require('../../database/redis');

function rateLimit(limit, windowSeconds) {
  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const path = req.path;
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = `rate_limit:${ip}:${path}`;
    const isLimited = await RedisRateLimiter.is_rate_limited(key, limit, windowSeconds);
    if (isLimited) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.'
        }
      });
    }
    next();
  };
}

module.exports = rateLimit;
