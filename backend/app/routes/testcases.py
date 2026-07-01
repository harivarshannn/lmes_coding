from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.repositories.testcase_repo import TestCaseRepository
from app.repositories.question_repo import QuestionRepository
from app.models.testcase import TestCase
from app.schemas.testcase import TestCaseCreate, TestCaseResponse
from app.utils.exceptions import QuestionNotFoundException, TestCaseNotFoundException

router = APIRouter()

@router.post("/questions/{id}/testcases", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_testcase(id: int, testcase_in: TestCaseCreate, db: Session = Depends(get_db)):
    question_repo = QuestionRepository(db)
    tc_repo = TestCaseRepository(db)
    
    db_question = question_repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)
        
    db_testcase = TestCase(
        question_id=id,
        input=testcase_in.input,
        expected_output=testcase_in.expected_output,
        is_hidden=testcase_in.is_hidden
    )
    tc_repo.create(db_testcase)
    return db_testcase

@router.get("/questions/{id}/testcases", response_model=List[TestCaseResponse])
def read_testcases(id: int, db: Session = Depends(get_db)):
    question_repo = QuestionRepository(db)
    tc_repo = TestCaseRepository(db)
    
    db_question = question_repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)
        
    return tc_repo.get_by_question(id)

@router.delete("/testcases/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testcase(id: int, db: Session = Depends(get_db)):
    tc_repo = TestCaseRepository(db)
    
    db_testcase = tc_repo.get_by_id(id)
    if not db_testcase:
        raise TestCaseNotFoundException(id)
        
    tc_repo.delete(db_testcase)
    return None
