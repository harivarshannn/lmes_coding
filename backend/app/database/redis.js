const Redis = require('ioredis');
const settings = require('../config/settings');

const redisClient = new Redis(settings.resolved_redis_url, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

class RedisCache {
  static async set(key, value, expireSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.set(key, serialized, 'EX', expireSeconds);
      return true;
    } catch (e) {
      console.error(`Redis Cache Set Error: ${e}`);
      return false;
    }
  }

  static async get(key) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Redis Cache Get Error: ${e}`);
    }
    return null;
  }

  static async delete(key) {
    try {
      const res = await redisClient.del(key);
      return res > 0;
    } catch (e) {
      console.error(`Redis Cache Delete Error: ${e}`);
      return false;
    }
  }

  static async clear_pattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        const res = await redisClient.del(keys);
        return res;
      }
    } catch (e) {
      console.error(`Redis Cache Clear Pattern Error: ${e}`);
    }
    return 0;
  }
}

class RedisQueue {
  static async push(queueName, payload) {
    const serialized = JSON.stringify(payload);
    return redisClient.rpush(queueName, serialized);
  }

  static async pop(queueName, timeoutSeconds = 0) {
    try {
      const res = await redisClient.blpop(queueName, timeoutSeconds);
      if (res) {
        const [_, val] = res;
        return JSON.parse(val);
      }
    } catch (e) {
      console.error(`Redis Queue Pop Error: ${e}`);
      throw e;
    }
    return null;
  }
}

class RedisRateLimiter {
  static async is_rate_limited(key, limit, windowSeconds) {
    try {
      const current = await redisClient.get(key);
      if (current !== null) {
        if (parseInt(current, 10) >= limit) {
          return true;
        }
        await redisClient.incr(key);
      } else {
        const pipe = redisClient.pipeline();
        pipe.set(key, 1, 'EX', windowSeconds);
        await pipe.exec();
      }
    } catch (e) {
      console.error(`Redis Rate Limiter Error: ${e}`);
    }
    return false;
  }
}

module.exports = {
  redisClient,
  RedisCache,
  RedisQueue,
  RedisRateLimiter
};
