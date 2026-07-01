from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.redis import RedisCache
from app.repositories.user_repo import UserRepository

router = APIRouter()

@router.get("/leaderboard", status_code=status.HTTP_200_OK)
def get_leaderboard(db: Session = Depends(get_db)):
    cache_key = "leaderboard:top50"
    
    # Try reading from cache
    cached = RedisCache.get(cache_key)
    if cached is not None:
        return cached

    repo = UserRepository(db)
    leaders = repo.get_leaderboard(limit=50)
    
    # Serialize results
    serialized = []
    for l in leaders:
        serialized.append({
            "user_id": l.user_id,
            "username": l.username,
            "xp": l.xp,
            "rank": l.rank
        })
        
    # Cache for 60 seconds (leaderboard updates are active but cached)
    RedisCache.set(cache_key, serialized, expire_seconds=60)
    
    return leaders
