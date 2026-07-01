def test_create_testcase(client):
    client.post("/questions", json={
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "Easy",
        "description": "Find two numbers"
    })
    
    response = client.post("/questions/1/testcases", json={
        "input": "2 7 11 15\n9",
        "expected_output": "0 1",
        "is_hidden": False
    })
    assert response.status_code == 201
    assert response.json()["question_id"] == 1
    assert response.json()["input"] == "2 7 11 15\n9"
    assert response.json()["expected_output"] == "0 1"

def test_read_testcases_for_question(client):
    client.post("/questions", json={
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "Easy",
        "description": "Find two numbers"
    })
    
    client.post("/questions/1/testcases", json={
        "input": "2 7\n9",
        "expected_output": "0 1",
        "is_hidden": False
    })
    
    response = client.get("/questions/1/testcases")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["expected_output"] == "0 1"

def test_delete_testcase(client):
    client.post("/questions", json={
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "Easy",
        "description": "Find two numbers"
    })
    client.post("/questions/1/testcases", json={
        "input": "2 7\n9",
        "expected_output": "0 1",
        "is_hidden": False
    })
    
    response = client.delete("/testcases/1")
    assert response.status_code == 204
    
    response = client.get("/questions/1/testcases")
    assert response.status_code == 200
    assert len(response.json()) == 0
