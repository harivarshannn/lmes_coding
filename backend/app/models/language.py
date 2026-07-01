from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.session import Base

class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    judge0_language_id = Column(Integer, nullable=False, unique=True)

    # Relationships
    question_languages = relationship("QuestionLanguage", back_populates="language", cascade="all, delete-orphan")
    solutions = relationship("Solution", back_populates="language", cascade="all, delete-orphan")
    user_attempts = relationship("UserAttempt", back_populates="language")
