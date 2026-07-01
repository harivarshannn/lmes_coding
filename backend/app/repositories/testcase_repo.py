from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.testcase import TestCase

class TestCaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tc_id: int) -> Optional[TestCase]:
        return self.db.query(TestCase).filter(TestCase.id == tc_id).first()

    def get_by_question(self, question_id: int) -> List[TestCase]:
        return self.db.query(TestCase).filter(TestCase.question_id == question_id).all()

    def create(self, testcase: TestCase) -> TestCase:
        self.db.add(testcase)
        self.db.commit()
        self.db.refresh(testcase)
        return testcase

    def delete(self, testcase: TestCase) -> None:
        self.db.delete(testcase)
        self.db.commit()
        
    def save(self) -> None:
        self.db.commit()
