from sqlalchemy import Column, Integer, Date, ForeignKey
from app.database.session import Base

class DailyStreak(Base):
    __tablename__ = "daily_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(Date, nullable=True)
