const { MongoClient } = require('mongodb');
const settings = require('../config/settings');

const client = new MongoClient(settings.resolved_database_url);
let db = null;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db();
  }
  return db;
}

// Helper to get auto-incrementing integer IDs
async function getNextSequenceValue(sequenceName) {
  const database = await getDb();
  const res = await database.collection('counters').findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return res.sequence_value;
}

module.exports = {
  client,
  getDb,
  getNextSequenceValue,
  collection: async (name) => {
    const database = await getDb();
    return database.collection(name);
  },
  close: async () => {
    await client.close();
    db = null;
  }
};
