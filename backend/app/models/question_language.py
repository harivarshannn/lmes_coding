from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class QuestionLanguage(Base):
    __tablename__ = "question_languages"

    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), primary_key=True)
    starter_code = Column(Text, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="question_languages")
    language = relationship("Language", back_populates="question_languages")
