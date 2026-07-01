from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    judge0_token = Column(String, index=True, nullable=True) # Judge0 token
    student_id = Column(Integer, index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="SET NULL"), nullable=True)
    code = Column(Text, nullable=False)
    status = Column(String, nullable=False) # e.g. Accepted, Processing, Wrong Answer
    passed = Column(Integer, default=0, nullable=False)
    total = Column(Integer, default=0, nullable=False)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    compile_output = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True) # execution time in seconds
    memory = Column(Integer, nullable=True) # memory usage in KB
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="submissions")
