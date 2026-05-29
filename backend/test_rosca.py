import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

# Use a test SQLite database file
TEST_DATABASE_URL = "sqlite:///./test_rosca.db"

# Remove test db if exists
if os.path.exists("./test_rosca.db"):
    try:
        os.remove("./test_rosca.db")
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

def test_rosca_endpoints():
    print("--- STARTING GRAMCREDIT ROSCA ROUTER TESTS ---")
    
    # 1. Test GET /api/rosca/my-groups?user_id=1
    print("1. Testing GET /api/rosca/my-groups?user_id=1...")
    resp = client.get("/api/rosca/my-groups", params={"user_id": 1})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1
    assert data["name"] == "Mandya Farmers Circle"
    assert data["members"] == 10
    assert data["monthly_contribution"] == 1000.0
    assert data["pool_size"] == 10000.0
    assert data["duration_months"] == 10
    assert data["current_month"] == 3
    assert data["status"] == "active"
    assert data["my_position"] == 4
    assert len(data["winners"]) == 2
    assert data["winners"][0]["name"] == "Ravi Kumar"
    assert data["winners"][1]["amount_won"] == 9100.0
    assert data["current_auction"]["current_bid"] == 9200.0
    print("   [OK] Hardcoded ROSCA group metadata matches perfectly.")

    # 2. Test POST /api/rosca/bid (Valid bid < 10,000)
    print("2. Testing POST /api/rosca/bid with valid amount...")
    resp = client.post(
        "/api/rosca/bid",
        json={"group_id": 1, "user_id": 1, "amount": 9350.0}
    )
    assert resp.status_code == 200
    bid_data = resp.json()
    assert bid_data["success"] is True
    assert bid_data["bid"] == 9350.0
    assert "Bid placed!" in bid_data["message"]
    print("   [OK] Valid bid placed successfully.")

    # 3. Test POST /api/rosca/bid (Invalid bid >= 10,000)
    print("3. Testing POST /api/rosca/bid with invalid amount >= pool_size...")
    resp = client.post(
        "/api/rosca/bid",
        json={"group_id": 1, "user_id": 1, "amount": 10500.0}
    )
    assert resp.status_code == 400
    assert "must be less than the total pool size" in resp.json()["detail"]
    print("   [OK] Over-pool bid correctly blocked.")

    # 4. Test POST /api/rosca/create
    print("4. Testing POST /api/rosca/create...")
    create_payload = {
        "name": "Raichur Cotton Club",
        "members_count": 12,
        "monthly_contribution": 1500.0,
        "created_by": 1
    }
    resp = client.post("/api/rosca/create", json=create_payload)
    assert resp.status_code == 200
    grp = resp.json()
    assert grp["id"] > 0
    assert grp["name"] == "Raichur Cotton Club"
    assert grp["pool_size"] == 12 * 1500.0  # 18,000
    assert grp["duration"] == 12
    assert grp["status"] == "forming"
    assert grp["invite_code"].startswith("GC-")
    print(f"   [OK] ROSCA group created with custom parameters. Invite Code: {grp['invite_code']}")

    # 5. Test POST /api/rosca/pay-contribution
    print("5. Testing POST /api/rosca/pay-contribution...")
    resp = client.post(
        "/api/rosca/pay-contribution",
        json={"group_id": 1, "user_id": 1, "month": 3}
    )
    assert resp.status_code == 200
    pay = resp.json()
    assert pay["success"] is True
    assert pay["paid"] == 1000.0
    assert pay["total_paid"] == 4000.0
    print("   [OK] ROSCA monthly contribution payment calculated successfully.")

    print("\n--- ALL ROSCA TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_rosca_endpoints()
