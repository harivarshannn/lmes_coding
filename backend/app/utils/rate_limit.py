from fastapi import Request, HTTPException, status
from app.database.redis import RedisRateLimiter

class RateLimit:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds

    async def __call__(self, request: Request):
        # Identify the client by IP or user (e.g. from headers)
        ip = request.client.host if request.client else "unknown-ip"
        path = request.url.path
        
        # Simple unique key per client and route
        key = f"ratelimit:{ip}:{path}"
        
        if RedisRateLimiter.is_rate_limited(key, self.limit, self.window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
