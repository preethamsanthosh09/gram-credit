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
from services.eligibility import calculate_score

# 1. Programmatic tests of the scoring engine
def test_scoring_engine():
    print("--- 1. Testing Scoring Engine Logic directly ---")
    
    # Scenario A: Premium Farmer
    # docs: 3 (+30), crop: paddy (+20), land: 4 acres (4*8=32, capped at 25), shg: True (+20), history: 3 (+15), penalty: 1 loan (-8)
    # Expected: 30 + 20 + 25 + 20 + 15 - 8 = 102
    res_a = calculate_score(
        crop="Paddy",
        land_acres=4.0,
        shg_member=True,
        docs_count=3,
        existing_loans=1,
        district="Raichur",
        repayment_history=3
    )
    assert res_a["score"] == 102.0
    assert res_a["tier"] == "Premium"
    assert res_a["approved"] is True
    assert res_a["max_amount"] == 150000
    assert res_a["interest_rate"] == 10
    assert res_a["weather_risk"] == "high"  # Raichur
    print("   [OK] Scenario A: Premium Farmer score = 102.0 (correct).")

    # Scenario B: Standard Farmer
    # docs: 2 (+20), crop: wheat (+16), land: 2 acres (16), shg: False (0), history: 2 (+10), penalty: 0 loans (0)
    # Expected: 20 + 16 + 16 + 0 + 10 - 0 = 62 -> Wait, 62 is "Basic"!
    # Let's adjust fields to make it 75 (Standard):
    # docs: 2 (+20), crop: sugarcane (+20), land: 2.5 acres (20), shg: True (+20), history: 0 (0), penalty: 1 loan (-8)
    # Expected: 20 + 20 + 20 + 20 + 0 - 8 = 72 (Standard)
    res_b = calculate_score(
        crop="Sugarcane",
        land_acres=2.5,
        shg_member=True,
        docs_count=2,
        existing_loans=1,
        district="Mandya",
        repayment_history=0
    )
    assert res_b["score"] == 72.0
    assert res_b["tier"] == "Standard"
    assert res_b["approved"] is True
    assert res_b["max_amount"] == 75000
    assert res_b["interest_rate"] == 12
    assert res_b["weather_risk"] == "moderate"  # Mandya
    print("   [OK] Scenario B: Standard Farmer score = 72.0 (correct).")

    # Scenario C: Rejected Farmer
    # docs: 1 (+10), crop: maize (+14), land: 0.5 acres (4), shg: False (0), history: 0 (0), penalty: 3 loans (-24)
    # Expected: 10 + 14 + 4 + 0 + 0 - 24 = 4.0 (Rejected)
    res_c = calculate_score(
        crop="Maize",
        land_acres=0.5,
        shg_member=False,
        docs_count=1,
        existing_loans=3,
        district="Belgaum",
        repayment_history=0
    )
    assert res_c["score"] == 4.0
    assert res_c["tier"] == "Rejected"
    assert res_c["approved"] is False
    assert res_c["max_amount"] == 0
    assert res_c["interest_rate"] == 0
    assert res_c["weather_risk"] == "low"  # Belgaum
    print("   [OK] Scenario C: Rejected Farmer score = 4.0 (correct).")

# 2. API endpoint testing
# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_loans.db"

# Remove test db if exists
if os.path.exists("./test_loans.db"):
    try:
        os.remove("./test_loans.db")
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

def test_loans_api():
    print("\n--- 2. Testing Loan Eligibility Router Endpoints ---")
    
    # Create test user in DB
    db = TestingSessionLocal()
    user = User(
        phone="7975200593",
        name="Preetham Farmer",
        role="farmer",
        district="Raichur",
        crop_type="Paddy",
        land_acres=3.5,
        shg_member=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    
    # Upload 2 documents for this user
    doc1 = Document(user_id=user_id, doc_type="aadhaar", extracted_data={})
    doc2 = Document(user_id=user_id, doc_type="ration", extracted_data={})
    db.add(doc1)
    db.add(doc2)
    db.commit()
    db.close()
    
    print(f"   [OK] User created in DB with ID: {user_id} and 2 documents.")

    # Call endpoint `/api/loans/eligibility`
    # docs_count: 2 (+20)
    # crop: paddy (+20)
    # land: 3.5 acres (3.5 * 8 = 28, capped at 25)
    # shg: True (+20)
    # repayment_history input: 2 (+10)
    # existing_loans input: 0 (0)
    # Expected total score: 20 + 20 + 25 + 20 + 10 - 0 = 95 (Premium!)
    payload = {
        "user_id": user_id,
        "existing_loans": 0,
        "repayment_history": 2
    }
    resp = client.post("/api/loans/eligibility", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["score"] == 95.0
    assert data["tier"] == "Premium"
    assert data["approved"] is True
    assert data["max_amount"] == 150000
    assert data["interest_rate"] == 10
    assert data["weather_risk"] == "high"  # Raichur
    assert data["breakdown"]["docs"] == 20
    assert data["breakdown"]["crop"] == 20
    assert data["breakdown"]["land"] == 25
    assert data["breakdown"]["shg"] == 20
    assert data["breakdown"]["history"] == 10
    assert data["breakdown"]["penalty"] == 0
    print("   [OK] Premium eligibility calculation matched expected JSON.")

    # Test error user not found
    resp = client.post("/api/loans/eligibility", json={"user_id": 99999})
    assert resp.status_code == 404
    print("   [OK] Non-existent user correctly returned 404.")

    print("\n--- ALL LOAN SCORING TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_scoring_engine()
        test_loans_api()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_loans.db"):
            try:
                os.remove("./test_loans.db")
            except Exception:
                pass
