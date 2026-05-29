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
from models.loan import Loan
from models.repayment import Repayment

# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_apply.db"

# Remove test db if exists
if os.path.exists("./test_apply.db"):
    try:
        os.remove("./test_apply.db")
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

def test_loan_scheduling_flow():
    print("--- STARTING GRAMCREDIT LOAN APPLICATION & SCHEDULING TESTS ---")
    
    # 1. Create Test Users
    # A. Approved Farmer: has high crop score, high land, shg membership, and documents
    # B. Rejected Farmer: has low land, no shg, low crop score, and 0 documents
    print("1. Creating test users and documents in DB...")
    db = TestingSessionLocal()
    
    farmer_approved = User(
        phone="7975200593",
        name="Eligible Farmer",
        role="farmer",
        district="Mandya",
        crop_type="Paddy",
        land_acres=4.0,
        shg_member=True
    )
    db.add(farmer_approved)
    
    farmer_rejected = User(
        phone="9876543210",
        name="Ineligible Farmer",
        role="farmer",
        district="Raichur",
        crop_type="Other",
        land_acres=0.1,
        shg_member=False
    )
    db.add(farmer_rejected)
    db.commit()
    
    # Upload 3 documents for Approved Farmer (giving them max 30 doc score)
    db.add(Document(user_id=farmer_approved.id, doc_type="aadhaar", extracted_data={}))
    db.add(Document(user_id=farmer_approved.id, doc_type="ration", extracted_data={}))
    db.add(Document(user_id=farmer_approved.id, doc_type="land", extracted_data={}))
    db.commit()
    
    approved_id = farmer_approved.id
    rejected_id = farmer_rejected.id
    db.close()
    
    print(f"   [OK] Approved Farmer ID: {approved_id}, Rejected Farmer ID: {rejected_id}")

    # 2. Test Rejection Flow (score < 50)
    # Docs: 0 (0), crop: Other (0), land: 0.1 * 8 = 0.8, shg: False (0), loans: 0 (0) -> Score = 0.8
    print("2. Testing loan application rejection for low score...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": rejected_id,
            "crop_type": "Other",
            "land_acres": 0.1,
            "shg_member": False,
            "amount": 20000,
            "repayment_mode": "monthly",
            "district": "Raichur"
        }
    )
    assert resp.status_code == 400
    assert "Not eligible." in resp.json()["detail"]
    print("   [OK] Rejection successful.")

    # 3. Test Apply Loan: MONTHLY Mode (amount: 12000)
    # Expected: 12 equal EMIs of 1000.00
    print("3. Testing monthly schedule generation...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": approved_id,
            "crop_type": "Paddy",
            "land_acres": 4.0,
            "shg_member": True,
            "amount": 12000.0,
            "repayment_mode": "monthly",
            "district": "Mandya"
        }
    )
    assert resp.status_code == 200
    loan_monthly = resp.json()
    assert loan_monthly["status"] == "approved"
    assert loan_monthly["score"] >= 50
    assert len(loan_monthly["repayment_schedule"]) == 12
    for m in range(12):
        assert loan_monthly["repayment_schedule"][m]["month_number"] == m
        assert loan_monthly["repayment_schedule"][m]["amount"] == 1000.0
        assert loan_monthly["repayment_schedule"][m]["status"] == "pending"
    monthly_loan_id = loan_monthly["loan_id"]
    print(f"   [OK] Monthly EMI generated correctly for 12 months. Loan ID: {monthly_loan_id}")

    # 4. Test Apply Loan: HARVEST Mode (amount: 10000, Crop: Paddy)
    # Expected: Paddy harvest in months [9, 10] -> EMI = 10000 / 2 = 5000 in months 9, 10. Others 0.
    print("4. Testing harvest schedule generation (Paddy: months [9, 10])...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": approved_id,
            "crop_type": "Paddy",
            "land_acres": 4.0,
            "shg_member": True,
            "amount": 10000.0,
            "repayment_mode": "harvest",
            "district": "Mandya"
        }
    )
    assert resp.status_code == 200
    loan_harvest = resp.json()
    schedule = loan_harvest["repayment_schedule"]
    assert len(schedule) == 12
    for m in range(12):
        if m in [9, 10]:
            assert schedule[m]["amount"] == 5000.0
        else:
            assert schedule[m]["amount"] == 0.0
    print("   [OK] Harvest schedule correct (INR 5,000 in harvest months, INR 0 elsewhere).")

    # 5. Test Apply Loan: YEARLY Mode (amount: 15000, Crop: Maize)
    # Expected: Maize harvest [8, 9] -> Max is 9. Only month 9 gets 15000, others 0.
    print("5. Testing yearly schedule generation (Maize: final month 9)...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": approved_id,
            "crop_type": "Maize",
            "land_acres": 4.0,
            "shg_member": True,
            "amount": 15000.0,
            "repayment_mode": "yearly",
            "district": "Mandya"
        }
    )
    assert resp.status_code == 200
    loan_yearly = resp.json()
    schedule = loan_yearly["repayment_schedule"]
    assert len(schedule) == 12
    for m in range(12):
        if m == 9:
            assert schedule[m]["amount"] == 15000.0
        else:
            assert schedule[m]["amount"] == 0.0
    print("   [OK] Yearly schedule correct (INR 15,000 in final harvest month 9, INR 0 elsewhere).")


    # 6. Test GET /api/loans/{loan_id}
    print("6. Testing GET /api/loans/{loan_id} for details + schedule join...")
    resp = client.get(f"/api/loans/{monthly_loan_id}")
    assert resp.status_code == 200
    loan_detail = resp.json()
    assert loan_detail["id"] == monthly_loan_id
    assert loan_detail["amount"] == 12000.0
    assert len(loan_detail["repayments"]) == 12
    assert loan_detail["repayments"][0]["amount"] == 1000.0
    print("   [OK] Retrieved active loan and verified joined repayments schedule.")

    print("\n--- ALL LOAN SCHEDULING TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_loan_scheduling_flow()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_apply.db"):
            try:
                os.remove("./test_apply.db")
            except Exception:
                pass
