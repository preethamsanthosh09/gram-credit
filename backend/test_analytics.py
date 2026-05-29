import os
import sys
from datetime import datetime, timezone, timedelta

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
TEST_DATABASE_URL = "sqlite:///./test_analytics.db"

# Remove test db if exists
if os.path.exists("./test_analytics.db"):
    try:
        os.remove("./test_analytics.db")
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

def test_loans_approvals_and_analytics():
    print("--- STARTING GRAMCREDIT APPROVALS & ANALYTICS TESTS ---")
    
    # 1. Seed Database with Users
    # - User 1 (Full KYC: 3 documents)
    # - User 2 (Partial KYC: 1 document)
    print("1. Seeding users and documents...")
    db = TestingSessionLocal()
    
    user1 = User(phone="7975200593", name="Ravi Kumar", role="farmer", district="Mandya", crop_type="Paddy", land_acres=4.0, shg_member=True)
    user2 = User(phone="9876543210", name="Suresh Patel", role="farmer", district="Raichur", crop_type="Cotton", land_acres=2.5, shg_member=False)
    db.add(user1)
    db.add(user2)
    db.commit()
    
    # User 1 gets 3 docs (Full KYC -> NOT pending)
    db.add(Document(user_id=user1.id, doc_type="aadhaar", extracted_data={}))
    db.add(Document(user_id=user1.id, doc_type="ration", extracted_data={}))
    db.add(Document(user_id=user1.id, doc_type="land", extracted_data={}))
    
    # User 2 gets 2 docs (Partial KYC -> still pending_kyc count since 2 < 3!)
    db.add(Document(user_id=user2.id, doc_type="aadhaar", extracted_data={}))
    db.add(Document(user_id=user2.id, doc_type="ration", extracted_data={}))
    db.commit()
    
    u1_id = user1.id
    u2_id = user2.id
    db.close()
    print(f"   [OK] Seeded users (User 1: {u1_id}, User 2: {u2_id}).")

    # 2. Test Apply for Loan (starts as "pending")
    print("2. Applying for Loan 1 (for User 1, Paddy, monthly, Rs. 12,000)...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": u1_id,
            "crop_type": "Paddy",
            "land_acres": 4.0,
            "shg_member": True,
            "amount": 12000.0,
            "repayment_mode": "monthly",
            "district": "Mandya"
        }
    )
    assert resp.status_code == 200
    loan1 = resp.json()
    assert loan1["status"] == "pending"
    l1_id = loan1["loan_id"]
    print(f"   [OK] Loan applied successfully with pending status. ID: {l1_id}")

    # 3. Test Apply for Loan 2 (for User 2, Cotton, harvest, Rs. 20,000)
    print("3. Applying for Loan 2 (for User 2, Cotton, harvest, Rs. 20,000)...")
    resp = client.post(
        "/api/loans/apply",
        json={
            "user_id": u2_id,
            "crop_type": "Cotton",
            "land_acres": 2.5,
            "shg_member": False,
            "amount": 20000.0,
            "repayment_mode": "harvest",
            "district": "Raichur"
        }
    )
    assert resp.status_code == 200
    loan2 = resp.json()
    assert loan2["status"] == "pending"
    l2_id = loan2["loan_id"]
    print(f"   [OK] Loan applied successfully with pending status. ID: {l2_id}")

    # 4. Test PATCH /api/loans/{loan_id}/approve
    print("4. Testing PATCH /api/loans/l1_id/approve...")
    resp = client.patch(f"/api/loans/{l1_id}/approve")
    assert resp.status_code == 200
    app_data = resp.json()
    assert app_data["loan_id"] == l1_id
    assert app_data["status"] == "approved"
    assert app_data["sms_sent"] is True
    print("   [OK] Loan 1 successfully approved and SMS notification printed.")

    # 5. Test PATCH /api/loans/{loan_id}/reject
    print("5. Testing PATCH /api/loans/l2_id/reject...")
    resp = client.patch(f"/api/loans/{l2_id}/reject", json={"reason": "Insufficient credit history."})
    assert resp.status_code == 200
    rej_data = resp.json()
    assert rej_data["loan_id"] == l2_id
    assert rej_data["status"] == "rejected"
    print("   [OK] Loan 2 successfully rejected and SMS sent.")

    # 6. Test GET /api/loans (List with Joined Farmer Name and status=approved filter)
    print("6. Testing GET /api/loans with filters and farmer name join...")
    resp = client.get("/api/loans", params={"status": "approved"})
    assert resp.status_code == 200
    loans_list = resp.json()
    assert len(loans_list) == 1
    assert loans_list[0]["id"] == l1_id
    assert loans_list[0]["farmer_name"] == "Ravi Kumar"
    assert loans_list[0]["district"] == "Mandya"
    print("   [OK] Loan list join query and dynamic filters verified.")

    # 7. Test GET /api/analytics/summary
    # Calculations:
    # - total_loans: 2
    # - approved: 1
    # - pending: 0 (since Loan 2 is rejected, wait, status of Loan 2 is "rejected", status of Loan 1 is "approved", so pending count is indeed 0!)
    # - total_disbursed: 12000.0 (Loan 1 is approved for 12,000)
    # - pending_kyc: 1 (User 2 has only 1 document, while User 1 has 3)
    # - approved_today: 1
    # - repayments_due_week: Loan 1 repayments are monthly. Repayment month 0 due date is 30 days out, so due date > today + 7 days.
    #   Let's check repayments_due_week = 0.
    # Let's seed a repayment that is due tomorrow (within next 7 days) to verify the week logic counts it perfectly!
    print("7. Seeding a pending repayment due tomorrow...")
    db = TestingSessionLocal()
    rep_due = Repayment(
        loan_id=l1_id,
        month_number=99,
        amount=500.0,
        status="pending",
        due_date=datetime.now(timezone.utc) + timedelta(days=1)
    )
    db.add(rep_due)
    db.commit()
    db.close()
    
    print("   Fetching GET /api/analytics/summary...")
    resp = client.get("/api/analytics/summary")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_loans"] == 2
    assert summary["approved"] == 1
    assert summary["pending"] == 0
    assert summary["total_disbursed"] == 12000.0
    assert summary["pending_kyc"] == 1  # Suresh Patel
    assert summary["approved_today"] == 1
    assert summary["repayments_due_week"] == 1  # The one we just seeded!
    print("   [OK] Summary dashboard metrics calculated successfully.")

    # 8. Test GET /api/analytics/monthly
    print("8. Fetching GET /api/analytics/monthly...")
    resp = client.get("/api/analytics/monthly")
    assert resp.status_code == 200
    monthly = resp.json()
    assert len(monthly) == 6
    # Last month (current month) should have 2 loans
    assert monthly[-1]["loans"] == 2
    print(f"   [OK] 6 months loan trend matches. Current month count: {monthly[-1]['loans']}")

    print("\n--- ALL APPROVALS & ANALYTICS TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_loans_approvals_and_analytics()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_analytics.db"):
            try:
                os.remove("./test_analytics.db")
            except Exception:
                pass
