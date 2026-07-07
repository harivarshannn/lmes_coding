const db = require('../../database/session');

class BugfixRepository {
  // Challenges CRUD
  static async createChallenge(data) {
    const col = await db.collection('bugfix_challenges');
    const id = await db.getNextSequenceValue('bugfix_challenge_id');
    const doc = {
      _id: id, id: id,
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      topic_id: data.topic_id || null,
      difficulty: data.difficulty || 'Easy',
      language: data.language || 'python',
      buggy_code: data.buggy_code || '',
      correct_code: data.correct_code || '',
      hints: data.hints || [],
      test_cases: data.test_cases || [],
      max_attempts: data.max_attempts || 5,
      xp_reward: data.xp_reward || 50,
      created_by: data.created_by || null,
      is_active: data.is_active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getChallengeById(id) {
    const col = await db.collection('bugfix_challenges');
    return await col.findOne({ _id: id }) || null;
  }

  static async getChallengeBySlug(slug) {
    const col = await db.collection('bugfix_challenges');
    return await col.findOne({ slug: slug }) || null;
  }

  static async getAllChallenges(activeOnly = false) {
    const col = await db.collection('bugfix_challenges');
    const filter = activeOnly ? { is_active: true } : {};
    return await col.find(filter).sort({ _id: 1 }).toArray();
  }

  static async updateChallenge(id, data) {
    const col = await db.collection('bugfix_challenges');
    const allowed = ['title', 'slug', 'description', 'topic_id', 'difficulty', 'language', 'buggy_code', 'correct_code', 'hints', 'test_cases', 'max_attempts', 'xp_reward', 'is_active'];
    const update = {};
    for (const f of allowed) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    update.updated_at = new Date();
    await col.updateOne({ _id: id }, { $set: update });
    return this.getChallengeById(id);
  }

  static async deleteChallenge(id) {
    const col = await db.collection('bugfix_challenges');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  // Attempts
  static async createAttempt(data) {
    const col = await db.collection('bugfix_attempts');
    const id = await db.getNextSequenceValue('bugfix_attempt_id');
    
    // Calculate attempt number
    const attemptCount = await col.countDocuments({ user_id: data.user_id, challenge_id: data.challenge_id });
    
    const doc = {
      _id: id, id: id,
      user_id: data.user_id,
      challenge_id: data.challenge_id,
      submitted_code: data.submitted_code || '',
      passed_tests: data.passed_tests || 0,
      total_tests: data.total_tests || 0,
      status: data.status || 'Wrong Answer',
      attempt_number: attemptCount + 1,
      submitted_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getAttemptById(id) {
    const col = await db.collection('bugfix_attempts');
    return await col.findOne({ _id: id }) || null;
  }

  static async getAttemptsByUserAndChallenge(userId, challengeId) {
    const col = await db.collection('bugfix_attempts');
    return await col.find({ user_id: userId, challenge_id: challengeId }).sort({ attempt_number: 1 }).toArray();
  }

  static async getAttemptCount(userId, challengeId) {
    const col = await db.collection('bugfix_attempts');
    return await col.countDocuments({ user_id: userId, challenge_id: challengeId });
  }
}

module.exports = BugfixRepository;
