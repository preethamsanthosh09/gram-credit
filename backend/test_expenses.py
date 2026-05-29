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
from models.expense import Expense

# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_expenses.db"

# Remove test db if exists
if os.path.exists("./test_expenses.db"):
    try:
        os.remove("./test_expenses.db")
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

def test_expenses_management():
    print("--- STARTING GRAMCREDIT EXPENSES MANAGEMENT TESTS ---")
    
    # 1. Verify Startup Seeding
    # Run seeder manually on the test DB
    print("1. Checking and triggering manual startup seed for test DB...")
    db = TestingSessionLocal()
    user1 = db.query(User).filter(User.id == 1).first()
    if not user1:
        user1 = User(id=1, phone="7975200593", name="Ravi Kumar", role="farmer", district="Mandya", crop_type="Paddy", land_acres=4.0, shg_member=True)
        db.add(user1)
        db.commit()
    
    # Create user 2 for unauthorized delete check
    user2 = User(id=2, phone="9876543210", name="Ineligible Farmer", role="farmer", district="Raichur", crop_type="Cotton", land_acres=1.5, shg_member=False)
    db.add(user2)
    db.commit()

    expense_count = db.query(Expense).filter(Expense.user_id == 1).count()
    if expense_count == 0:
        seed_data = [
            Expense(user_id=1, category="Seeds", amount=3200.0, note="High yield hybrid seeds", expense_date="2026-05-10"),
            Expense(user_id=1, category="Fertilizer", amount=1800.0, note="Organic NPK fertilizer", expense_date="2026-05-12"),
            Expense(user_id=1, category="Labour", amount=5000.0, note="Sowing & tilling labor", expense_date="2026-05-15"),
            Expense(user_id=1, category="Equipment", amount=2500.0, note="Tractor rental", expense_date="2026-05-18"),
            Expense(user_id=1, category="Food", amount=1200.0, note="Catering for field workers", expense_date="2026-05-20"),
        ]
        for exp in seed_data:
            db.add(exp)
        db.commit()
    
    db.close()
    print("   [OK] Test DB seeded successfully with 5 expenses.")

    # 2. Test GET /api/expenses?user_id=1&month=2026-05
    print("2. Fetching expenses for User 1 in month 2026-05...")
    resp = client.get("/api/expenses", params={"user_id": 1, "month": "2026-05"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["expenses"]) == 5
    assert data["summary"]["total"] == 13700.0
    assert data["summary"]["count"] == 5
    assert data["summary"]["by_category"]["Seeds"] == 3200.0
    assert data["summary"]["by_category"]["Labour"] == 5000.0
    assert data["summary"]["highest_category"] == "Labour"
    print("   [OK] Aggregate sums, counts, and categories calculated perfectly.")

    # 3. Test POST /api/expenses (Add Seeds ₹1,500)
    print("3. Adding new expense (Seeds: Rs. 1,500) for User 1...")
    resp = client.post(
        "/api/expenses",
        json={
            "user_id": 1,
            "category": "Seeds",
            "amount": 1500.0,
            "note": "Late sowing seeds batch",
            "expense_date": "2026-05-25",
            "photo_url": "http://photo.url"
        }
    )
    assert resp.status_code == 200
    new_exp = resp.json()
    assert new_exp["category"] == "Seeds"
    assert new_exp["amount"] == 1500.0
    assert new_exp["date"] == "2026-05-25"
    new_exp_id = new_exp["id"]
    print(f"   [OK] New expense created with ID: {new_exp_id}")

    # Recheck totals for user 1: count should be 6 and total 13,700 + 1,500 = 15,200
    resp = client.get("/api/expenses", params={"user_id": 1, "month": "2026-05"})
    data = resp.json()
    assert len(data["expenses"]) == 6
    assert data["summary"]["total"] == 15200.0
    assert data["summary"]["count"] == 6
    assert data["summary"]["by_category"]["Seeds"] == 4700.0  # 3200 + 1500
    print("   [OK] Re-verified aggregated sums update correctly.")

    # 4. Test DELETE /api/expenses/{expense_id}
    print("4. Testing DELETE /api/expenses/{id} for unauthorized user...")
    resp = client.delete(f"/api/expenses/{new_exp_id}", params={"user_id": 2})
    assert resp.status_code == 404  # Not found for User 2
    print("   [OK] Unauthorized deletion correctly blocked.")

    print("   Testing DELETE /api/expenses/{id} for authorized user...")
    resp = client.delete(f"/api/expenses/{new_exp_id}", params={"user_id": 1})
    assert resp.status_code == 200
    del_data = resp.json()
    assert del_data["deleted"] == new_exp_id
    print("   [OK] Authorized deletion completed successfully.")

    # 5. Test GET /api/expenses/monthly-trend?user_id=1
    print("5. Testing GET /api/expenses/monthly-trend?user_id=1...")
    resp = client.get("/api/expenses/monthly-trend", params={"user_id": 1})
    assert resp.status_code == 200
    trend = resp.json()
    assert len(trend) == 6
    # May trend should show May total (which is now back to 13,700 since we deleted the new expense!)
    # Let's verify that May exists in the trend
    may_found = False
    for t in trend:
        if t["month"] == "May":
            may_found = True
            assert t["amount"] == 13700.0
    assert may_found is True
    print("   [OK] Monthly trend returns dynamic aggregates combined with demo fallbacks.")

    print("\n--- ALL EXPENSES MANAGEMENT TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    try:
        test_expenses_management()
    finally:
        # Cleanup test DB file
        if os.path.exists("./test_expenses.db"):
            try:
                os.remove("./test_expenses.db")
            except Exception:
                pass
