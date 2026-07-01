from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.redis import RedisCache
from app.repositories.submission_repo import SubmissionRepository
from app.repositories.question_repo import QuestionRepository
from app.schemas.submission import SubmissionCreate, SubmissionResponse, SubmissionSubmitResponse
from app.services.submission_service import SubmissionService
from app.utils.exceptions import QuestionNotFoundException, SubmissionNotFoundException
from app.utils.rate_limit import RateLimit

router = APIRouter()

@router.post(
    "/submit", 
    response_model=SubmissionSubmitResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimit(limit=5, window_seconds=60))]
)
def submit_code(submission_in: SubmissionCreate, db: Session = Depends(get_db)):
    # 1. Verify question exists
    question_repo = QuestionRepository(db)
    db_question = question_repo.get_by_id(submission_in.question_id)
    if not db_question:
        raise QuestionNotFoundException(submission_in.question_id)
        
    # 2. Enqueue the submission into the Redis Queue
    service = SubmissionService(db)
    db_sub = service.enqueue_submission(
        student_id=submission_in.student_id,
        question_id=submission_in.question_id,
        language_name=submission_in.language,
        code=submission_in.code
    )
    
    # 3. Return response (dynamic depending on whether executed synchronously or queued)
    return SubmissionSubmitResponse(
        submission_id=db_sub.id,
        status=db_sub.status,
        verdict=db_sub.status, # matches client expectation
        passed=db_sub.passed,
        total=db_sub.total
    )

@router.get("/submissions", response_model=List[SubmissionResponse])
def read_submissions(db: Session = Depends(get_db)):
    repo = SubmissionRepository(db)
    return repo.get_all()

@router.get("/submissions/{id}", response_model=SubmissionResponse)
def read_submission(id: int, db: Session = Depends(get_db)):
    repo = SubmissionRepository(db)
    db_submission = repo.get_by_id(id)
    if not db_submission:
        raise SubmissionNotFoundException(id)
    return db_submission

@router.get("/students/{student_id}/submissions", response_model=List[SubmissionResponse])
def read_student_submissions(student_id: int, db: Session = Depends(get_db)):
    repo = SubmissionRepository(db)
    return repo.get_by_student(student_id)
