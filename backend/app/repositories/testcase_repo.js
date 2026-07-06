const db = require('../database/session');

class TestCaseRepository {
  static async getById(id) {
    const col = await db.collection('testcases');
    return await col.findOne({ _id: id }) || null;
  }

  static async getByQuestion(questionId) {
    const col = await db.collection('testcases');
    return await col.find({ question_id: questionId }).toArray();
  }

  static async create(tc) {
    const col = await db.collection('testcases');
    const id = await db.getNextSequenceValue('testcase_id');
    const doc = {
      _id: id,
      id: id,
      question_id: tc.question_id,
      input: tc.input,
      expected_output: tc.expected_output,
      is_hidden: tc.is_hidden ?? false,
      created_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async delete(id) {
    const col = await db.collection('testcases');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}

module.exports = TestCaseRepository;
