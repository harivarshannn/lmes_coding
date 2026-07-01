from sqlalchemy import Column, Integer, String
from app.database.session import Base

class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String(50), nullable=False)
    xp = Column(Integer, default=0, nullable=False, index=True)
    rank = Column(Integer, default=0, nullable=False)
