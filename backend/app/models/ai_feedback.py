from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AIFeedback(Base):
    __tablename__ = "ai_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_attempt_id = Column(Integer, ForeignKey("user_attempts.id", ondelete="CASCADE"), nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user_attempt = relationship("UserAttempt", back_populates="ai_feedbacks")
