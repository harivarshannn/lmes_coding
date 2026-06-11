from app.database.session import SessionLocal, Base, engine
from app.models.question import Question
from app.models.testcase import TestCase
from app.models.submission import Submission

def seed():
    print("Dropping all existing tables to apply updated schema...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Two Sum Templates
        two_sum_python = """def twoSum(nums, target):
    # Write your Python 3 code here to return a list of two indices
    pass

# Read inputs from stdin
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

        two_sum_java = """import java.util.*;
import java.io.*;

public class Main {
    // Complete the twoSum function below
    public static int[] twoSum(int[] nums, int target) {
        // Write your Java code here
        
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line1 = br.readLine();
        if (line1 != null) {
            String[] parts = line1.trim().split("\\\\s+");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) {
                nums[i] = Integer.parseInt(parts[i]);
            }
            String line2 = br.readLine();
            if (line2 != null) {
                int target = Integer.parseInt(line2.trim());
                int[] res = twoSum(nums, target);
                if (res.length == 2) {
                    System.out.println(res[0] + " " + res[1]);
                }
            }
        }
    }
}
"""

        # Palindrome Number Templates
        palindrome_python = """def isPalindrome(x: int) -> bool:
    # Write your Python 3 code here to return True or False
    pass

# Read inputs from stdin
if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().splitlines()
    if len(input_data) >= 1:
        x = int(input_data[0].strip())
        res = isPalindrome(x)
        print("true" if res else "false")
"""

        palindrome_java = """import java.util.*;
import java.io.*;

public class Main {
    // Complete the isPalindrome function below
    public static boolean isPalindrome(int x) {
        // Write your Java code here
        
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            int x = Integer.parseInt(line.trim());
            boolean res = isPalindrome(x);
            System.out.println(res ? "true" : "false");
        }
    }
}
"""

        # Array Sum Templates (JS & TS)
        array_sum_js = """function arraySum(arr) {
    // Write your code here to return the sum of the array
    
}

// Read inputs from stdin
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

        array_sum_ts = """function arraySum(arr: number[]): number {
    // Write your code here to return the sum of the array
    
}

// Read inputs from stdin
import * as readline from 'readline';
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

        # Rank Employees Templates (SQL)
        rank_employees_sql = """-- Write your SQL query here.
-- The 'employees' table is already defined for you.
-- SELECT name, salary FROM employees ...
"""

        # Create Blue Button Templates (HTML)
        blue_button_html = """<!-- Write your HTML5 and Tailwind CSS code here -->
<button id="" class="">
  
</button>
"""

        # Simple React Clicker Templates (React)
        react_clicker_react = """// Write your React component here. It must be named 'App'.
// Tailwind CSS is fully enabled.

