def test_create_question(client):
    response = client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers whose sum equals target"
    })
    assert response.status_code == 201
    assert "id" in response.json()
    assert response.json()["id"] == 1

def test_read_questions(client):
    response = client.get("/questions")
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers whose sum equals target"
    })
    
    response = client.get("/questions")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Two Sum"

def test_read_question_by_id(client):
    client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers"
    })
    response = client.get("/questions/1")
    assert response.status_code == 200
    assert response.json()["title"] == "Two Sum"
    
    # Non-existent
    response = client.get("/questions/999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "QUESTION_NOT_FOUND"

def test_delete_question(client):
    client.post("/questions", json={
        "title": "Two Sum",
        "difficulty": "Easy",
        "statement": "Find two numbers"
    })
    response = client.delete("/questions/1")
    assert response.status_code == 204
    
    response = client.get("/questions/1")
    assert response.status_code == 404
