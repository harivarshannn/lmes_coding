from sqlalchemy import Column, Integer, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Solution(Base):
    __tablename__ = "solutions"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    complexity = Column(String(50), nullable=True) # e.g. "O(N)" or "O(1)"

    # Relationships
    question = relationship("Question", back_populates="solutions")
    language = relationship("Language", back_populates="solutions")
