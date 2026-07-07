const { initDb } = require('../database/db_init');
const db = require('../database/session');

async function seed() {
  await initDb();
  
  const database = await db.getDb();
  
  console.log("Seeding Languages...");
  const languages = database.collection('languages');
  
  const langTextId = await db.getNextSequenceValue('language_id');
  const langText = { _id: langTextId, id: langTextId, name: 'Plain Text', judge0_language_id: 43 };
  await languages.insertOne(langText);

  const langJsId = await db.getNextSequenceValue('language_id');
  const langJs = { _id: langJsId, id: langJsId, name: 'JavaScript', judge0_language_id: 63 };
  await languages.insertOne(langJs);

  const langPyId = await db.getNextSequenceValue('language_id');
  const langPy = { _id: langPyId, id: langPyId, name: 'Python', judge0_language_id: 71 };
  await languages.insertOne(langPy);

  const langSqlId = await db.getNextSequenceValue('language_id');
  const langSql = { _id: langSqlId, id: langSqlId, name: 'SQL', judge0_language_id: 82 };
  await languages.insertOne(langSql);

  console.log("Seeding Topics...");
  const topics = database.collection('topics');
  
  const topicDsId = await db.getNextSequenceValue('topic_id');
  const topicDs = { _id: topicDsId, id: topicDsId, name: 'Data Structures', description: 'Arrays, Lists, Sets, and Maps', created_at: new Date() };
  await topics.insertOne(topicDs);

  const topicAlgoId = await db.getNextSequenceValue('topic_id');
  const topicAlgo = { _id: topicAlgoId, id: topicAlgoId, name: 'Algorithms', description: 'Sorting, Searching, and Recursion', created_at: new Date() };
  await topics.insertOne(topicAlgo);

  const topicWebId = await db.getNextSequenceValue('topic_id');
  const topicWeb = { _id: topicWebId, id: topicWebId, name: 'Web Development', description: 'HTML5, CSS3, and JavaScript preview styling', created_at: new Date() };
  await topics.insertOne(topicWeb);

  const topicDbId = await db.getNextSequenceValue('topic_id');
  const topicDb = { _id: topicDbId, id: topicDbId, name: 'Databases', description: 'SQL queries, joins, filters, and aggregates', created_at: new Date() };
  await topics.insertOne(topicDb);

  console.log("Seeding Badges...");
  const badges = database.collection('badges');
  
  const b1Id = await db.getNextSequenceValue('badge_id');
  await badges.insertOne({ _id: b1Id, id: b1Id, name: 'First Solve', description: 'Successfully solved your first coding challenge!', icon_url: 'first_solve.png' });
  
  const b2Id = await db.getNextSequenceValue('badge_id');
  await badges.insertOne({ _id: b2Id, id: b2Id, name: 'Streaker', description: 'Maintained a 3-day daily streak.', icon_url: 'streak.png' });
  
  const b3Id = await db.getNextSequenceValue('badge_id');
  await badges.insertOne({ _id: b3Id, id: b3Id, name: 'Speed Coder', description: 'Solved a medium problem in under 5 minutes.', icon_url: 'speed.png' });

  console.log("Seeding Questions...");
  const questions = database.collection('questions');
  
  const q1Id = await db.getNextSequenceValue('question_id');
  const q1 = {
    _id: q1Id,
    id: q1Id,
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Find two numbers in an array whose sum equals a target. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nInput format: The first line contains space-separated integers. The second line contains the target integer.',
    difficulty: 'Easy',
    estimated_time: 15,
    marks: 10,
    topic_id: topicDsId,
    question_type: 'coding',
    memory_limit: 128000,
    time_limit: 2.0,
    status: 'published',
    templates: {},
    tags: ['array', 'hash-table'],
    created_at: new Date()
  };
  
  const q2Id = await db.getNextSequenceValue('question_id');
  const q2 = {
    _id: q2Id,
    id: q2Id,
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise. Try doing this without string conversion.',
    difficulty: 'Easy',
    estimated_time: 10,
    marks: 10,
    topic_id: topicAlgoId,
    question_type: 'coding',
    memory_limit: 128000,
    time_limit: 2.0,
    status: 'published',
    templates: {},
    tags: ['math'],
    created_at: new Date()
  };

  const q3Id = await db.getNextSequenceValue('question_id');
  const q3 = {
    _id: q3Id,
    id: q3Id,
    title: 'Array Sum',
    slug: 'array-sum',
    description: 'Given an array of integers, return their sum.\n\nInput format: Space-separated integers on a single line.',
    difficulty: 'Easy',
    estimated_time: 5,
    marks: 5,
    topic_id: topicDsId,
    question_type: 'coding',
    memory_limit: 128000,
    time_limit: 2.0,
    status: 'published',
    templates: {},
    tags: ['array'],
    created_at: new Date()
  };

  const q4Id = await db.getNextSequenceValue('question_id');
  const q4 = {
    _id: q4Id,
    id: q4Id,
    title: 'Create Blue Button',
    slug: 'create-blue-button',
    description: "Create an HTML button with id 'submit-btn', containing the text 'Submit Form', styled with a blue background and white text. Use Tailwind CSS classes: bg-blue-600, text-white, px-4, py-2, rounded.",
    difficulty: 'Easy',
    estimated_time: 10,
    marks: 15,
    topic_id: topicWebId,
    question_type: 'web',
    memory_limit: 128000,
    time_limit: 2.0,
    status: 'published',
    templates: {},
    tags: ['html', 'css', 'tailwind'],
    created_at: new Date()
  };

  const q5Id = await db.getNextSequenceValue('question_id');
  const q5 = {
    _id: q5Id,
    id: q5Id,
    title: 'SQL High Earners',
    slug: 'sql-high-earners',
    description: 'Write a query to retrieve the name and salary of all employees who earn more than 50000. Sort the results by salary in descending order.\n\nThe database has an employees table with the schema:\n- id (INT)\n- name (TEXT)\n- salary (INT)',
    difficulty: 'Easy',
    estimated_time: 10,
    marks: 10,
    topic_id: topicDbId,
    question_type: 'coding',
    memory_limit: 128000,
    time_limit: 2.0,
    status: 'published',
    templates: {},
    tags: ['sql', 'database'],
    created_at: new Date()
  };

  console.log("Seeding starter templates...");
  const q1StarterPy = `def twoSum(nums, target):
    # Write your Python 3 code here to return a list of two indices
    pass

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().splitlines()
    if len(input_data) >= 2:
        nums = [int(x) for x in input_data[0].split()]
        target = int(input_data[1])
        res = twoSum(nums, target)
        if res:
            print(" ".join(map(str, res)))
`;
  q1.templates['python'] = q1StarterPy;

  const q2StarterPy = `def isPalindrome(x: int) -> bool:
    # Write your Python 3 code here to return True or False
    pass

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().splitlines()
    if len(input_data) >= 1:
        x = int(input_data[0].strip())
        res = isPalindrome(x)
        print("true" if res else "false")
`;
  q2.templates['python'] = q2StarterPy;

  const q3StarterJs = `function arraySum(arr) {
    // Write your code here to return the sum of the array
    
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    const arr = line.trim().split(/\\s+/).map(Number);
    console.log(arraySum(arr));
});
`;
  q3.templates['javascript'] = q3StarterJs;

  const q4StarterHtml = `<!-- Write your HTML5 markup here -->
<button id="" class="">
  
</button>
`;
  q4.templates['plain text'] = q4StarterHtml;

  const q5StarterSql = `-- Write your SQL query here to retrieve name and salary
-- employees table: id (INT), name (TEXT), salary (INT)
`;
  q5.templates['sql'] = q5StarterSql;

  // Insert questions with templates
  await questions.insertOne(q1);
  await questions.insertOne(q2);
  await questions.insertOne(q3);
  await questions.insertOne(q4);
  await questions.insertOne(q5);

  console.log("Seeding Test cases...");
  const testcases = database.collection('testcases');
  
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q1Id, input: '2 7 11 15\n9', expected_output: '0 1', is_hidden: false, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q1Id, input: '3 2 4\n6', expected_output: '1 2', is_hidden: true, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q1Id, input: '3 3\n6', expected_output: '0 1', is_hidden: true, created_at: new Date() });

  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q2Id, input: '121', expected_output: 'true', is_hidden: false, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q2Id, input: '-121', expected_output: 'false', is_hidden: true, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q2Id, input: '10', expected_output: 'false', is_hidden: true, created_at: new Date() });

  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q3Id, input: '1 2 3 4', expected_output: '10', is_hidden: false, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q3Id, input: '-1 -2 3', expected_output: '0', is_hidden: true, created_at: new Date() });

  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q4Id, input: 'validate', expected_output: 'validation PASSED', is_hidden: false, created_at: new Date() });

  const q5Setup1 = `CREATE TABLE employees (id INT, name TEXT, salary INT);\nINSERT INTO employees VALUES (1, 'Alice', 60000);\nINSERT INTO employees VALUES (2, 'Bob', 45000);\nINSERT INTO employees VALUES (3, 'Charlie', 55000);`;
  const q5Expected1 = `Alice|60000\nCharlie|55000`;
  const q5Setup2 = `CREATE TABLE employees (id INT, name TEXT, salary INT);\nINSERT INTO employees VALUES (1, 'David', 75000);\nINSERT INTO employees VALUES (2, 'Emma', 50000);\nINSERT INTO employees VALUES (3, 'Frank', 90000);`;
  const q5Expected2 = `Frank|90000\nDavid|75000`;
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q5Id, input: q5Setup1, expected_output: q5Expected1, is_hidden: false, created_at: new Date() });
  await testcases.insertOne({ _id: await db.getNextSequenceValue('testcase_id'), question_id: q5Id, input: q5Setup2, expected_output: q5Expected2, is_hidden: true, created_at: new Date() });

  console.log("Seeding Hints...");
  const hints = database.collection('hints');
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q1Id, attempt_number: 1, hint: 'Small Hint: Try using a nested loop to check every combination of two numbers.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q1Id, attempt_number: 2, hint: 'Detailed Hint: To do it in one pass, store seen numbers and their indices in a hash map.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q1Id, attempt_number: 3, hint: 'Approach: Loop over the array. If (target - current_number) is in the hash map, return its stored index and the current index.' });

  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q2Id, attempt_number: 1, hint: 'Small Hint: Negative numbers can never be palindromes due to the leading minus sign.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q2Id, attempt_number: 2, hint: 'Detailed Hint: You can reverse the integer mathematically using division and modulo operators.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q2Id, attempt_number: 3, hint: 'Approach: Store a copy of x, extract digits from the back, construct the reversed number, and check if it equals the copy.' });

  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q5Id, attempt_number: 1, hint: 'Small Hint: Use the WHERE clause to check employee salary ranges.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q5Id, attempt_number: 2, hint: 'Detailed Hint: SELECT \'name\' and \'salary\' fields and sort them in reverse salary order.' });
  await hints.insertOne({ _id: await db.getNextSequenceValue('hint_id'), question_id: q5Id, attempt_number: 3, hint: 'Approach: Use `WHERE salary > 50000` combined with `ORDER BY salary DESC`.' });

  console.log("Seeding Solutions...");
  const solutions = database.collection('solutions');
  const q1Sol = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`;
  await solutions.insertOne({ _id: await db.getNextSequenceValue('solution_id'), question_id: q1Id, language_id: langPyId, code: q1Sol, explanation: 'We iterate and look up the target complement in a dictionary. This runs in O(N) time and O(N) space.', complexity: 'O(N)' });

  const q2Sol = `def isPalindrome(x: int) -> bool:
    if x < 0:
        return False
    temp = x
    rev = 0
    while temp > 0:
        rev = rev * 10 + (temp % 10)
        temp = temp // 10
    return rev == x
