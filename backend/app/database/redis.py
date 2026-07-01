import json
import redis
from typing import Optional, Any
from app.config.settings import settings

# Create a connection pool for Redis
pool = redis.ConnectionPool.from_url(settings.resolved_redis_url, decode_responses=True)
redis_client = redis.Redis(connection_pool=pool)

class RedisCache:
    """Helper for JSON-serialized cache operations in Redis."""
    
    @staticmethod
    def set(key: str, value: Any, expire_seconds: int = 3600) -> bool:
        try:
            serialized = json.dumps(value)
            return redis_client.set(key, serialized, ex=expire_seconds)
        except Exception as e:
            # Silently log/ignore cache errors to avoid breaking API flows on Redis failure
            print(f"Redis Cache Set Error: {e}")
            return False

    @staticmethod
    def get(key: str) -> Optional[Any]:
        try:
            data = redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Redis Cache Get Error: {e}")
        return None

    @staticmethod
    def delete(key: str) -> bool:
        try:
            return bool(redis_client.delete(key))
        except Exception as e:
            print(f"Redis Cache Delete Error: {e}")
            return False

    @staticmethod
    def clear_pattern(pattern: str) -> int:
        try:
            keys = redis_client.keys(pattern)
            if keys:
                return redis_client.delete(*keys)
        except Exception as e:
            print(f"Redis Cache Clear Pattern Error: {e}")
        return 0

class RedisQueue:
    """Simple Redis list-based queue for task queueing."""
    
    @staticmethod
    def push(queue_name: str, payload: Any) -> int:
        serialized = json.dumps(payload)
        return redis_client.rpush(queue_name, serialized)

    @staticmethod
    def pop(queue_name: str, timeout_seconds: int = 0) -> Optional[Any]:
        # blpop waits and returns (key, value)
        res = redis_client.blpop(queue_name, timeout=timeout_seconds)
        if res:
            _, val = res
            return json.loads(val)
        return None

class RedisRateLimiter:
    """Sliding-window or simple increment rate limiter using Redis."""
    
    @staticmethod
    def is_rate_limited(key: str, limit: int, window_seconds: int) -> bool:
        """
        Checks if a key (e.g. user_id + route) has exceeded the 'limit' within 'window_seconds'.
        Uses a atomic script or pipeline to count/increment.
        """
        try:
            current = redis_client.get(key)
            if current is not None:
                if int(current) >= limit:
                    return True
                redis_client.incr(key)
            else:
                # Key doesn't exist, create it with TTL
                pipe = redis_client.pipeline()
                pipe.set(key, 1, ex=window_seconds)
                pipe.execute()
        except Exception as e:
            # Fail-open in production if Redis is unavailable, or log
            print(f"Redis Rate Limiter Error: {e}")
        return False
