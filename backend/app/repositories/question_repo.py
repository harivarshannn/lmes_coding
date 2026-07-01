from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.question import Question
from app.models.question_language import QuestionLanguage
from app.models.question_tag import QuestionTag
from app.models.tag import Tag

class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, question_id: int) -> Optional[Question]:
        return self.db.query(Question).filter(Question.id == question_id).first()

    def get_by_slug(self, slug: str) -> Optional[Question]:
        return self.db.query(Question).filter(Question.slug == slug).first()

    def get_all(self, status: Optional[str] = None) -> List[Question]:
        query = self.db.query(Question)
        if status:
            query = query.filter(Question.status == status)
        return query.order_by(Question.id).all()

    def create(self, question: Question) -> Question:
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def update(self) -> None:
        self.db.commit()

    def delete(self, question: Question) -> None:
        self.db.delete(question)
        self.db.commit()

    def add_language_template(self, question_id: int, language_id: int, starter_code: str) -> QuestionLanguage:
        ql = self.db.query(QuestionLanguage).filter_by(question_id=question_id, language_id=language_id).first()
        if ql:
            ql.starter_code = starter_code
        else:
            ql = QuestionLanguage(question_id=question_id, language_id=language_id, starter_code=starter_code)
            self.db.add(ql)
        self.db.commit()
        return ql

    def add_tag(self, question_id: int, tag_name: str) -> None:
        tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            self.db.add(tag)
            self.db.commit()
            self.db.refresh(tag)
            
        qt = self.db.query(QuestionTag).filter_by(question_id=question_id, tag_id=tag.id).first()
        if not qt:
            qt = QuestionTag(question_id=question_id, tag_id=tag.id)
            self.db.add(qt)
            self.db.commit()
