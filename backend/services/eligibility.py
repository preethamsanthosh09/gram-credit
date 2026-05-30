# Scoring engine for credit eligibility

def calculate_score(
    crop: str, 
    land_acres: float, 
    shg_member: bool, 
    docs_count: int, 
    existing_loans: int, 
    district: str, 
    repayment_history: int = 0
) -> dict:
    # 1. Document Score (max 30)
    # 1 doc: 10, 2 docs: 20, 3 docs: 30
    docs_score = 0
    if docs_count == 1:
        docs_score = 10
    elif docs_count == 2:
        docs_score = 20
    elif docs_count >= 3:
        docs_score = 30

    # 2. Crop/Category Score (max 20)
    # Paddy: 20, Sugarcane: 20, Cotton: 18, Wheat: 16, Maize: 14
    # Education/Business: 18-20 baseline
    crop_scores = {
        "paddy": 20,
        "sugarcane": 20,
        "cotton": 18,
        "wheat": 16,
        "maize": 14,
        "education": 20,
        "kirana store": 20,
        "vegetable seller": 18,
        "milk vendor": 18,
        "hardware shop": 20,
        "cloth merchant": 20,
        "auto driver": 18,
        "business": 20
    }
    crop_normalized = str(crop).strip().lower() if crop else ""
    crop_score = 0
    if crop_normalized in crop_scores:
        crop_score = crop_scores[crop_normalized]
    else:
        # Match keywords for complex mapped values (e.g. "Education: Primary School")
        for key, val in crop_scores.items():
            if key in crop_normalized:
                crop_score = val
                break

    # 3. Land Score (max 25)
    # min(land_acres * 8, 25)
    acres = float(land_acres) if land_acres else 0.0
    land_score = min(acres * 8.0, 25.0)

    # 4. SHG Membership (max 20)
    shg_score = 20 if shg_member else 0

    # 4b. Adjust baseline scores for non-agricultural loans so they are not penalized for 0 land / 0 SHG
    is_non_agri = any(kw in crop_normalized for kw in [
        "education", "kirana store", "vegetable seller", "milk vendor", 
        "hardware shop", "cloth merchant", "auto driver", "business"
    ])
    if is_non_agri:
        land_score = max(land_score, 20.0)
        shg_score = max(shg_score, 15.0)

    # 5. Repayment History Bonus (max 15)
    # repayment_history * 5 (capped at 15)
    history_val = int(repayment_history) if repayment_history else 0
    history_score = min(history_val * 5, 15)

    # 6. Existing Loan Penalty
    # -8 per existing loan
    active_loans = int(existing_loans) if existing_loans else 0
    penalty = active_loans * -8

    # Total Score
    total_score = float(docs_score + crop_score + land_score + shg_score + history_score + penalty)
    
    # Tier Classification
    # score >= 90: "Premium" — max 1,50,000 at 10%
    # score 70–89: "Standard" — max 75,000 at 12%
    # score 50–69: "Basic" — max 40,000 at 14%
    # score < 50: "Rejected"
    if total_score >= 90.0:
        tier = "Premium"
        approved = True
        max_amount = 150000
        interest_rate = 10
    elif total_score >= 70.0:
        tier = "Standard"
        approved = True
        max_amount = 75000
        interest_rate = 12
    elif total_score >= 50.0:
        tier = "Basic"
        approved = True
        max_amount = 40000
        interest_rate = 14
    else:
        tier = "Rejected"
        approved = False
        max_amount = 0
        interest_rate = 0

    # Weather Risk Flag
    district_risk = {
        "mandya": "moderate",
        "raichur": "high",
        "belgaum": "low"
    }
    dist_normalized = str(district).strip().lower() if district else ""
    weather_risk = district_risk.get(dist_normalized, "none")

    return {
        "score": round(total_score, 2),
        "tier": tier,
        "approved": approved,
        "max_amount": max_amount,
        "interest_rate": interest_rate,
        "weather_risk": weather_risk,
        "breakdown": {
            "docs": docs_score,
            "crop": crop_score,
            "land": round(land_score, 2),
            "shg": shg_score,
            "history": history_score,
            "penalty": penalty
        }
    }
