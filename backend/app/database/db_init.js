const db = require('./session');

async function initDb() {
  console.log("Dropping all existing database collections to apply new schema...");
  const database = await db.getDb();
  
  const collections = await database.listCollections().toArray();
  for (const col of collections) {
    try {
      await database.collection(col.name).drop();
    } catch (e) {
      console.warn(`Could not drop collection ${col.name}: ${e.message}`);
    }
  }
  
  console.log("Initializing collections and creating indexes in MongoDB...");
  
  // topics
  const topics = database.collection('topics');
  await topics.createIndex({ name: 1 }, { unique: true });
  
  // questions
  const questions = database.collection('questions');
  await questions.createIndex({ slug: 1 }, { unique: true });
  
  // languages
  const languages = database.collection('languages');
  await languages.createIndex({ name: 1 }, { unique: true });
  await languages.createIndex({ judge0_language_id: 1 }, { unique: true });
  
  // testcases
  const testcases = database.collection('testcases');
  await testcases.createIndex({ question_id: 1 });
  
  // hints
  const hints = database.collection('hints');
  await hints.createIndex({ question_id: 1 });
  
  // solutions
  const solutions = database.collection('solutions');
  await solutions.createIndex({ question_id: 1 });
  
  // badges
  const badges = database.collection('badges');
  await badges.createIndex({ name: 1 }, { unique: true });
  
  // achievements
  const achievements = database.collection('achievements');
  await achievements.createIndex({ user_id: 1, badge_id: 1 }, { unique: true });
  
  // daily_streaks
  const dailyStreaks = database.collection('daily_streaks');
  await dailyStreaks.createIndex({ user_id: 1 }, { unique: true });
  
  // leaderboard
  const leaderboard = database.collection('leaderboard');
  await leaderboard.createIndex({ user_id: 1 }, { unique: true });
  await leaderboard.createIndex({ xp: -1 });
  
  // user_attempts
  const userAttempts = database.collection('user_attempts');
  await userAttempts.createIndex({ user_id: 1, question_id: 1 });
  
  // progress
  const progress = database.collection('progress');
  await progress.createIndex({ user_id: 1, question_id: 1 }, { unique: true });
  
  // submissions
  const submissions = database.collection('submissions');
  await submissions.createIndex({ student_id: 1 });
  await submissions.createIndex({ judge0_token: 1 });
  
  // bookmarks
  const bookmarks = database.collection('bookmarks');
  await bookmarks.createIndex({ user_id: 1, question_id: 1 }, { unique: true });
  
  // favorites
  const favorites = database.collection('favorites');
  await favorites.createIndex({ user_id: 1, question_id: 1 }, { unique: true });
  
  console.log("Schema initialized successfully!");
}

module.exports = {
  initDb
};
