import time
import requests
import os
from app.config.settings import settings
from app.utils.exceptions import Judge0UnavailableException

class Judge0Service:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')

    def submit_code(self, source_code: str, language_id: int, stdin: str = "") -> str:
        url = f"{self.base_url}/submissions?base64_encoded=false"
        payload = {
            "source_code": source_code,
            "language_id": language_id,
            "stdin": stdin
        }
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()["token"]
        except Exception as e:
            raise Judge0UnavailableException(f"Failed to submit code to Judge0: {str(e)}")

    def get_submission_result(self, token: str) -> dict:
        url = f"{self.base_url}/submissions/{token}?base64_encoded=false"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            return {
                "stdout": data.get("stdout") or "",
                "stderr": data.get("stderr") or "",
                "compile_output": data.get("compile_output") or "",
                "status": data.get("status") or {"id": 13, "description": "Internal Error"},
                "time": data.get("time") or "0.0",
                "memory": data.get("memory") or 0
            }
        except Exception as e:
            raise Judge0UnavailableException(f"Failed to get submission result from Judge0: {str(e)}")

    def execute_code(self, source_code: str, language_id: int, stdin: str = "") -> dict:
        token = self.submit_code(source_code, language_id, stdin)
        # Poll until finished
        max_attempts = 20
        for _ in range(max_attempts):
            result = self.get_submission_result(token)
            status_id = result["status"]["id"]
            if status_id not in [1, 2]: # 1: In Queue, 2: Processing
                return result
            time.sleep(0.5)
        
        return {
            "stdout": "",
            "stderr": "Execution timed out",
            "compile_output": "",
            "status": {"id": 5, "description": "Time Limit Exceeded"},
            "time": "0.0",
            "memory": 0
        }

class MockJudge0Service:
    def submit_code(self, source_code: str, language_id: int, stdin: str = "") -> str:
        return "mock-token-12345"

    def get_submission_result(self, token: str) -> dict:
        return {
            "stdout": "hello\n" if "hello" in token else "mock output\n",
            "stderr": "",
            "compile_output": "",
            "status": {"id": 3, "description": "Accepted"},
            "time": "0.01",
            "memory": 10240
        }

    def execute_code(self, source_code: str, language_id: int, stdin: str = "") -> dict:
        # Simple simulation based on source code content
        if "print('hello')" in source_code or 'print("hello")' in source_code:
            stdout = "hello\n"
        elif "print('Hello World')" in source_code or 'print("Hello World")' in source_code:
            stdout = "Hello World\n"
        else:
            stdout = "mock output\n"
            
        return {
            "stdout": stdout,
            "stderr": "",
            "compile_output": "",
            "status": {"id": 3, "description": "Accepted"},
            "time": "0.01",
            "memory": 10240
        }

def get_judge0_service():
    # If JUDGE0_URL environment variable is missing or empty, fallback to Mock
    env_url = os.getenv("JUDGE0_URL")
    if not env_url:
        return MockJudge0Service()
    return Judge0Service(settings.resolved_judge0_url)
