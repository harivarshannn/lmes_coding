class CodingPlatformException extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class InvalidLanguageException extends CodingPlatformException {
  constructor(language) {
    super(400, 'INVALID_LANGUAGE', `Language '${language}' is not supported. Supported: python, javascript, sql`);
  }
}

class QuestionNotFoundException extends CodingPlatformException {
  constructor(questionId) {
    super(404, 'QUESTION_NOT_FOUND', `Question with ID ${questionId} not found`);
  }
}

class TestCaseNotFoundException extends CodingPlatformException {
  constructor(testcaseId) {
    super(404, 'TESTCASE_NOT_FOUND', `TestCase with ID ${testcaseId} not found`);
  }
}

class SubmissionNotFoundException extends CodingPlatformException {
  constructor(submissionId) {
    super(404, 'SUBMISSION_NOT_FOUND', `Submission with ID ${submissionId} not found`);
  }
}

class Judge0UnavailableException extends CodingPlatformException {
  constructor(detail = 'Judge0 execution service is unavailable') {
    super(503, 'JUDGE0_UNAVAILABLE', detail);
  }
}

// New module exceptions
class QuizNotFoundException extends CodingPlatformException {
  constructor(quizId) {
    super(404, 'QUIZ_NOT_FOUND', `Quiz with ID ${quizId} not found`);
  }
}

class AssignmentNotFoundException extends CodingPlatformException {
  constructor(assignmentId) {
    super(404, 'ASSIGNMENT_NOT_FOUND', `Assignment with ID ${assignmentId} not found`);
  }
}

class BugfixChallengeNotFoundException extends CodingPlatformException {
  constructor(challengeId) {
    super(404, 'BUGFIX_CHALLENGE_NOT_FOUND', `Bug fix challenge with ID ${challengeId} not found`);
  }
}

class DeadlinePassedException extends CodingPlatformException {
  constructor(assignmentId) {
    super(400, 'DEADLINE_PASSED', `Deadline for assignment ${assignmentId} has passed`);
  }
}

class AttemptLimitExceededException extends CodingPlatformException {
  constructor(maxAttempts) {
    super(400, 'ATTEMPT_LIMIT_EXCEEDED', `Maximum attempts (${maxAttempts}) exceeded`);
  }
}

module.exports = {
  CodingPlatformException,
  InvalidLanguageException,
  QuestionNotFoundException,
  TestCaseNotFoundException,
  SubmissionNotFoundException,
  Judge0UnavailableException,
  QuizNotFoundException,
  AssignmentNotFoundException,
  BugfixChallengeNotFoundException,
  DeadlinePassedException,
  AttemptLimitExceededException
};
