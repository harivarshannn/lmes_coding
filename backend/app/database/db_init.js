const db = require('./session');

async function initDb() {
  console.log('Dropping all existing database collections to apply new schema...');
  const database = await db.getDb();

  const collections = await database.listCollections().toArray();
  for (const col of collections) {
    try {
      await database.collection(col.name).drop();
    } catch (e) {
      console.warn(`Could not drop collection ${col.name}: ${e.message}`);
    }
  }

  console.log('Initializing collections and creating indexes in MongoDB...');

  // ====== SHARED COLLECTIONS ======
  const topics = database.collection('topics');
  await topics.createIndex({ name: 1 }, { unique: true });

  const languages = database.collection('languages');
  await languages.createIndex({ name: 1 }, { unique: true });
  await languages.createIndex({ judge0_language_id: 1 }, { unique: true });

  const badges = database.collection('badges');
  await badges.createIndex({ name: 1 }, { unique: true });

  const achievements = database.collection('achievements');
  await achievements.createIndex({ user_id: 1, badge_id: 1 }, { unique: true });

  const dailyStreaks = database.collection('daily_streaks');
  await dailyStreaks.createIndex({ user_id: 1 }, { unique: true });

  const leaderboard = database.collection('leaderboard');
  await leaderboard.createIndex({ user_id: 1 }, { unique: true });
  await leaderboard.createIndex({ xp: -1 });

  const userAttempts = database.collection('user_attempts');
  await userAttempts.createIndex({ user_id: 1, question_id: 1 });

  const progress = database.collection('progress');
  await progress.createIndex({ user_id: 1, question_id: 1 }, { unique: true });

  const bookmarks = database.collection('bookmarks');
  await bookmarks.createIndex({ user_id: 1, question_id: 1 }, { unique: true });

  const favorites = database.collection('favorites');
  await favorites.createIndex({ user_id: 1, question_id: 1 }, { unique: true });

  // ====== CODING MODULE ======
  const questions = database.collection('questions');
  await questions.createIndex({ slug: 1 }, { unique: true });

  const testcases = database.collection('testcases');
  await testcases.createIndex({ question_id: 1 });

  const hints = database.collection('hints');
  await hints.createIndex({ question_id: 1 });

  const solutions = database.collection('solutions');
  await solutions.createIndex({ question_id: 1 });

  const submissions = database.collection('submissions');
  await submissions.createIndex({ student_id: 1 });
  await submissions.createIndex({ judge0_token: 1 });

  // ====== MCQ MODULE ======
  const mcqQuizzes = database.collection('mcq_quizzes');
  await mcqQuizzes.createIndex({ slug: 1 }, { unique: true });
  await mcqQuizzes.createIndex({ topic_id: 1 });

  const mcqQuestions = database.collection('mcq_questions');
  await mcqQuestions.createIndex({ quiz_id: 1 });

  const mcqAttempts = database.collection('mcq_attempts');
  await mcqAttempts.createIndex({ user_id: 1, quiz_id: 1 });
  await mcqAttempts.createIndex({ user_id: 1 });

  // ====== ASSIGNMENT MODULE ======
  const assignments = database.collection('assignments');
  await assignments.createIndex({ slug: 1 }, { unique: true });
  await assignments.createIndex({ topic_id: 1 });

  const assignmentSubmissions = database.collection('assignment_submissions');
  await assignmentSubmissions.createIndex({ assignment_id: 1, user_id: 1 }, { unique: true });
  await assignmentSubmissions.createIndex({ assignment_id: 1 });

  // ====== BUGFIX MODULE ======
  const bugfixChallenges = database.collection('bugfix_challenges');
  await bugfixChallenges.createIndex({ slug: 1 }, { unique: true });
  await bugfixChallenges.createIndex({ topic_id: 1 });

  const bugfixAttempts = database.collection('bugfix_attempts');
  await bugfixAttempts.createIndex({ user_id: 1, challenge_id: 1 });
  await bugfixAttempts.createIndex({ user_id: 1 });

  console.log('Schema initialized successfully! (All modules: Coding, MCQ, Assignment, BugFix)');
}

module.exports = {
  initDb
};
