from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    estimated_time = Column(Integer, default=15, nullable=False) # Estimated time in minutes
    marks = Column(Integer, default=10, nullable=False) # Reward score / XP
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    question_type = Column(String, default="coding", nullable=False) # coding, web
    memory_limit = Column(Integer, default=128000, nullable=False) # in KB (Judge0)
    time_limit = Column(Float, default=2.0, nullable=False) # in seconds (Judge0)
    status = Column(String, default="published", nullable=False) # published, unpublished
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    topic = relationship("Topic", back_populates="questions")
    testcases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")
    question_languages = relationship("QuestionLanguage", back_populates="question", cascade="all, delete-orphan")
    question_tags = relationship("QuestionTag", back_populates="question", cascade="all, delete-orphan")
    hints = relationship("Hint", back_populates="question", cascade="all, delete-orphan")
    solutions = relationship("Solution", back_populates="question", cascade="all, delete-orphan")
    user_attempts = relationship("UserAttempt", back_populates="question", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="question", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="question", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="question", cascade="all, delete-orphan")

    # Legacy compatibility property
    @property
    def statement(self) -> str:
        return self.description

    @statement.setter
    def statement(self, value: str):
        self.description = value

    @property
    def template_python(self) -> str:
        for ql in self.question_languages:
            if ql.language and ql.language.name.lower() == "python":
                return ql.starter_code
        return ""

    @property
    def template_javascript(self) -> str:
        for ql in self.question_languages:
            if ql.language and ql.language.name.lower() == "javascript":
                return ql.starter_code
        return ""

    @property
    def template_html(self) -> str:
        for ql in self.question_languages:
            if ql.language and ql.language.name.lower() == "plain text":
                return ql.starter_code
        return ""

    @property
    def template_sql(self) -> str:
        for ql in self.question_languages:
            if ql.language and ql.language.name.lower() == "sql":
                return ql.starter_code
        return ""
