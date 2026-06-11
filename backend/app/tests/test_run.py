def test_run_endpoint_python(client, monkeypatch):
    # Force MockJudge0Service fallback by clearing JUDGE0_URL
    monkeypatch.setenv("JUDGE0_URL", "")
    response = client.post("/run", json={
        "language": "python",
        "code": "print('hello')",
        "input": ""
    })
    assert response.status_code == 200
    assert response.json()["status"] == "Accepted"
    assert response.json()["stdout"] == "hello\n"

def test_run_endpoint_invalid_language(client):
    response = client.post("/run", json={
        "language": "rust",
        "code": "fn main() {}",
        "input": ""
    })
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_LANGUAGE"
