import os
import requests
import time

def test_judge0_integration():
    url = os.getenv("JUDGE0_URL", "http://localhost:2358")
    print(f"\nConnecting to Judge0 at: {url}")
    
    # Python
    py_payload = {
        "source_code": 'print("Hello")',
        "language_id": 71
    }
    
    # Java
    java_payload = {
        "source_code": 'public class Main {\npublic static void main(String[] args) {\nSystem.out.println("Hello");\n}\n}',
        "language_id": 62
    }
    
    languages = [
        ("Python", py_payload, "Hello\n"),
        ("Java", java_payload, "Hello\n")
    ]
    
    for name, payload, expected in languages:
        print(f"Submitting {name} code...")
        post_response = requests.post(f"{url}/submissions?base64_encoded=false", json=payload)
        assert post_response.status_code == 201
        token = post_response.json()["token"]
        
        # Poll
        data = None
        for _ in range(60):
            get_response = requests.get(f"{url}/submissions/{token}?base64_encoded=false")
            assert get_response.status_code == 200
            data = get_response.json()
            status_id = data["status"]["id"]
            if status_id not in [1, 2]:
                break
            time.sleep(0.5)
            
        print(f"{name} status: {data['status']['description']}")
        print(f"{name} stdout: {repr(data.get('stdout'))}")
        print(f"{name} stderr: {repr(data.get('stderr'))}")
        print(f"{name} compile_output: {repr(data.get('compile_output'))}")
        
        assert data["status"]["id"] == 3, f"{name} failed: {data['status']['description']}"
        assert data["stdout"].strip() == "Hello", f"{name} output mismatch"
        print(f"{name} validation PASSED!")

if __name__ == "__main__":
    test_judge0_integration()