function App() {
    // 1. Define counter state here
    
    return (
        <div className="p-8 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
            <div id="counter" className="text-2xl font-bold text-center">
                {/* 2. Display count here */}
                0
            </div>
            <button 
                id="increment" 
                // 3. Set click handler to increment
                onClick={() => {}}
                className="w-full py-2 bg-indigo-600 text-white rounded-md"
            >
                Increment
            </button>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
"""

        print("Seeding 'Two Sum' question...")
        q1 = Question(
            title="Two Sum",
            difficulty="Easy",
            statement="Find two numbers whose sum equals target. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            template_python=two_sum_python,
            template_java=two_sum_java
        )
        db.add(q1)
        db.commit()
        db.refresh(q1)

        print("Seeding testcases for 'Two Sum'...")
        visible_tc1 = TestCase(
            question_id=q1.id,
            input_data="2 7 11 15\n9",
            expected_output="0 1",
            is_hidden=False
        )
        hidden_tc1_1 = TestCase(
            question_id=q1.id,
            input_data="3 2 4\n6",
            expected_output="1 2",
            is_hidden=True
        )
        hidden_tc1_2 = TestCase(
            question_id=q1.id,
            input_data="3 3\n6",
            expected_output="0 1",
            is_hidden=True
        )
        hidden_tc1_3 = TestCase(
            question_id=q1.id,
            input_data="-1 -8 9 10\n1",
            expected_output="0 1",
            is_hidden=True
        )
        db.add_all([visible_tc1, hidden_tc1_1, hidden_tc1_2, hidden_tc1_3])
        db.commit()

        print("Seeding 'Palindrome Number' question...")
        q2 = Question(
            title="Palindrome Number",
            difficulty="Easy",
            statement="Given an integer x, return true if x is a palindrome, and false otherwise. Do not use string conversion if solving in languages where memory constraints apply.",
            template_python=palindrome_python,
            template_java=palindrome_java
        )
        db.add(q2)
        db.commit()
        db.refresh(q2)

        print("Seeding testcases for 'Palindrome Number'...")
        visible_tc2 = TestCase(
            question_id=q2.id,
            input_data="121",
            expected_output="true",
            is_hidden=False
        )
        hidden_tc2_1 = TestCase(
            question_id=q2.id,
            input_data="-121",
            expected_output="false",
            is_hidden=True
        )
        hidden_tc2_2 = TestCase(
            question_id=q2.id,
            input_data="10",
            expected_output="false",
            is_hidden=True
        )
        hidden_tc2_3 = TestCase(
            question_id=q2.id,
            input_data="12321",
            expected_output="true",
            is_hidden=True
        )
        db.add_all([visible_tc2, hidden_tc2_1, hidden_tc2_2, hidden_tc2_3])
        db.commit()

        print("Seeding 'Array Sum' question...")
        q3 = Question(
            title="Array Sum",
            difficulty="Easy",
            statement="Given an array of integers, return their sum.",
            template_javascript=array_sum_js,
            template_typescript=array_sum_ts
        )
        db.add(q3)
        db.commit()
        db.refresh(q3)

        print("Seeding testcases for 'Array Sum'...")
        visible_tc3 = TestCase(
            question_id=q3.id,
            input_data="1 2 3 4",
            expected_output="10",
            is_hidden=False
        )
        hidden_tc3_1 = TestCase(
            question_id=q3.id,
            input_data="-1 -2 3",
            expected_output="0",
            is_hidden=True
        )
        hidden_tc3_2 = TestCase(
            question_id=q3.id,
            input_data="100 200 300 400",
            expected_output="1000",
            is_hidden=True
        )
        db.add_all([visible_tc3, hidden_tc3_1, hidden_tc3_2])
        db.commit()

        print("Seeding 'Rank Employees' question...")
        q4 = Question(
            title="Rank Employees",
            difficulty="Medium",
            statement="Given an employees table, write a SQL query to select names and salaries of all employees earning more than 50000, ordered by salary descending.",
            template_sql=rank_employees_sql
        )
        db.add(q4)
        db.commit()
        db.refresh(q4)

        print("Seeding testcases for 'Rank Employees'...")
        sql_setup = """CREATE TABLE employees (id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1, 'Alice', 60000);
INSERT INTO employees VALUES (2, 'Bob', 45000);
INSERT INTO employees VALUES (3, 'Charlie', 80000);"""
        visible_tc4 = TestCase(
            question_id=q4.id,
            input_data=sql_setup,
            expected_output="Charlie|80000\nAlice|60000",
            is_hidden=False
        )
        
        sql_setup_hidden = """CREATE TABLE employees (id INT, name TEXT, salary INT);
INSERT INTO employees VALUES (1, 'Xavier', 30000);
INSERT INTO employees VALUES (2, 'Yolanda', 70000);
INSERT INTO employees VALUES (3, 'Zane', 95000);
INSERT INTO employees VALUES (4, 'Wade', 50001);"""
        hidden_tc4_1 = TestCase(
            question_id=q4.id,
            input_data=sql_setup_hidden,
            expected_output="Zane|95000\nYolanda|70000\nWade|50001",
            is_hidden=True
        )
        db.add_all([visible_tc4, hidden_tc4_1])
        db.commit()

        print("Seeding 'Create Blue Button' question...")
        html_grader = """import sys
import re
html = sys.stdin.read()

# Check button exists with id submit-btn
btn_match = re.search(r'id=["\\']submit-btn["\\']', html)
# Check classes exist
bg_match = 'bg-blue-600' in html
text_match = 'text-white' in html
content_match = 'Submit Form' in html

if btn_match and bg_match and text_match and content_match:
    print("validation PASSED")
else:
    print("validation FAILED: Make sure you use the correct classes, id, and text.")
"""
        q5 = Question(
            title="Create Blue Button",
            difficulty="Easy",
            statement="Create an HTML button with id 'submit-btn', containing the text 'Submit Form', styled with a blue background and white text. Use Tailwind CSS classes: `bg-blue-600`, `text-white`, `px-4`, `py-2`, `rounded`.",
            template_html=blue_button_html
        )
        db.add(q5)
        db.commit()
        db.refresh(q5)

        print("Seeding testcases for 'Create Blue Button'...")
        visible_tc5 = TestCase(
            question_id=q5.id,
            input_data=html_grader,
            expected_output="validation PASSED",
            is_hidden=False
        )
        db.add(visible_tc5)
        db.commit()

        print("Seeding 'Simple React Clicker' question...")
        react_grader = """import sys
code = sys.stdin.read()

# Verify state Hook is used or counter is rendered
state_match = 'useState' in code
click_handler_match = 'setCount' in code or 'count + 1' in code
render_match = 'createRoot' in code

if state_match and click_handler_match and render_match:
    print("validation PASSED")
else:
    print("validation FAILED: Verify you are using useState and calling the setter inside onClick.")
"""
        q6 = Question(
            title="Simple React Clicker",
            difficulty="Easy",
            statement="Create a React component named 'App' that maintains a counter initialized to 0. It should display the count inside an element with id 'counter' and have a button with id 'increment' that increments the count when clicked.",
            template_react=react_clicker_react
        )
        db.add(q6)
        db.commit()
        db.refresh(q6)

        print("Seeding testcases for 'Simple React Clicker'...")
        visible_tc6 = TestCase(
            question_id=q6.id,
            input_data=react_grader,
            expected_output="validation PASSED",
            is_hidden=False
        )
        db.add(visible_tc6)
        db.commit()

        print("Database seeded successfully with all language templates!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
