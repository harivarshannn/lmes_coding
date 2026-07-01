from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TestCaseBase(BaseModel):
    input: str # Renamed from input_data to input
    expected_output: str
    is_hidden: bool = False

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int
    question_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
