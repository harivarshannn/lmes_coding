from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int
    question_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
