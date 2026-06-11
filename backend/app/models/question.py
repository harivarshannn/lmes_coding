from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    statement = Column(Text, nullable=False)
    template_python = Column(Text, nullable=True)
    template_cpp = Column(Text, nullable=True)
    template_java = Column(Text, nullable=True)
    template_javascript = Column(Text, nullable=True)
    template_typescript = Column(Text, nullable=True)
    template_sql = Column(Text, nullable=True)
    template_html = Column(Text, nullable=True)
    template_react = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    testcases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")
