from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class UserAttempt(Base):
    __tablename__ = "user_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False) # e.g. Accepted, Wrong Answer
    runtime = Column(Float, nullable=True) # execution time in seconds
    memory = Column(Integer, nullable=True) # memory usage in KB
    attempt_number = Column(Integer, nullable=False) # 1st, 2nd, etc.
    submitted_code = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="user_attempts")
    language = relationship("Language", back_populates="user_attempts")
    ai_feedbacks = relationship("AIFeedback", back_populates="user_attempt", cascade="all, delete-orphan")
