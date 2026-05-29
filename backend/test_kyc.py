import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models.user import User
from models.document import Document

# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_kyc.db"

# Remove test db if exists
if os.path.exists("./test_kyc.db"):
    try:
        os.remove("./test_kyc.db")
    except Exception:
        pass

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create all tables in the test database
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_kyc_flow():
    print("--- STARTING GRAMCREDIT KYC ROUTER TESTS ---")
    
    # 1. Create a Test User
    print("1. Creating test user...")
    db = TestingSessionLocal()
    user = User(phone="7975200593", name="Test Farmer", role="farmer")
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()
    print(f"   [OK] Test user created with ID: {user_id}")

    # 2. Test verify-all with 0 documents
    print("2. Testing verify-all with 0 documents...")
    resp = client.post("/api/kyc/verify-all", json={"user_id": user_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is False
    assert data["score_bonus"] == 0
    assert set(data["missing"]) == {"aadhaar", "ration", "land"}
    print("   [OK] Zero documents score bonus is 0.")

    # 3. Test Scan Aadhaar (Mock fallback)
    print("3. Scanning Aadhaar Document...")
    resp = client.post(
        "/api/kyc/scan",
        json={
            "image_base64": "data:image/png;base64,dGVzdGFhZGhhYXI=",
            "doc_type": "aadhaar",
            "user_id": user_id
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["doc_type"] == "aadhaar"
    assert data["extracted_data"]["name"] == "Ravi Kumar"
    assert data["extracted_data"]["dob"] == "15/06/1985"
    assert data["extracted_data"]["aadhaar_last4"] == "1234"
    print("   [OK] Aadhaar scanned successfully (with fallback).")

    # 4. Test verify-all with 1 document
    print("4. Testing verify-all with 1 document...")
    resp = client.post("/api/kyc/verify-all", json={"user_id": user_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is False
    assert data["score_bonus"] == 5
    assert set(data["missing"]) == {"ration", "land"}
    print("   [OK] One document score bonus is 5.")

    # 5. Test Scan Ration (Mock fallback)
    print("5. Scanning Ration Card Document...")
    resp = client.post(
        "/api/kyc/scan",
        json={
            "image_base64": "data:image/png;base64,dGVzdHJhdGlvbg==",
            "doc_type": "ration",
            "user_id": user_id
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["doc_type"] == "ration"
    assert data["extracted_data"]["ration_number"] == "KA-MN-12345"
    print("   [OK] Ration card scanned successfully.")

    # 6. Test verify-all with 2 documents
    print("6. Testing verify-all with 2 documents...")
    resp = client.post("/api/kyc/verify-all", json={"user_id": user_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is False
    assert data["score_bonus"] == 15
    assert data["missing"] == ["land"]
    print("   [OK] Two documents score bonus is 15.")

    # 7. Test Scan Land (Mock fallback)
    print("7. Scanning Land Records Document...")
    resp = client.post(
        "/api/kyc/scan",
        json={
            "image_base64": "data:image/png;base64,dGVzdGxhbmQ=",
            "doc_type": "land",
            "user_id": user_id
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["doc_type"] == "land"
    assert data["extracted_data"]["survey_number"] == "KA-MND-045"
    assert data["extracted_data"]["area_acres"] == "2.0"
    print("   [OK] Land record scanned successfully.")

    # 8. Test verify-all with 3 documents
    print("8. Testing verify-all with all 3 documents...")
    resp = client.post("/api/kyc/verify-all", json={"user_id": user_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verified"] is True
    assert data["score_bonus"] == 25
    assert data["missing"] == []
    print("   [OK] All three documents score bonus is 25 and status is verified.")

    # 9. Test GET /api/kyc/documents/{user_id}
    print("9. Fetching all user documents...")
    resp = client.get(f"/api/kyc/documents/{user_id}")
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs) == 3
    doc_types = {doc["doc_type"] for doc in docs}
    assert doc_types == {"aadhaar", "ration", "land"}
    print("   [OK] Retrieved list of all 3 documents.")

    print("\n--- ALL KYC TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_kyc_flow()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_kyc.db"):
            try:
                os.remove("./test_kyc.db")
            except Exception:
                pass