`;
  await solutions.insertOne({ _id: await db.getNextSequenceValue('solution_id'), question_id: q2Id, language_id: langPyId, code: q2Sol, explanation: 'We mathematically reverse the integer using modulo division and compare the final reversed value to x.', complexity: 'O(log(N))' });

  const q5Sol = `SELECT name, salary FROM employees WHERE salary > 50000 ORDER BY salary DESC;`;
  await solutions.insertOne({ _id: await db.getNextSequenceValue('solution_id'), question_id: q5Id, language_id: langSqlId, code: q5Sol, explanation: 'Use WHERE clause to filter salaries exceeding 50000, and ORDER BY to sort descending.', complexity: 'O(N log N)' });

  console.log("Seeding Leaderboard...");
  const leaderboard = database.collection('leaderboard');
  await leaderboard.insertOne({ _id: await db.getNextSequenceValue('leaderboard_id'), user_id: 1, username: 'student', xp: 100, rank: 1 });
  await leaderboard.insertOne({ _id: await db.getNextSequenceValue('leaderboard_id'), user_id: 2, username: 'codemaster99', xp: 90, rank: 2 });
  await leaderboard.insertOne({ _id: await db.getNextSequenceValue('leaderboard_id'), user_id: 3, username: 'l33t_hacker', xp: 75, rank: 3 });

  console.log("Seeding Streaks...");
  const dailyStreaks = database.collection('daily_streaks');
  const todayStr = new Date().toISOString().split('T')[0];
  await dailyStreaks.insertOne({ _id: await db.getNextSequenceValue('streak_id'), user_id: 1, current_streak: 1, longest_streak: 1, last_activity_date: todayStr });

  // Seed additional modules
  const seedMcq = require('./seed_mcq');
  const seedAssignments = require('./seed_assignments');
  const seedBugfix = require('./seed_bugfix');

  await seedMcq();
  await seedAssignments();
  await seedBugfix();

  console.log("Database seeded successfully!");
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log("Database seed script finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database seed failed:", err);
      process.exit(1);
    });
}

module.exports = seed;
