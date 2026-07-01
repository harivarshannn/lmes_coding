from app.services.evaluator import Evaluator
from app.models.testcase import TestCase

def test_clean_output():
    assert Evaluator.clean_output("hello\r\nworld\r\n") == "hello\nworld"
    assert Evaluator.clean_output("   hello   \n   world   ") == "hello\nworld"
    assert Evaluator.clean_output("\n\nhello\n\n\nworld\n\n") == "hello\nworld"
    assert Evaluator.clean_output(None) == ""

def test_evaluator_compilation_error(monkeypatch):
    class MockService:
        def execute_code(self, code, language_id, stdin):
            return {
                "status": {"id": 6, "description": "Compilation Error"},
                "stdout": "",
                "stderr": "error",
                "compile_output": "error",
                "time": "0.0",
                "memory": 0
            }
    
    monkeypatch.setattr("app.services.evaluator.get_judge0_service", lambda: MockService())
    
    tc = TestCase(input="1 2", expected_output="3") # Renamed to input
    verdict, passed, total = Evaluator.evaluate("invalid code", "python", [tc])
    assert verdict == "Compilation Error"
    assert passed == 0
    assert total == 1

def test_evaluator_time_limit_exceeded(monkeypatch):
    class MockService:
        def execute_code(self, code, language_id, stdin):
            return {
                "status": {"id": 5, "description": "Time Limit Exceeded"},
                "stdout": "",
                "stderr": "",
                "compile_output": "",
                "time": "1.0",
                "memory": 1000
            }
    
    monkeypatch.setattr("app.services.evaluator.get_judge0_service", lambda: MockService())
    
    tc = TestCase(input="1 2", expected_output="3") # Renamed to input
    verdict, passed, total = Evaluator.evaluate("while True: pass", "python", [tc])
    assert verdict == "Time Limit Exceeded"
    assert passed == 0
    assert total == 1
