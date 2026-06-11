from pydantic import BaseModel

class RunRequest(BaseModel):
    language: str
    code: str
    input: str = ""

class RunResponse(BaseModel):
    status: str
    stdout: str
    stderr: str
    execution_time: str
    memory: int
