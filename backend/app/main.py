from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import app.database.base
from app.routes import health, questions, testcases, run, submissions, auth, learning, leaderboard
from app.utils.exceptions import CodingPlatformException
from app.services.submission_service import start_background_worker
import os

app = FastAPI(
    title="AI-Powered Coding Practice Platform",
    description="FastAPI backend with Redis Queues, Caching, and client-side sandboxed validation",
    version="2.0.0"
)

# Custom exception handler for CodingPlatformException
@app.exception_handler(CodingPlatformException)
async def coding_platform_exception_handler(request: Request, exc: CodingPlatformException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": exc.errors()[0]["msg"] if exc.errors() else "Validation failed"
            }
        }
    )

# Global fallback exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            }
        }
    )

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(questions.router, tags=["Questions"])
app.include_router(testcases.router, tags=["Test Cases"])
app.include_router(run.router, tags=["Run Code"])
app.include_router(submissions.router, tags=["Submissions"])
app.include_router(learning.router, tags=["AI Learning System"])
app.include_router(leaderboard.router, tags=["Leaderboard"])

# Mount static files for the premium Web IDE frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def serve_frontend():
    # Serves the separate premium single page frontend
    return FileResponse("static/index.html")

# Initialize background submission queue worker on app startup
@app.on_event("startup")
def startup_event():
    start_background_worker()
