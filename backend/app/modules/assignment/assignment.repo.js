const db = require('../../database/session');

class AssignmentRepository {
  static async create(data) {
    const col = await db.collection('assignments');
    const id = await db.getNextSequenceValue('assignment_id');
    const doc = {
      _id: id, id: id,
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      topic_id: data.topic_id || null,
      difficulty: data.difficulty || 'Easy',
      instructions_md: data.instructions_md || '',
      max_marks: data.max_marks || 100,
      deadline: data.deadline ? new Date(data.deadline) : null,
      language: data.language || 'python',
      starter_code: data.starter_code || '',
      auto_grade_enabled: data.auto_grade_enabled !== false,
      test_cases: data.test_cases || [],
      created_by: data.created_by || null,
      is_active: data.is_active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getById(id) {
    const col = await db.collection('assignments');
    return await col.findOne({ _id: id }) || null;
  }

  static async getBySlug(slug) {
    const col = await db.collection('assignments');
    return await col.findOne({ slug: slug }) || null;
  }

  static async getAll(activeOnly = false) {
    const col = await db.collection('assignments');
    const filter = activeOnly ? { is_active: true } : {};
    return await col.find(filter).sort({ _id: 1 }).toArray();
  }

  static async update(id, data) {
    const col = await db.collection('assignments');
    const allowed = ['title', 'slug', 'description', 'topic_id', 'difficulty', 'instructions_md', 'max_marks', 'deadline', 'language', 'starter_code', 'auto_grade_enabled', 'test_cases', 'is_active'];
    const update = {};
    for (const f of allowed) {
      if (data[f] !== undefined) {
        update[f] = f === 'deadline' && data[f] ? new Date(data[f]) : data[f];
      }
    }
    update.updated_at = new Date();
    await col.updateOne({ _id: id }, { $set: update });
    return this.getById(id);
  }

  static async delete(id) {
    const col = await db.collection('assignments');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // Submissions
  static async createSubmission(data) {
    const col = await db.collection('assignment_submissions');
    const id = await db.getNextSequenceValue('assignment_submission_id');
    const doc = {
      _id: id, id: id,
      assignment_id: data.assignment_id,
      user_id: data.user_id,
      code: data.code || '',
      language: data.language || 'python',
      auto_grade_score: data.auto_grade_score || null,
      manual_grade_score: data.manual_grade_score || null,
      final_score: data.final_score || null,
      feedback: data.feedback || '',
      status: data.status || 'Submitted',
      submitted_at: new Date(),
      graded_at: null
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getSubmissionById(id) {
    const col = await db.collection('assignment_submissions');
    return await col.findOne({ _id: id }) || null;
  }

  static async getSubmissionsByAssignment(assignmentId) {
    const col = await db.collection('assignment_submissions');
    return await col.find({ assignment_id: assignmentId }).sort({ submitted_at: -1 }).toArray();
  }

  static async getSubmissionByUserAndAssignment(userId, assignmentId) {
    const col = await db.collection('assignment_submissions');
    return await col.findOne({ user_id: userId, assignment_id: assignmentId }) || null;
  }

  static async updateSubmission(id, data) {
    const col = await db.collection('assignment_submissions');
    const allowed = ['auto_grade_score', 'manual_grade_score', 'final_score', 'feedback', 'status', 'graded_at'];
    const update = {};
    for (const f of allowed) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    await col.updateOne({ _id: id }, { $set: update });
    return this.getSubmissionById(id);
  }
}

module.exports = AssignmentRepository;
