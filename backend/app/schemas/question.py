from datetime import datetime
from pydantic import BaseModel, ConfigDict

class QuestionBase(BaseModel):
    title: str
    difficulty: str
    statement: str
    template_python: str | None = None
    template_cpp: str | None = None
    template_java: str | None = None
    template_javascript: str | None = None
    template_typescript: str | None = None
    template_sql: str | None = None
    template_html: str | None = None
    template_react: str | None = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
