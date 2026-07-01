from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Dict

class QuestionBase(BaseModel):
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_time: int = 15
    marks: int = 10
    topic_id: int | None = None
    question_type: str = "coding" # coding, web
    memory_limit: int = 128000
    time_limit: float = 2.0
    status: str = "published" # published, unpublished
    statement: str | None = None
    template_python: str | None = None
    template_javascript: str | None = None
    template_html: str | None = None
    template_sql: str | None = None

class QuestionCreate(QuestionBase):
    starter_codes: Dict[str, str] | None = None # e.g. {"python": "...", "javascript": "..."}
    tags: List[str] | None = None

class QuestionUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    difficulty: str | None = None
    estimated_time: int | None = None
    marks: int | None = None
    topic_id: int | None = None
    question_type: str | None = None
    memory_limit: int | None = None
    time_limit: float | None = None
    status: str | None = None
    starter_codes: Dict[str, str] | None = None
    tags: List[str] | None = None

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
