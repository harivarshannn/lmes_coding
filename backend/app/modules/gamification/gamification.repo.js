const UserRepository = require('../../repositories/user_repo');

class GamificationRepository {
  static getOrCreateStreak(userId) { return UserRepository.getOrCreateStreak(userId); }
  static updateStreak(userId) { return UserRepository.updateStreak(userId); }
  static getOrCreateProfile(userId, username) { return UserRepository.getOrCreateProfile(userId, username); }
  static addXp(userId, xpAmount) { return UserRepository.addXp(userId, xpAmount); }
  static recalculateRanks() { return UserRepository.recalculateRanks(); }
  static getLeaderboard(limit) { return UserRepository.getLeaderboard(limit); }
  static recordAttempt(userId, questionId, languageId, status, runtime, memory, submittedCode) {
    return UserRepository.recordAttempt(userId, questionId, languageId, status, runtime, memory, submittedCode);
  }
  static getAttempts(userId, questionId) { return UserRepository.getAttempts(userId, questionId); }
  static getAttemptCount(userId, questionId) { return UserRepository.getAttemptCount(userId, questionId); }
  static markProgress(userId, questionId, status) { return UserRepository.markProgress(userId, questionId, status); }
  static toggleBookmark(userId, questionId) { return UserRepository.toggleBookmark(userId, questionId); }
  static toggleFavorite(userId, questionId) { return UserRepository.toggleFavorite(userId, questionId); }
  static awardBadgeIfEarned(userId, badgeName) { return UserRepository.awardBadgeIfEarned(userId, badgeName); }
  static getUserAchievements(userId) { return UserRepository.getUserAchievements(userId); }
}

module.exports = GamificationRepository;
