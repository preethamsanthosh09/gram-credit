import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.harvest_ai import generate_schedule

def test_harvest_ai_logic():
    print("--- STARTING GRAMCREDIT HARVEST AI TESTS ---")

    # Test 1: Paddy in Mandya (Low Risk)
    print("1. Testing Paddy in Mandya (amount=10000, weather_risk=0.15)...")
    res = generate_schedule(crop="Paddy", amount=10000, district="Mandya")
    
    assert res["weather_risk"] == 0.15
    assert res["drought_pause_active"] is False
    
    # Oct & Nov are harvest months for Paddy: [9, 10] (indices 9 and 10, i.e., Oct, Nov)
    schedule = res["schedule"]
    oct_entry = next(item for item in schedule if item["month"] == "Oct")
    nov_entry = next(item for item in schedule if item["month"] == "Nov")
    
    assert oct_entry["type"] == "harvest"
    assert oct_entry["amount"] == 5000  # 10000 / 2 harvest months
    assert nov_entry["amount"] == 5000
    
    # Jun is sowing month for Paddy: [5,6,7,8] (Jun, Jul, Aug, Sep)
    jun_entry = next(item for item in schedule if item["month"] == "Jun")
    assert jun_entry["type"] == "sowing"
    assert jun_entry["amount"] == 0
    print("   [OK] Paddy in Mandya schedules produced correctly.")

    # Test 2: Wheat in Raichur (High Risk, drought pause active)
    print("2. Testing Wheat in Raichur (amount=20000, weather_risk=0.35)...")
    res = generate_schedule(crop="Wheat", amount=20000, district="Raichur")
    
    assert res["weather_risk"] == 0.35
    assert res["drought_pause_active"] is True
    
    # Mar & Apr are harvest months for Wheat: [2, 3] (Mar, Apr)
    schedule = res["schedule"]
    mar_entry = next(item for item in schedule if item["month"] == "Mar")
    apr_entry = next(item for item in schedule if item["month"] == "Apr")
    
    # Drought auto-pause reduces EMI by 40% (x 0.6)
    # Expected: (20000 / 2) * 0.6 = 10000 * 0.6 = 6000
    assert mar_entry["type"] == "harvest"
    assert mar_entry["amount"] == 6000
    assert apr_entry["amount"] == 6000
    print("   [OK] Wheat in Raichur drought-adjusted schedules produced correctly.")

    print("\n--- ALL HARVEST AI TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_harvest_ai_logic()
