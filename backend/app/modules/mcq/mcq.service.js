const McqRepository = require('./mcq.repo');

class McqService {
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static async startAttempt(userId, quizId) {
    const quiz = await McqRepository.getQuizById(quizId);
    if (!quiz) return null;

    const attempt = await McqRepository.createAttempt({
      user_id: userId,
      quiz_id: quizId,
      total_marks: quiz.total_marks,
      status: 'In Progress'
    });

    // Get questions with shuffled options (but don't expose correct_answer)
    const questions = await McqRepository.getQuestionsByQuiz(quizId);
    const sanitized = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      options: this.shuffleArray(q.options),
      marks: q.marks,
      order: q.order
    }));

    return {
      attempt_id: attempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        time_limit_minutes: quiz.time_limit_minutes,
        total_marks: quiz.total_marks
      },
      questions: sanitized
    };
  }

  static async submitAttempt(attemptId, answers, timeTakenSeconds) {
    const attempt = await McqRepository.getAttemptById(attemptId);
    if (!attempt) return null;
    if (attempt.status !== 'In Progress') return attempt;

    const questions = await McqRepository.getQuestionsByQuiz(attempt.quiz_id);
    let score = 0;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    for (const q of questions) {
      const userAnswer = answers[String(q.id)];
      if (userAnswer && userAnswer === q.correct_answer) {
        score += q.marks || 1;
      }
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 100) / 100 : 0;

    // Check if timed out
    const quiz = await McqRepository.getQuizById(attempt.quiz_id);
    const timeLimitSeconds = (quiz?.time_limit_minutes || 30) * 60;
    const status = timeTakenSeconds > timeLimitSeconds ? 'Timed Out' : 'Completed';

    const updated = await McqRepository.updateAttempt(attemptId, {
      answers: answers,
      score: score,
      total_marks: totalMarks,
      percentage: percentage,
      time_taken_seconds: timeTakenSeconds,
      status: status,
      submitted_at: new Date()
    });

    return updated;
  }

  static async getResult(attemptId) {
    const attempt = await McqRepository.getAttemptById(attemptId);
    if (!attempt) return null;
    if (attempt.status === 'In Progress') {
      return { message: 'Attempt is still in progress', status: attempt.status };
    }

    const questions = await McqRepository.getQuestionsByQuiz(attempt.quiz_id);
    const details = questions.map(q => {
      const userAnswer = attempt.answers[String(q.id)] || null;
      return {
        question_id: q.id,
        question_text: q.question_text,
        user_answer: userAnswer,
        correct_answer: q.correct_answer,
        is_correct: userAnswer === q.correct_answer,
        explanation: q.explanation,
        marks: q.marks
      };
    });

    return {
      attempt_id: attempt.id,
      quiz_id: attempt.quiz_id,
      score: attempt.score,
      total_marks: attempt.total_marks,
      percentage: attempt.percentage,
      time_taken_seconds: attempt.time_taken_seconds,
      status: attempt.status,
      details: details
    };
  }
}

module.exports = McqService;
