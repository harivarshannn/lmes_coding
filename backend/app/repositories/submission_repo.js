const db = require('../database/session');

class SubmissionRepository {
  static async getById(id) {
    const col = await db.collection('submissions');
    return await col.findOne({ _id: id }) || null;
  }

  static async getByToken(token) {
    const col = await db.collection('submissions');
    return await col.findOne({ judge0_token: token }) || null;
  }

  static async getAll() {
    const col = await db.collection('submissions');
    return await col.find({}).sort({ created_at: -1 }).toArray();
  }

  static async getByStudent(studentId) {
    const col = await db.collection('submissions');
    return await col.find({ student_id: studentId }).sort({ created_at: -1 }).toArray();
  }

  static async getByQuestion(questionId) {
    const col = await db.collection('submissions');
    return await col.find({ question_id: questionId }).sort({ created_at: -1 }).toArray();
  }

  static async create(s) {
    const col = await db.collection('submissions');
    const id = await db.getNextSequenceValue('submission_id');
    const doc = {
      _id: id,
      id: id,
      judge0_token: s.judge0_token ?? null,
      student_id: s.student_id,
      question_id: s.question_id,
      language_id: s.language_id ?? null,
      code: s.code,
      status: s.status,
      passed: s.passed ?? 0,
      total: s.total ?? 0,
      stdout: s.stdout ?? null,
      stderr: s.stderr ?? null,
      compile_output: s.compile_output ?? null,
      execution_time: s.execution_time ?? null,
      memory: s.memory ?? null,
      created_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async update(id, s) {
    const col = await db.collection('submissions');
    const updateDoc = {};
    const allowedFields = [
      'judge0_token', 'status', 'passed', 'total', 'stdout', 'stderr', 
      'compile_output', 'execution_time', 'memory'
    ];
    for (const f of allowedFields) {
      if (s[f] !== undefined) {
        updateDoc[f] = s[f];
      }
    }
    if (Object.keys(updateDoc).length === 0) {
      return this.getById(id);
    }
    await col.updateOne({ _id: id }, { $set: updateDoc });
    return this.getById(id);
  }
}

module.exports = SubmissionRepository;
