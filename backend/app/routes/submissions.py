from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.question import Question
from app.models.submission import Submission
from app.models.testcase import TestCase
from app.schemas.submission import SubmissionCreate, SubmissionResponse, SubmissionSubmitResponse
from app.services.evaluator import Evaluator
from app.utils.exceptions import QuestionNotFoundException, SubmissionNotFoundException

router = APIRouter()

@router.post("/submit", response_model=SubmissionSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_code(submission_in: SubmissionCreate, db: Session = Depends(get_db)):
    # 1. Fetch question
    db_question = db.query(Question).filter(Question.id == submission_in.question_id).first()
    if not db_question:
        raise QuestionNotFoundException(submission_in.question_id)
        
    # 2. Fetch all test cases for this question
    testcases = db.query(TestCase).filter(TestCase.question_id == submission_in.question_id).all()
    
    # 3. Evaluate code
    verdict, passed, total = Evaluator.evaluate(
        code=submission_in.code,
        language=submission_in.language,
        testcases=testcases
    )
    
    # 4. Persist submission
    db_submission = Submission(
        student_id=submission_in.student_id,
        question_id=submission_in.question_id,
        language=submission_in.language,
        code=submission_in.code,
        verdict=verdict,
        passed=passed,
        total=total
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return SubmissionSubmitResponse(
        verdict=verdict,
        passed=passed,
        total=total
    )

@router.get("/submissions", response_model=List[SubmissionResponse])
def read_submissions(db: Session = Depends(get_db)):
    return db.query(Submission).all()

@router.get("/submissions/{id}", response_model=SubmissionResponse)
def read_submission(id: int, db: Session = Depends(get_db)):
    db_submission = db.query(Submission).filter(Submission.id == id).first()
    if not db_submission:
        raise SubmissionNotFoundException(id)
    return db_submission

@router.get("/students/{student_id}/submissions", response_model=List[SubmissionResponse])
def read_student_submissions(student_id: int, db: Session = Depends(get_db)):
    return db.query(Submission).filter(Submission.student_id == student_id).all()
