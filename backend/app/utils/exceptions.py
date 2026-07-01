from fastapi import HTTPException, status

class CodingPlatformException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(status_code=status_code, detail={"code": code, "message": message})

class InvalidLanguageException(CodingPlatformException):
    def __init__(self, language: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_LANGUAGE",
            message=f"Language '{language}' is not supported. Supported: python, javascript, sql"
        )

class QuestionNotFoundException(CodingPlatformException):
    def __init__(self, question_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="QUESTION_NOT_FOUND",
            message=f"Question with ID {question_id} not found"
        )

class TestCaseNotFoundException(CodingPlatformException):
    def __init__(self, testcase_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="TESTCASE_NOT_FOUND",
            message=f"TestCase with ID {testcase_id} not found"
        )

class SubmissionNotFoundException(CodingPlatformException):
    def __init__(self, submission_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="SUBMISSION_NOT_FOUND",
            message=f"Submission with ID {submission_id} not found"
        )

class Judge0UnavailableException(CodingPlatformException):
    def __init__(self, detail: str = "Judge0 execution service is unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="JUDGE0_UNAVAILABLE",
            message=detail
        )
