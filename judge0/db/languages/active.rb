@languages ||= []
@languages +=
[
  {
    id: 43,
    name: "Plain Text",
    is_archived: false,
    source_file: "text.txt",
    run_cmd: "/bin/cat text.txt"
  },
  {
    id: 63,
    name: "JavaScript (Node.js 12.14.0)",
    is_archived: false,
    source_file: "script.js",
    run_cmd: "/usr/bin/node script.js"
  },
  {
    id: 71,
    name: "Python (3.8.1)",
    is_archived: false,
    source_file: "script.py",
    run_cmd: "/usr/bin/python3 script.py"
  },
  {
    id: 82,
    name: "SQL (SQLite 3.27.2)",
    is_archived: false,
    source_file: "script.sql",
    run_cmd: "/bin/cat script.sql | /usr/bin/sqlite3 db.sqlite"
  }
]