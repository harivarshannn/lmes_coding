from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String, nullable=True)

    # Relationships
    achievements = relationship("Achievement", back_populates="badge", cascade="all, delete-orphan")
