const { SubmissionService } = require('../../services/submission_service');
const Evaluator = require('../../services/evaluator');

class CodingService {
  static enqueueSubmission(studentId, questionId, languageName, code) {
    return SubmissionService.enqueueSubmission(studentId, questionId, languageName, code);
  }

  static processSubmission(submissionId) {
    return SubmissionService.processSubmission(submissionId);
  }

  static evaluate(code, language, testcases) {
    return Evaluator.evaluate(code, language, testcases);
  }
}

module.exports = CodingService;
