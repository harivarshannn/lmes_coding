from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.submission import Submission

class SubmissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, sub_id: int) -> Optional[Submission]:
        return self.db.query(Submission).filter(Submission.id == sub_id).first()

    def get_by_token(self, token: str) -> Optional[Submission]:
        return self.db.query(Submission).filter(Submission.judge0_token == token).first()

    def get_all(self) -> List[Submission]:
        return self.db.query(Submission).order_by(Submission.created_at.desc()).all()

    def get_by_student(self, student_id: int) -> List[Submission]:
        return self.db.query(Submission).filter(Submission.student_id == student_id).order_by(Submission.created_at.desc()).all()

    def get_by_question(self, question_id: int) -> List[Submission]:
        return self.db.query(Submission).filter(Submission.question_id == question_id).order_by(Submission.created_at.desc()).all()

    def create(self, submission: Submission) -> Submission:
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def update(self) -> None:
        self.db.commit()
