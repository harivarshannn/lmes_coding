from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SubmissionBase(BaseModel):
    student_id: int
    question_id: int
    language: str
    code: str

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(SubmissionBase):
    id: int
    verdict: str
    passed: int
    total: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubmissionSubmitResponse(BaseModel):
    verdict: str
    passed: int
    total: int
