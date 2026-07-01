from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from app.utils.rate_limit import RateLimit

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# Rate limit: max 5 login attempts per 60 seconds per IP
@router.post(
    "/login", 
    status_code=status.HTTP_200_OK, 
    dependencies=[Depends(RateLimit(limit=5, window_seconds=60))]
)
def login(req: LoginRequest):
    # Standard dummy authenticate for practice platform
    if req.username == "admin" and req.password == "admin123":
        return {
            "status": "success",
            "token": "mock-admin-token-12345",
            "role": "admin",
            "username": req.username
        }
    elif req.username == "student" and req.password == "student123":
        return {
            "status": "success",
            "token": "mock-student-token-54321",
            "role": "student",
            "username": req.username
        }
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Hint: Use admin/admin123 or student/student123"
    )
