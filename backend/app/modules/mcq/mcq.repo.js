const db = require('../../database/session');

class McqRepository {
  // Quiz CRUD
  static async createQuiz(quiz) {
    const col = await db.collection('mcq_quizzes');
    const id = await db.getNextSequenceValue('mcq_quiz_id');
    const doc = {
      _id: id, id: id,
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description || '',
      topic_id: quiz.topic_id || null,
      difficulty: quiz.difficulty || 'Easy',
      time_limit_minutes: quiz.time_limit_minutes || 30,
      total_marks: quiz.total_marks || 0,
      is_active: quiz.is_active !== false,
      created_by: quiz.created_by || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getQuizById(id) {
    const col = await db.collection('mcq_quizzes');
    return await col.findOne({ _id: id }) || null;
  }

  static async getQuizBySlug(slug) {
    const col = await db.collection('mcq_quizzes');
    return await col.findOne({ slug: slug }) || null;
  }

  static async getAllQuizzes(activeOnly = false) {
    const col = await db.collection('mcq_quizzes');
    const filter = activeOnly ? { is_active: true } : {};
    return await col.find(filter).sort({ _id: 1 }).toArray();
  }

  static async updateQuiz(id, data) {
    const col = await db.collection('mcq_quizzes');
    const allowed = ['title', 'slug', 'description', 'topic_id', 'difficulty', 'time_limit_minutes', 'total_marks', 'is_active'];
    const update = {};
    for (const f of allowed) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    update.updated_at = new Date();
    await col.updateOne({ _id: id }, { $set: update });
    return this.getQuizById(id);
  }

  static async deleteQuiz(id) {
    const col = await db.collection('mcq_quizzes');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // Questions CRUD
  static async addQuestion(question) {
    const col = await db.collection('mcq_questions');
    const id = await db.getNextSequenceValue('mcq_question_id');
    const doc = {
      _id: id, id: id,
      quiz_id: question.quiz_id,
      question_text: question.question_text,
      options: question.options || [],
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      marks: question.marks || 1,
      order: question.order || 1
    };
    await col.insertOne(doc);
    // Update quiz total marks
    await this._recalcTotalMarks(question.quiz_id);
    return doc;
  }

  static async getQuestionsByQuiz(quizId) {
    const col = await db.collection('mcq_questions');
    return await col.find({ quiz_id: quizId }).sort({ order: 1 }).toArray();
  }

  static async deleteQuestion(id) {
    const col = await db.collection('mcq_questions');
    const q = await col.findOne({ _id: id });
    const res = await col.deleteOne({ _id: id });
    if (q) await this._recalcTotalMarks(q.quiz_id);
    return res.deletedCount > 0;
  }

  static async _recalcTotalMarks(quizId) {
    const col = await db.collection('mcq_questions');
    const questions = await col.find({ quiz_id: quizId }).toArray();
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const quizCol = await db.collection('mcq_quizzes');
    await quizCol.updateOne({ _id: quizId }, { $set: { total_marks: totalMarks } });
  }

  // Attempts
  static async createAttempt(attempt) {
    const col = await db.collection('mcq_attempts');
    const id = await db.getNextSequenceValue('mcq_attempt_id');
    const doc = {
      _id: id, id: id,
      user_id: attempt.user_id,
      quiz_id: attempt.quiz_id,
      answers: attempt.answers || {},
      score: attempt.score || 0,
      total_marks: attempt.total_marks || 0,
      percentage: attempt.percentage || 0,
      time_taken_seconds: attempt.time_taken_seconds || 0,
      status: attempt.status || 'In Progress',
      started_at: new Date(),
      submitted_at: null
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getAttemptById(id) {
    const col = await db.collection('mcq_attempts');
    return await col.findOne({ _id: id }) || null;
  }

  static async updateAttempt(id, data) {
    const col = await db.collection('mcq_attempts');
    const update = {};
    const allowed = ['answers', 'score', 'total_marks', 'percentage', 'time_taken_seconds', 'status', 'submitted_at'];
    for (const f of allowed) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    await col.updateOne({ _id: id }, { $set: update });
    return this.getAttemptById(id);
  }

  static async getAttemptsByUser(userId, quizId = null) {
    const col = await db.collection('mcq_attempts');
    const filter = { user_id: userId };
    if (quizId) filter.quiz_id = quizId;
    return await col.find(filter).sort({ started_at: -1 }).toArray();
  }
}

module.exports = McqRepository;
