from typing import List, Tuple
from app.models.testcase import TestCase
from app.services.judge0_service import get_judge0_service
from app.services.language_mapper import get_language_id

class Evaluator:
    @staticmethod
    def clean_output(text: str) -> str:
        if not text:
            return ""
        return "\n".join(line.strip() for line in text.strip().splitlines() if line.strip()).strip()

    @classmethod
    def evaluate(cls, code: str, language: str, testcases: List[TestCase]) -> Tuple[str, int, int]:
        judge0 = get_judge0_service()
        language_id = get_language_id(language)
        
        passed = 0
        total = len(testcases)
        
        if total == 0:
            return "Accepted", 0, 0
            
        final_verdict = "Accepted"
        
        for tc in testcases:
            exec_code = code
            stdin_data = tc.input_data
            if language == "sql":
                exec_code = tc.input_data + "\n" + code
                stdin_data = ""
            elif language in ["html", "react"]:
                exec_code = tc.input_data
                stdin_data = code
                
            result = judge0.execute_code(exec_code, language_id, stdin_data)
            status_id = result["status"]["id"]
            
            if status_id == 6:  # Compilation Error
                return "Compilation Error", 0, total
            elif status_id == 5:  # Time Limit Exceeded
                return "Time Limit Exceeded", passed, total
            elif status_id == 15:  # Memory Limit Exceeded
                return "Memory Limit Exceeded", passed, total
            elif status_id in [7, 8, 9, 10, 11, 12, 13, 14]:  # Runtime or Internal Errors
                return "Runtime Error", passed, total
                
            if status_id == 3:
                actual = cls.clean_output(result["stdout"])
                expected = cls.clean_output(tc.expected_output)
                if actual == expected:
                    passed += 1
                else:
                    final_verdict = "Wrong Answer"
            else:
                return "Runtime Error", passed, total

        return final_verdict, passed, total
