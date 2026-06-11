from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.question import Question
from app.models.testcase import TestCase
from app.schemas.testcase import TestCaseCreate, TestCaseResponse
from app.utils.exceptions import QuestionNotFoundException, TestCaseNotFoundException

router = APIRouter()

@router.post("/questions/{id}/testcases", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
def create_testcase(id: int, testcase_in: TestCaseCreate, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == id).first()
    if not db_question:
        raise QuestionNotFoundException(id)
        
    db_testcase = TestCase(
        question_id=id,
        input_data=testcase_in.input_data,
        expected_output=testcase_in.expected_output,
        is_hidden=testcase_in.is_hidden
    )
    db.add(db_testcase)
    db.commit()
    db.refresh(db_testcase)
    return db_testcase

@router.get("/questions/{id}/testcases", response_model=List[TestCaseResponse])
def read_testcases(id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == id).first()
    if not db_question:
        raise QuestionNotFoundException(id)
    return db.query(TestCase).filter(TestCase.question_id == id).all()

@router.delete("/testcases/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testcase(id: int, db: Session = Depends(get_db)):
    db_testcase = db.query(TestCase).filter(TestCase.id == id).first()
    if not db_testcase:
        raise TestCaseNotFoundException(id)
    db.delete(db_testcase)
    db.commit()
    return None
