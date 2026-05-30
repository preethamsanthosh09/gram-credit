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

# Use an in-memory SQLite database or a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_gramcredit.db"

# Remove test db if exists
if os.path.exists("./test_gramcredit.db"):
    try:
        os.remove("./test_gramcredit.db")
    except Exception:
        pass

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the database dependency
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

def test_backend_auth():
    print("--- STARTING GRAMCREDIT BACKEND AUTH TESTS ---")
    
    # 1. Test Mock Login with incorrect phone
    print("1. Testing mock login with incorrect phone...")
    resp = client.post("/api/auth/mock-login", json={"phone": "9876543210"})
    assert resp.status_code == 400
    assert "Mock login is restricted" in resp.json()["detail"]
    print("   [OK] Correctly restricted.")

    # 2. Test Mock Login with correct phone
    print("2. Testing mock login with correct phone...")
    resp = client.post("/api/auth/mock-login", json={"phone": "7975200593"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["phone"] == "7975200593"
    assert data["user"]["name"] == "Demo Farmer"
    assert data["user"]["role"] == "farmer"
    token = data["access_token"]
    print("   [OK] Mock login successful. Received Token.")

    # 3. Test GET /api/auth/me without authorization header
    print("3. Testing GET /api/auth/me without token...")
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
    print("   [OK] Correctly blocked unauthorized access.")

    # 4. Test GET /api/auth/me with invalid token
    print("4. Testing GET /api/auth/me with invalid token...")
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtokenhere"})
    assert resp.status_code == 401
    print("   [OK] Correctly blocked invalid token.")

    # 5. Test GET /api/auth/me with VALID token
    print("5. Testing GET /api/auth/me with valid token...")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    user_data = resp.json()
    assert user_data["phone"] == "7975200593"
    assert user_data["name"] == "Demo Farmer"
    assert user_data["role"] == "farmer"
    assert "created_at" in user_data
    print(f"   [OK] Fetched current user successfully: {user_data['name']}")

    # 6. Test PATCH /api/auth/profile
    print("6. Testing PATCH /api/auth/profile...")
    profile_payload = {
        "name": "Preetham Santhosh",
        "district": "Bangalore Rural",
        "crop_type": "Ragi",
        "land_acres": 4.5,
        "shg_member": True
    }
    resp = client.patch(
        "/api/auth/profile",
        json=profile_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    updated_user = resp.json()
    assert updated_user["name"] == "Preetham Santhosh"
    assert updated_user["district"] == "Bangalore Rural"
    assert updated_user["crop_type"] == "Ragi"
    assert updated_user["land_acres"] == 4.5
    assert updated_user["shg_member"] is True
    print("   [OK] Profile updated successfully.")

    # 7. Verify GET /api/auth/me returns the updated profile
    print("7. Verifying GET /api/auth/me returns updated fields...")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    verified_user = resp.json()
    assert verified_user["district"] == "Bangalore Rural"
    assert verified_user["crop_type"] == "Ragi"
    print("   [OK] Verified persistent updates.")

    # 8. Test Firebase Login for a NEW user
    print("8. Testing Firebase login for a new user...")
    fb_payload = {
        "firebase_uid": "fb_uid_12345",
        "phone": "9988776655",
        "name": "Firebase User"
    }
    resp = client.post("/api/auth/firebase-login", json=fb_payload)
    assert resp.status_code == 200
    fb_data = resp.json()
    assert fb_data["user"]["phone"] == "9988776655"
    assert fb_data["user"]["name"] == "Firebase User"
    fb_token = fb_data["access_token"]
    print("   [OK] Firebase login created a new user successfully.")

    # 9. Test GET /api/auth/me for the firebase user
    print("9. Fetching profile for firebase user...")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {fb_token}"})
    assert resp.status_code == 200
    fb_user = resp.json()
    assert fb_user["phone"] == "9988776655"
    assert fb_user["name"] == "Firebase User"
    print("   [OK] Firebase user profile fetched correctly.")

    # 10. Test Firebase Login account linking
    # We will log in with Firebase using the demo phone number "7975200593"
    # This phone number is already registered in our DB (created during mock-login)
    # But does not currently have a firebase_uid set. It should link!
    print("10. Testing Firebase login account linking (linking to existing phone number)...")
    link_payload = {
        "firebase_uid": "fb_demo_linked_uid",
        "phone": "7975200593",
        "name": "Preetham Santhosh Linked"
    }
    resp = client.post("/api/auth/firebase-login", json=link_payload)
    assert resp.status_code == 200
    linked_data = resp.json()
    # The user ID should remain the same as the initial user's ID
    assert linked_data["user"]["id"] == user_data["id"]
    assert linked_data["user"]["phone"] == "7975200593"
    
    # Query database directly to check if firebase_uid was linked
    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.phone == "7975200593").first()
    assert db_user.firebase_uid == "fb_demo_linked_uid"
    # Name should be updated if it was previously empty or we want to overwrite it
    db.close()
    print("   [OK] Account linking successfully matched by phone and saved firebase_uid.")
    
    # 11. Test GET /api/auth/trust-score
    print("11. Testing GET /api/auth/trust-score...")
    resp = client.get(f"/api/auth/trust-score?user_id={user_data['id']}")
    assert resp.status_code == 200
    trust_data = resp.json()
    assert trust_data["trust_score"] == 35
    assert trust_data["trust_tier"] == "Community Trusted"
    assert "peer_vouches" in trust_data["components"]
    print("   [OK] Trust score fetched successfully.")

    print("\n--- ALL TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_backend_auth()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_gramcredit.db"):
            try:
                os.remove("./test_gramcredit.db")
            except Exception:
                pass
