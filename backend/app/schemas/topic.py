from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TopicBase(BaseModel):
    name: str
    description: str | None = None

class TopicCreate(TopicBase):
    pass

class TopicResponse(TopicBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
