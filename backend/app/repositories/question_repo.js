const db = require('../database/session');

class QuestionRepository {
  static _formatQuestion(q) {
    if (!q) return null;
    q.id = q._id; // Ensure integer id compatibility
    q.statement = q.description;
    
    // Normalize templates field
    const temps = q.templates || {};
    q.template_python = temps['python'] || temps['python 3'] || '';
    q.template_javascript = temps['javascript'] || '';
    q.template_html = temps['plain text'] || temps['html'] || '';
    q.template_sql = temps['sql'] || '';
    
    return q;
  }

  static async getById(id) {
    const col = await db.collection('questions');
    const q = await col.findOne({ _id: id });
    return this._formatQuestion(q);
  }

  static async getBySlug(slug) {
    const col = await db.collection('questions');
    const q = await col.findOne({ slug: slug });
    return this._formatQuestion(q);
  }

  static async getAll(status = null) {
    const col = await db.collection('questions');
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const list = await col.find(filter).sort({ _id: 1 }).toArray();
    return list.map(q => this._formatQuestion(q));
  }

  static async create(q) {
    const col = await db.collection('questions');
    const id = await db.getNextSequenceValue('question_id');
    const descriptionText = q.description || q.statement || "";
    const doc = {
      _id: id,
      id: id,
      title: q.title,
      slug: q.slug,
      description: descriptionText,
      difficulty: q.difficulty,
      estimated_time: q.estimated_time ?? 15,
      marks: q.marks ?? 10,
      topic_id: q.topic_id ?? null,
      question_type: q.question_type ?? 'coding',
      memory_limit: q.memory_limit ?? 128000,
      time_limit: q.time_limit ?? 2.0,
      status: q.status ?? 'published',
      templates: q.templates || {},
      tags: q.tags || [],
      created_at: new Date()
    };
    await col.insertOne(doc);
    return this._formatQuestion(doc);
  }

  static async update(id, q) {
    const col = await db.collection('questions');
    const updateDoc = {};
    const allowedFields = [
      'title', 'slug', 'description', 'difficulty', 'estimated_time', 
      'marks', 'topic_id', 'question_type', 'memory_limit', 'time_limit', 'status'
    ];

    if (q.statement !== undefined && q.description === undefined) {
      q.description = q.statement;
    }

    for (const f of allowedFields) {
      if (q[f] !== undefined) {
        updateDoc[f] = q[f];
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return this.getById(id);
    }

    await col.updateOne({ _id: id }, { $set: updateDoc });
    return this.getById(id);
  }

  static async delete(id) {
    const col = await db.collection('questions');
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  static async addLanguageTemplate(questionId, languageId, starterCode) {
    const langCol = await db.collection('languages');
    const lang = await langCol.findOne({ _id: languageId });
    if (!lang) return null;
    const langName = lang.name.toLowerCase();

    const questions = await db.collection('questions');
    const updateKey = `templates.${langName}`;
    await questions.updateOne(
      { _id: questionId },
      { $set: { [updateKey]: starterCode } }
    );
    return { question_id: questionId, language_id: languageId, starter_code: starterCode };
  }

  static async addTag(questionId, tagName) {
    const questions = await db.collection('questions');
    await questions.updateOne(
      { _id: questionId },
      { $addToSet: { tags: tagName } }
    );
  }

  static async clearTags(questionId) {
    const questions = await db.collection('questions');
    await questions.updateOne(
      { _id: questionId },
      { $set: { tags: [] } }
    );
  }
}

module.exports = QuestionRepository;
