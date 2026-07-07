const mongoose = require('mongoose');
const settings = require('../config/settings');
const models = require('./models');

let isConnected = false;

async function connect() {
  if (!isConnected) {
    await mongoose.connect(settings.resolved_database_url);
    isConnected = true;
  }
}

async function getDb() {
  await connect();
  return mongoose.connection.db;
}

// Helper to get auto-incrementing integer IDs
async function getNextSequenceValue(sequenceName) {
  await connect();
  const res = await models.Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { returnDocument: 'after', upsert: true }
  ).exec();
  return res.sequence_value;
}

class MongooseCollectionWrapper {
  constructor(model) {
    this.model = model;
  }

  find(filter = {}) {
    const query = this.model.find(filter);
    
    // Return a chainable helper
    const helper = {
      sort: (sortObj) => {
        query.sort(sortObj);
        return helper;
      },
      limit: (limitNum) => {
        query.limit(limitNum);
        return helper;
      },
      toArray: async () => {
        const docs = await query.exec();
        return docs.map(d => d.toObject ? d.toObject() : d);
      }
    };
    return helper;
  }

  async findOne(filter) {
    const doc = await this.model.findOne(filter).exec();
    return doc ? doc.toObject() : null;
  }

  async insertOne(doc) {
    const created = await this.model.create(doc);
    return { acknowledged: true, insertedId: doc._id };
  }

  async insertMany(docs) {
    await this.model.insertMany(docs);
    return { acknowledged: true };
  }

  async updateOne(filter, update, options) {
    const res = await this.model.updateOne(filter, update, options).exec();
    return res;
  }

  async updateMany(filter, update, options) {
    const res = await this.model.updateMany(filter, update, options).exec();
    return res;
  }

  async deleteOne(filter) {
    const res = await this.model.deleteOne(filter).exec();
    return res;
  }

  async deleteMany(filter) {
    const res = await this.model.deleteMany(filter).exec();
    return res;
  }

  async countDocuments(filter) {
    return await this.model.countDocuments(filter).exec();
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const doc = await this.model.findOneAndUpdate(filter, update, options).exec();
    return doc ? doc.toObject() : null;
  }
}

module.exports = {
  get client() {
    return mongoose.connection ? mongoose.connection.client : null;
  },
  getDb,
  getNextSequenceValue,
  collection: async (name) => {
    await connect();
    const model = models.modelsMap[name];
    if (model) {
      return new MongooseCollectionWrapper(model);
    }
    // Fallback to raw collection if not mapped
    const database = await getDb();
    return database.collection(name);
  },
  close: async () => {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
    }
  }
};
