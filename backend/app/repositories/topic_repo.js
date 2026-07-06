const db = require('../database/session');

class TopicRepository {
  static async getById(id) {
    const col = await db.collection('topics');
    return await col.findOne({ _id: id }) || null;
  }

  static async getAll() {
    const col = await db.collection('topics');
    return await col.find({}).sort({ name: 1 }).toArray();
  }

  static async create(topic) {
    const col = await db.collection('topics');
    const id = await db.getNextSequenceValue('topic_id');
    const doc = {
      _id: id,
      id: id,
      name: topic.name,
      description: topic.description,
      created_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async delete(id) {
    const col = await db.collection('topics');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}

module.exports = TopicRepository;
