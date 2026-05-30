CROP_DATA = {
  "Paddy":    {"sowing":[5,6,7,8], "harvest":[9,10], "peak_income": 10},
  "Wheat":    {"sowing":[10,11],   "harvest":[2,3],  "peak_income": 3},
  "Sugarcane":{"sowing":[1,2],     "harvest":[0,1],  "peak_income": 1},
  "Cotton":   {"sowing":[4,5,6],   "harvest":[9,10], "peak_income": 10},
  "Maize":    {"sowing":[3,4,5],   "harvest":[8,9],  "peak_income": 9},
}

DISTRICT_WEATHER_RISK = {
  "Mandya": 0.15, "Belgaum": 0.10, "Raichur": 0.35,
  "Dharwad": 0.12, "Hassan": 0.18, "Kolar": 0.25
}

def generate_schedule(crop, amount, district, loan_start_month=5):
  crop_info = CROP_DATA.get(crop, CROP_DATA["Paddy"])
  harvest_months = crop_info["harvest"]
  sowing_months = crop_info["sowing"]
  weather_risk = DISTRICT_WEATHER_RISK.get(district, 0.20)
  
  # Drought auto-pause: if risk > 0.30, reduce EMI by 40% in risk months
  emi_per_harvest = amount / len(harvest_months)
  
  schedule = []
  for month_idx in range(12):
    month_name = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month_idx]
    is_harvest = month_idx in harvest_months
    is_sowing = month_idx in sowing_months
    
    if is_harvest:
      adjusted_emi = emi_per_harvest * (0.6 if weather_risk > 0.30 else 1.0)
      entry = {"month": month_name, "amount": round(adjusted_emi), "type": "harvest", "label": "Harvest EMI due"}
    elif is_sowing:
      entry = {"month": month_name, "amount": 0, "type": "sowing", "label": "Sowing season — no EMI"}
    else:
      entry = {"month": month_name, "amount": 0, "type": "off-season", "label": "Off season"}
    schedule.append(entry)
  
  return {
    "schedule": schedule,
    "weather_risk": weather_risk,
    "drought_pause_active": weather_risk > 0.30,
    "ai_recommendation": f"Based on {district} district rainfall data and {crop} yield patterns"
  }
