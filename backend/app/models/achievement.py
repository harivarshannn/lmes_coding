from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    badge = relationship("Badge", back_populates="achievements")

    __table_args__ = (UniqueConstraint('user_id', 'badge_id', name='_user_badge_achievement_uc'),)
