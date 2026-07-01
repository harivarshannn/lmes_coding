from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class QuestionTag(Base):
    __tablename__ = "question_tags"

    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    question = relationship("Question", back_populates="question_tags")
    tag = relationship("Tag", back_populates="question_tags")
