const BugfixRepository = require('./bugfix.repo');
const Evaluator = require('../../services/evaluator');

class BugfixService {
  static async getChallengeForStudent(challengeId) {
    const challenge = await BugfixRepository.getChallengeById(challengeId);
    if (!challenge) return null;

    // Return challenge WITHOUT correct_code (student shouldn't see the answer)
    return {
      id: challenge.id,
      title: challenge.title,
      slug: challenge.slug,
      description: challenge.description,
      difficulty: challenge.difficulty,
      language: challenge.language,
      buggy_code: challenge.buggy_code,
      hints: challenge.hints,
      max_attempts: challenge.max_attempts,
      xp_reward: challenge.xp_reward,
      test_cases_count: challenge.test_cases.length
    };
  }

  static async submitFix(userId, challengeId, fixedCode) {
    const challenge = await BugfixRepository.getChallengeById(challengeId);
    if (!challenge) return { error: 'Challenge not found' };

    // Check attempt limit
    const attemptCount = await BugfixRepository.getAttemptCount(userId, challengeId);
    if (attemptCount >= challenge.max_attempts) {
      return { error: `Maximum attempts (${challenge.max_attempts}) exceeded` };
    }

    // Run the fixed code against test cases using Judge0
    let verdict = 'Wrong Answer';
    let passed = 0;
    let total = challenge.test_cases.length;

    if (total > 0) {
      try {
        [verdict, passed, total] = await Evaluator.evaluate(
          fixedCode,
          challenge.language,
          challenge.test_cases
        );
      } catch (e) {
        console.error(`Bug fix evaluation error for challenge ${challengeId}:`, e.message);
        verdict = 'Runtime Error';
      }
    } else {
      // No test cases — just check if code matches (simple diff)
      const cleanFixed = fixedCode.trim();
      const cleanCorrect = challenge.correct_code.trim();
      if (cleanFixed === cleanCorrect) {
        verdict = 'Accepted';
        passed = 1;
        total = 1;
      }
    }

    const attempt = await BugfixRepository.createAttempt({
      user_id: userId,
      challenge_id: challengeId,
      submitted_code: fixedCode,
      passed_tests: passed,
      total_tests: total,
      status: verdict
    });

    // Provide progressive hints based on attempt number
    let hint = null;
    if (verdict !== 'Accepted' && attempt.attempt_number <= challenge.hints.length) {
      hint = challenge.hints[attempt.attempt_number - 1];
    }

    return {
      attempt_id: attempt.id,
      status: verdict,
      passed_tests: passed,
      total_tests: total,
      attempt_number: attempt.attempt_number,
      remaining_attempts: challenge.max_attempts - attempt.attempt_number,
      hint: hint,
      is_accepted: verdict === 'Accepted'
    };
  }

  static async getAttemptResult(attemptId) {
    const attempt = await BugfixRepository.getAttemptById(attemptId);
    if (!attempt) return null;

    const challenge = await BugfixRepository.getChallengeById(attempt.challenge_id);
    return {
      attempt_id: attempt.id,
      challenge_id: attempt.challenge_id,
      challenge_title: challenge ? challenge.title : 'Unknown',
      status: attempt.status,
      passed_tests: attempt.passed_tests,
      total_tests: attempt.total_tests,
      attempt_number: attempt.attempt_number,
      submitted_at: attempt.submitted_at
    };
  }
}

module.exports = BugfixService;
