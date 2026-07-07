const db = require('../database/session');

async function seedBugfix() {
  const database = await db.getDb();
  console.log("Seeding Bug Fixing Challenges...");

  const topicsCol = database.collection('topics');
  const dsTopic = await topicsCol.findOne({ name: 'Data Structures' });

  const challengesCol = database.collection('bugfix_challenges');

  const bf1Id = await db.getNextSequenceValue('bugfix_challenge_id');
  const bf1 = {
    _id: bf1Id, id: bf1Id,
    title: 'Fix Array Search',
    slug: 'fix-array-search',
    description: 'The function search_element is supposed to return the index of an element in a list, or -1 if not found. However, there is a bug in the code. Find and fix it.',
    topic_id: dsTopic ? dsTopic._id : 1,
    difficulty: 'Easy',
    language: 'python',
    buggy_code: `def search_element(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
        else:
            return -1
`,
    correct_code: `def search_element(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
`,
    hints: [
      'Look at the placement of the return statements.',
      'Does the loop get interrupted on the very first element?'
    ],
    test_cases: [
      { input: '1 2 3 4 5\n3', expected_output: '2', is_hidden: false },
      { input: '1 2 3 4 5\n6', expected_output: '-1', is_hidden: false }
    ],
    max_attempts: 5,
    xp_reward: 50,
    created_by: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  await challengesCol.insertOne(bf1);

  console.log("Bug Fixing Challenges seeded successfully.");
}

module.exports = seedBugfix;
