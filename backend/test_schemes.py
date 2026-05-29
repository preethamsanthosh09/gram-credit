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

# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_schemes.db"

# Remove test db if exists
if os.path.exists("./test_schemes.db"):
    try:
        os.remove("./test_schemes.db")
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

def test_schemes_and_credit_scoring():
    print("--- STARTING GRAMCREDIT SCHEMES & CREDIT SCORING TESTS ---")
    
    # 1. Seed Database with Users
    # - User 1 (Ravi Kumar: Paddy, 4 acres, SHG True, default score=70)
    # - User 2 (Suresh Patel: Cotton, 1.5 acres, SHG False, default score=50)
    print("1. Seeding test users...")
    db = TestingSessionLocal()
    
    u1 = User(id=1, phone="7975200593", name="Ravi Kumar", role="farmer", district="Mandya", crop_type="Paddy", land_acres=4.0, shg_member=True, credit_score=70)
    u2 = User(id=2, phone="9876543210", name="Suresh Patel", role="farmer", district="Raichur", crop_type="Cotton", land_acres=1.5, shg_member=False, credit_score=45)
    db.add(u1)
    db.add(u2)
    db.commit()
    db.close()
    print("   [OK] Test users seeded successfully.")

    # 2. Test GET /api/schemes
    print("2. Fetching all government schemes...")
    resp = client.get("/api/schemes")
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) == 6
    assert schemes[0]["name"] == "PM-Kisan"
    assert schemes[5]["name"] == "eNAM"
    print("   [OK] Verified 6 master government schemes returned.")

    # 3. Test GET /api/schemes/eligible for User 1
    # User 1: Paddy, 4.0 acres -> Eligible for eNAM, PMFBY, KCC, Soil, Maandhan (5/6).
    # Ineligible for PM-Kisan (4 acres >= 2).
    print("3. Testing schemes eligibility for User 1 (Paddy, 4 acres)...")
    resp = client.get("/api/schemes/eligible", params={"user_id": 1})
    assert resp.status_code == 200
    data = resp.json()
    assert data["eligible_count"] == 5
    for s in data["schemes"]:
        if s["name"] == "PM-Kisan":
            assert s["eligible"] is False
        else:
            assert s["eligible"] is True
    print("   [OK] User 1 eligible for 5 out of 6 schemes (correct).")

    # 4. Test GET /api/schemes/eligible for User 2
    # User 2: Cotton, 1.5 acres -> Eligible for PM-Kisan (< 2 acres), PMFBY, KCC, Soil, Maandhan (5/6).
    # Ineligible for eNAM (Cotton is not Paddy/Wheat/Maize).
    print("4. Testing schemes eligibility for User 2 (Cotton, 1.5 acres)...")
    resp = client.get("/api/schemes/eligible", params={"user_id": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["eligible_count"] == 5
    for s in data["schemes"]:
        if s["name"] == "eNAM":
            assert s["eligible"] is False
        else:
            assert s["eligible"] is True
    print("   [OK] User 2 eligible for 5 out of 6 schemes (correct).")

    # 5. Test GET /api/auth/credit-score?user_id=1
    print("5. Fetching credit score information for User 1...")
    resp = client.get("/api/auth/credit-score", params={"user_id": 1})
    assert resp.status_code == 200
    cs = resp.json()
    assert cs["score"] == 70
    assert cs["tier"] == "Standard"
    assert len(cs["history"]) == 4
    assert cs["history"][-1]["score"] == 70
    assert len(cs["how_to_improve"]) == 3
    print("   [OK] Credit score dashboard payload structure matched perfectly.")

    # 6. Test POST /api/auth/credit-score/update (repayment_made: +10)
    print("6. Updating score for User 1 (action: repayment_made, +10)...")
    resp = client.post("/api/auth/credit-score/update", json={"user_id": 1, "action": "repayment_made"})
    assert resp.status_code == 200
    update_data = resp.json()
    assert update_data["new_score"] == 80
    print("   [OK] Repayment action updated credit score to 80 successfully.")

    # 7. Test POST /api/auth/credit-score/update (shg_joined: +20)
    print("7. Updating score for User 1 (action: shg_joined, +20)...")
    resp = client.post("/api/auth/credit-score/update", json={"user_id": 1, "action": "shg_joined"})
    assert resp.status_code == 200
    update_data = resp.json()
    assert update_data["new_score"] == 100  # Capped at 100
    print("   [OK] SHG joining updated score and capped at 100 successfully.")

    # Recheck GET /api/auth/credit-score returns the updated Premium tier
    resp = client.get("/api/auth/credit-score", params={"user_id": 1})
    cs = resp.json()
    assert cs["score"] == 100
    assert cs["tier"] == "Premium"
    print("   [OK] Re-verified credit score dashboard updates to Premium tier.")

    print("\n--- ALL SCHEMES & CREDIT SCORING TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_schemes_and_credit_scoring()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_schemes.db"):
            try:
                os.remove("./test_schemes.db")
            except Exception:
                pass
