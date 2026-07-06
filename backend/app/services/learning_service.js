const axios = require('axios');
const settings = require('../config/settings');
const UserRepository = require('../repositories/user_repo');
const QuestionRepository = require('../repositories/question_repo');
const db = require('../database/session');

class LearningService {
  static async getRevealStage(userId, questionId) {
    const attemptsCount = await UserRepository.getAttemptCount(userId, questionId);

    if (attemptsCount === 0) {
      return {
        attempts_count: 0,
        stage: 0,
        hint: "Try writing some code and running it first to get your first hint!",
        solution_unlocked: false
      };
    }

    let hintStage = attemptsCount;
    if (hintStage > 3) {
      hintStage = 4;
    }

    const hintsCol = await db.collection('hints');
    const hintDoc = await hintsCol.findOne({ question_id: questionId, attempt_number: hintStage });

    const result = {
      attempts_count: attemptsCount,
      stage: hintStage,
      hint: hintDoc ? hintDoc.hint : null,
      solution_unlocked: attemptsCount >= 4,
      solution: null
    };

    if (!result.hint) {
      if (hintStage === 1) {
        result.hint = "Hint 1: Think about a brute-force approach first.";
      } else if (hintStage === 2) {
        result.hint = "Hint 2: Can you use a hash map or sorted array to optimize it?";
      } else if (hintStage === 3) {
        result.hint = "Hint 3 (Approach): Loop through the input while storing seen values.";
      }
    }

    if (attemptsCount >= 4) {
      const solutionsCol = await db.collection('solutions');
      const solDoc = await solutionsCol.findOne({ question_id: questionId });
      if (solDoc) {
        result.solution = {
          code: solDoc.code,
          explanation: solDoc.explanation,
          complexity: solDoc.complexity
        };
      } else {
        result.solution = {
          code: "# Solution template missing.",
          explanation: "No explanation available.",
          complexity: "O(N)"
        };
      }
    }

    return result;
  }

  static async generateAiFeedback(userId, attemptId) {
    const attemptsCol = await db.collection('user_attempts');
    const attempt = await attemptsCol.findOne({ _id: attemptId });
    if (!attempt) {
      return "Attempt not found.";
    }

    const question = await QuestionRepository.getById(attempt.question_id);

    const payload = {
      code: attempt.submitted_code,
      language: "python",
      problem_title: question ? question.title : "Code Attempt",
      problem_description: question ? question.description : "",
      verdict: attempt.status
    };

    try {
      const response = await axios.post(
        `${settings.resolved_ai_service_url}/ai/feedback`,
        payload,
        { timeout: 5000 }
      );
      if (response.status === 200) {
        return response.data.feedback || "Feedback was empty.";
      }
    } catch (e) {
      console.error(`Failed to fetch AI feedback from AI service: ${e.message}`);
    }

    return `AI Review (Local Fallback) on Attempt #${attemptId}: The logic looks solid. Ensure edge cases like empty arrays and high indices are fully handled.`;
  }
}

module.exports = LearningService;
