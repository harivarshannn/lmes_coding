from datetime import datetime, date
from app.database.session import SessionLocal, Base, engine
from app.models.topic import Topic
from app.models.question import Question
from app.models.language import Language
from app.models.question_language import QuestionLanguage
from app.models.testcase import TestCase
from app.models.hint import Hint
from app.models.solution import Solution
from app.models.tag import Tag
from app.models.question_tag import QuestionTag
from app.models.badge import Badge
from app.models.daily_streak import DailyStreak
from app.models.leaderboard import Leaderboard
from app.models.concept import Concept
from app.models.progress import Progress

def seed():
    print("Dropping all existing database tables to apply new schema...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables in Postgres...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Seed Languages
        print("Seeding Languages...")
        lang_text = Language(name="Plain Text", judge0_language_id=43)
        lang_js = Language(name="JavaScript", judge0_language_id=63)
        lang_py = Language(name="Python", judge0_language_id=71)
        lang_sql = Language(name="SQL", judge0_language_id=82)
        db.add_all([lang_text, lang_js, lang_py, lang_sql])
        db.commit()

        # 2. Seed Topics
        print("Seeding Topics...")
        topic_ds = Topic(name="Data Structures", description="Arrays, Lists, Sets, and Maps")
        topic_algo = Topic(name="Algorithms", description="Sorting, Searching, and Recursion")
        topic_web = Topic(name="Web Development", description="HTML5, CSS3, and JavaScript preview styling")
        topic_db = Topic(name="Databases", description="SQL queries, joins, filters, and aggregates")
        db.add_all([topic_ds, topic_algo, topic_web, topic_db])
        db.commit()

        # 3. Seed Badges
        print("Seeding Badges...")
        badge1 = Badge(name="First Solve", description="Successfully solved your first coding challenge!", icon_url="first_solve.png")
        badge2 = Badge(name="Streaker", description="Maintained a 3-day daily streak.", icon_url="streak.png")
        badge3 = Badge(name="Speed Coder", description="Solved a medium problem in under 5 minutes.", icon_url="speed.png")
        db.add_all([badge1, badge2, badge3])
        db.commit()

        # 4. Seed Questions
        print("Seeding Questions and boilerplates...")
        
        # Q1: Two Sum (Python)
        q1 = Question(
            title="Two Sum",
            slug="two-sum",
            description="Find two numbers in an array whose sum equals a target. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nInput format: The first line contains space-separated integers. The second line contains the target integer.",
            difficulty="Easy",
            estimated_time=15,
            marks=10,
            topic_id=topic_ds.id,
            question_type="coding",
            memory_limit=128000,
            time_limit=2.0,
            status="published"
        )
        db.add(q1)
        db.commit()

        # Q2: Palindrome Number (Python)
        q2 = Question(
            title="Palindrome Number",
            slug="palindrome-number",
            description="Given an integer x, return true if x is a palindrome, and false otherwise. Try doing this without string conversion.",
            difficulty="Easy",
            estimated_time=10,
            marks=10,
            topic_id=topic_algo.id,
            question_type="coding",
            memory_limit=128000,
            time_limit=2.0,
            status="published"
        )
        db.add(q2)
        db.commit()

        # Q3: Array Sum (JavaScript)
        q3 = Question(
            title="Array Sum",
            slug="array-sum",
            description="Given an array of integers, return their sum.\n\nInput format: Space-separated integers on a single line.",
            difficulty="Easy",
            estimated_time=5,
            marks=5,
            topic_id=topic_ds.id,
            question_type="coding",
            memory_limit=128000,
            time_limit=2.0,
            status="published"
        )
        db.add(q3)
        db.commit()

        # Q4: Create Blue Button (HTML5 web design)
        q4 = Question(
            title="Create Blue Button",
            slug="create-blue-button",
            description="Create an HTML button with id 'submit-btn', containing the text 'Submit Form', styled with a blue background and white text. Use Tailwind CSS classes: bg-blue-600, text-white, px-4, py-2, rounded.",
            difficulty="Easy",
            estimated_time=10,
            marks=15,
            topic_id=topic_web.id,
            question_type="web",
            memory_limit=128000,
            time_limit=2.0,
            status="published"
        )
        db.add(q4)
        db.commit()

        # Q5: SQL High Earners (SQL SQLite)
        q5 = Question(
            title="SQL High Earners",
            slug="sql-high-earners",
            description="Write a query to retrieve the name and salary of all employees who earn more than 50000. Sort the results by salary in descending order.\n\nThe database has an employees table with the schema:\n- id (INT)\n- name (TEXT)\n- salary (INT)",
            difficulty="Easy",
            estimated_time=10,
            marks=10,
            topic_id=topic_db.id,
            question_type="coding",
            memory_limit=128000,
            time_limit=2.0,
            status="published"
        )
        db.add(q5)
        db.commit()

        # 5. Question Languages (Starter templates)
        q1_starter_py = """def twoSum(nums, target):
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
"""
        db.add(QuestionLanguage(question_id=q1.id, language_id=lang_py.id, starter_code=q1_starter_py))

        q2_starter_py = """def isPalindrome(x: int) -> bool:
    # Write your Python 3 code here to return True or False
    pass

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().splitlines()
    if len(input_data) >= 1:
        x = int(input_data[0].strip())
        res = isPalindrome(x)
        print("true" if res else "false")
"""
        db.add(QuestionLanguage(question_id=q2.id, language_id=lang_py.id, starter_code=q2_starter_py))

        q3_starter_js = """function arraySum(arr) {
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
"""
        db.add(QuestionLanguage(question_id=q3.id, language_id=lang_js.id, starter_code=q3_starter_js))

        q4_starter_html = """<!-- Write your HTML5 markup here -->
<button id="" class="">
  
</button>
"""
        db.add(QuestionLanguage(question_id=q4.id, language_id=lang_text.id, starter_code=q4_starter_html))

        q5_starter_sql = """-- Write your SQL query here to retrieve name and salary
-- employees table: id (INT), name (TEXT), salary (INT)
"""
        db.add(QuestionLanguage(question_id=q5.id, language_id=lang_sql.id, starter_code=q5_starter_sql))
        db.commit()

        # 6. Testcases
        print("Seeding Test cases...")
        
        # Two Sum Testcases (input column)
        db.add(TestCase(question_id=q1.id, input="2 7 11 15\n9", expected_output="0 1", is_hidden=False))
        db.add(TestCase(question_id=q1.id, input="3 2 4\n6", expected_output="1 2", is_hidden=True))
        db.add(TestCase(question_id=q1.id, input="3 3\n6", expected_output="0 1", is_hidden=True))
        
        # Palindrome Number Testcases
        db.add(TestCase(question_id=q2.id, input="121", expected_output="true", is_hidden=False))
        db.add(TestCase(question_id=q2.id, input="-121", expected_output="false", is_hidden=True))
        db.add(TestCase(question_id=q2.id, input="10", expected_output="false", is_hidden=True))
        
        # Array Sum Testcases
        db.add(TestCase(question_id=q3.id, input="1 2 3 4", expected_output="10", is_hidden=False))
        db.add(TestCase(question_id=q3.id, input="-1 -2 3", expected_output="0", is_hidden=True))
        
        # HTML Testcase (acts as basic static verify)
        db.add(TestCase(question_id=q4.id, input="validate", expected_output="validation PASSED", is_hidden=False))

        # SQL Testcases (Testcase input holds setup SQL statements)
        q5_setup_1 = (
            "CREATE TABLE employees (id INT, name TEXT, salary INT);\n"
            "INSERT INTO employees VALUES (1, 'Alice', 60000);\n"
            "INSERT INTO employees VALUES (2, 'Bob', 45000);\n"
            "INSERT INTO employees VALUES (3, 'Charlie', 55000);"
        )
        q5_expected_1 = "Alice|60000\nCharlie|55000"
        
        q5_setup_2 = (
            "CREATE TABLE employees (id INT, name TEXT, salary INT);\n"
            "INSERT INTO employees VALUES (1, 'David', 75000);\n"
            "INSERT INTO employees VALUES (2, 'Emma', 50000);\n"
            "INSERT INTO employees VALUES (3, 'Frank', 90000);"
        )
        q5_expected_2 = "Frank|90000\nDavid|75000"
        
        db.add(TestCase(question_id=q5.id, input=q5_setup_1, expected_output=q5_expected_1, is_hidden=False))
        db.add(TestCase(question_id=q5.id, input=q5_setup_2, expected_output=q5_expected_2, is_hidden=True))
        db.commit()

        # 7. Seed Hints (Stage Reveal Logic)
        print("Seeding AI Hints reveal stages...")
        db.add(Hint(question_id=q1.id, attempt_number=1, hint="Small Hint: Try using a nested loop to check every combination of two numbers."))
        db.add(Hint(question_id=q1.id, attempt_number=2, hint="Detailed Hint: To do it in one pass, store seen numbers and their indices in a hash map."))
        db.add(Hint(question_id=q1.id, attempt_number=3, hint="Approach: Loop over the array. If (target - current_number) is in the hash map, return its stored index and the current index."))
        
        db.add(Hint(question_id=q2.id, attempt_number=1, hint="Small Hint: Negative numbers can never be palindromes due to the leading minus sign."))
        db.add(Hint(question_id=q2.id, attempt_number=2, hint="Detailed Hint: You can reverse the integer mathematically using division and modulo operators."))
        db.add(Hint(question_id=q2.id, attempt_number=3, hint="Approach: Store a copy of x, extract digits from the back, construct the reversed number, and check if it equals the copy."))
        
        db.add(Hint(question_id=q5.id, attempt_number=1, hint="Small Hint: Use the WHERE clause to check employee salary ranges."))
        db.add(Hint(question_id=q5.id, attempt_number=2, hint="Detailed Hint: SELECT 'name' and 'salary' fields and sort them in reverse salary order."))
        db.add(Hint(question_id=q5.id, attempt_number=3, hint="Approach: Use `WHERE salary > 50000` combined with `ORDER BY salary DESC`."))
        db.commit()

        # 8. Seed Solutions
        print("Seeding Solutions...")
        q1_sol = """def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""
        db.add(Solution(
            question_id=q1.id, 
            language_id=lang_py.id, 
            code=q1_sol, 
            explanation="We iterate and look up the target complement in a dictionary. This runs in O(N) time and O(N) space.", 
            complexity="O(N)"
        ))
        
        q2_sol = """def isPalindrome(x: int) -> bool:
    if x < 0:
        return False
    temp = x
    rev = 0
    while temp > 0:
        rev = rev * 10 + (temp % 10)
        temp = temp // 10
    return rev == x
"""
        db.add(Solution(
            question_id=q2.id, 
            language_id=lang_py.id, 
            code=q2_sol, 
            explanation="We mathematically reverse the integer using modulo division and compare the final reversed value to x.", 
            complexity="O(log(N))"
        ))

        q5_sol = "SELECT name, salary FROM employees WHERE salary > 50000 ORDER BY salary DESC;"
        db.add(Solution(
            question_id=q5.id,
            language_id=lang_sql.id,
            code=q5_sol,
            explanation="Use WHERE clause to filter salaries exceeding 50000, and ORDER BY to sort descending.",
            complexity="O(N log N)"
        ))
        db.commit()

        # 9. Seed Mock Leaderboard Profiles
        print("Seeding Leaderboard rankings...")
        db.add(Leaderboard(user_id=1, username="student", xp=100, rank=1))
        db.add(Leaderboard(user_id=2, username="codemaster99", xp=90, rank=2))
        db.add(Leaderboard(user_id=3, username="l33t_hacker", xp=75, rank=3))
        
        # Seed daily streak
        db.add(DailyStreak(user_id=1, current_streak=1, longest_streak=1, last_activity_date=date.today()))
        db.commit()

        print("Database seeded with new normalized tables successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
