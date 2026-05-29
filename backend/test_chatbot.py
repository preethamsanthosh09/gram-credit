import os
import sys

# Ensure terminal can print Indic/Unicode scripts on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_chatbot_flow():
    print("--- STARTING GRAMCREDIT CHATBOT ROUTER TESTS ---")
    
    # Test 1: Interest Rate query (English)
    print("1. Sending interest rate query in English...")
    resp = client.post(
        "/api/chatbot/message",
        json={"message": "What is the interest rate?", "language": "en"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    print(f"   [OK] Received response: {data['reply'][:50]}...")

    # Test 2: Repayment schedule query (Hindi)
    print("2. Sending repayment query in Hindi...")
    resp = client.post(
        "/api/chatbot/message",
        json={"message": "भुगतान कब करना है?", "language": "hi"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    print(f"   [OK] Received response: {data['reply'][:50]}...")

    # Test 3: Schemes query (Kannada)
    print("3. Sending government scheme query in Kannada...")
    resp = client.post(
        "/api/chatbot/message",
        json={"message": "ಯೋಜನೆಗಳು ಯಾವುವು?", "language": "kn"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    print(f"   [OK] Received response: {data['reply'][:50]}...")

    # Test 4: Default generic greeting
    print("4. Sending generic greeting...")
    resp = client.post(
        "/api/chatbot/message",
        json={"message": "Hello!", "language": "en"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    print(f"   [OK] Received response: {data['reply'][:50]}...")

    print("\n--- ALL CHATBOT TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_chatbot_flow()
