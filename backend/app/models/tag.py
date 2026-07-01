from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.session import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)

    # Relationships
    question_tags = relationship("QuestionTag", back_populates="tag", cascade="all, delete-orphan")
