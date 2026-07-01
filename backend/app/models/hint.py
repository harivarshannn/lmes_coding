from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Hint(Base):
    __tablename__ = "hints"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    attempt_number = Column(Integer, nullable=False) # 1, 2, 3, etc.
    hint = Column(Text, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="hints")
