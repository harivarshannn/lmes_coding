from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SubmissionBase(BaseModel):
    student_id: int
    question_id: int
    language: str
    code: str

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionResponse(BaseModel):
    id: int
    judge0_token: str | None = None
    student_id: int
    question_id: int
    code: str
    status: str
    passed: int
    total: int
    stdout: str | None = None
    stderr: str | None = None
    compile_output: str | None = None
    execution_time: float | None = None
    memory: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubmissionSubmitResponse(BaseModel):
    submission_id: int
    status: str
    verdict: str
    passed: int
    total: int
