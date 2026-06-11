def test_submit_endpoint_accepted(client, monkeypatch):
    # Force MockJudge0Service fallback
    monkeypatch.setenv("JUDGE0_URL", "")
    
    # 1. Create a question
    client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers"
    })
    
    # 2. Create a testcase (the Mock service returns "hello\n" for print('hello'))
    client.post("/questions/1/testcases", json={
        "input_data": "2 7 11 15\n9",
        "expected_output": "hello\n",
        "is_hidden": False
    })
    
    # 3. Submit code
    response = client.post("/submit", json={
        "question_id": 1,
        "student_id": 100,
        "language": "python",
        "code": "print('hello')"
    })
    assert response.status_code == 201
    assert response.json()["verdict"] == "Accepted"
    assert response.json()["passed"] == 1
    assert response.json()["total"] == 1
    
    # 4. Check history
    response = client.get("/submissions")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["verdict"] == "Accepted"
    
    # Check student submissions
    response = client.get("/students/100/submissions")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Check single submission
    response = client.get("/submissions/1")
    assert response.status_code == 200
    assert response.json()["verdict"] == "Accepted"

def test_submit_endpoint_wrong_answer(client, monkeypatch):
    monkeypatch.setenv("JUDGE0_URL", "")
    client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers"
    })
    client.post("/questions/1/testcases", json={
        "input_data": "2 7\n9",
        "expected_output": "0 1",
        "is_hidden": False
    })
    response = client.post("/submit", json={
        "question_id": 1,
        "student_id": 100,
        "language": "python",
        "code": "print('wrong')"
    })
    assert response.status_code == 201
    assert response.json()["verdict"] == "Wrong Answer"
    assert response.json()["passed"] == 0
    assert response.json()["total"] == 1
