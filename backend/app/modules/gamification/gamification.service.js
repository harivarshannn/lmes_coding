const LearningService = require('../../services/learning_service');

class GamificationService {
  static getRevealStage(userId, questionId) {
    return LearningService.getRevealStage(userId, questionId);
  }

  static generateAiFeedback(userId, attemptId) {
    return LearningService.generateAiFeedback(userId, attemptId);
  }
}

module.exports = GamificationService;
