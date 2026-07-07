const QuestionRepository = require('../../repositories/question_repo');
const SubmissionRepository = require('../../repositories/submission_repo');
const TestCaseRepository = require('../../repositories/testcase_repo');

class CodingRepository {
  static getQuestionById(id) { return QuestionRepository.getById(id); }
  static getQuestionBySlug(slug) { return QuestionRepository.getBySlug(slug); }
  static getAllQuestions(status) { return QuestionRepository.getAll(status); }
  static createQuestion(q) { return QuestionRepository.create(q); }
  static updateQuestion(id, q) { return QuestionRepository.update(id, q); }
  static deleteQuestion(id) { return QuestionRepository.delete(id); }
  static addQuestionLanguageTemplate(questionId, languageId, starterCode) { return QuestionRepository.addLanguageTemplate(questionId, languageId, starterCode); }
  static addQuestionTag(questionId, tagName) { return QuestionRepository.addTag(questionId, tagName); }
  static clearQuestionTags(questionId) { return QuestionRepository.clearTags(questionId); }

  static getSubmissionById(id) { return SubmissionRepository.getById(id); }
  static getSubmissionByToken(token) { return SubmissionRepository.getByToken(token); }
  static getAllSubmissions() { return SubmissionRepository.getAll(); }
  static getSubmissionsByStudent(studentId) { return SubmissionRepository.getByStudent(studentId); }
  static getSubmissionsByQuestion(questionId) { return SubmissionRepository.getByQuestion(questionId); }
  static createSubmission(s) { return SubmissionRepository.create(s); }
  static updateSubmission(id, s) { return SubmissionRepository.update(id, s); }

  static getTestCaseById(id) { return TestCaseRepository.getById(id); }
  static getTestCasesByQuestion(questionId) { return TestCaseRepository.getByQuestion(questionId); }
  static createTestCase(tc) { return TestCaseRepository.create(tc); }
  static deleteTestCase(id) { return TestCaseRepository.delete(id); }
}

module.exports = CodingRepository;
