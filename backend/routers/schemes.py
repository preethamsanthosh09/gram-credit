from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from database import get_db
from models.user import User

router = APIRouter(prefix="/api/schemes", tags=["schemes"])

# --- Schemes Master Database ---
SCHEMES_DB = [
    {
        "id": 1,
        "name": "PM-Kisan",
        "description": "Pradhan Mantri Kisan Samman Nidhi - Direct income support of Rs. 6,000 per year for small and marginal landholder farmer families.",
        "benefit": "Direct benefit transfer of Rs. 6,000 annually in 3 equal installments.",
        "criteria": "Small and marginal farmers holding cultivable land less than 2 acres."
    },
    {
        "id": 2,
        "name": "PMFBY",
        "description": "Pradhan Mantri Fasal Bima Yojana - Crop insurance scheme offering comprehensive risk coverage against crop failure and natural calamities.",
        "benefit": "Low premium insurance covering yield losses due to drought, pests, floods, and diseases.",
        "criteria": "Available to all farmers growing notified crops in notified areas."
    },
    {
        "id": 3,
        "name": "KCC",
        "description": "Kisan Credit Card - Quick, hassle-free credit access for farmers to meet their cultivation and post-harvest expenses.",
        "benefit": "Short term credit limits at heavily subsidized interest rates (starting at 4%).",
        "criteria": "All farmers, owner-cultivators, tenant farmers, and Self-Help Groups (SHGs)."
    },
    {
        "id": 4,
        "name": "Soil Health Card",
        "description": "Soil Health Card Scheme - Direct report cards issued to farmers detailing chemical properties and nutrient status of their farm soil.",
        "benefit": "Personalized fertilizer recommendations to improve crop yield and soil health.",
        "criteria": "Available to all farm land holdings across the country."
    },
    {
        "id": 5,
        "name": "PM Kisan Maandhan Yojana",
        "description": "Old age pension scheme providing social security net to small and marginal farmers.",
        "benefit": "Assured monthly pension of Rs. 3,000 upon reaching age 60.",
        "criteria": "Small and marginal farmers holding land, age 18-40 (age check skipped for demo)."
    },
    {
        "id": 6,
        "name": "eNAM",
        "description": "Electronic National Agriculture Market - Unified online trading portal integrating existing APMC mandis to create a unified national market.",
        "benefit": "Transparent bidding, direct payment settlement, and access to nationwide buyers.",
        "criteria": "Farmers trading staple crops (Paddy, Wheat, Maize, etc.) in APMC mandis."
    }
]

# --- Pydantic Schemas ---

class SchemeItem(BaseModel):
    id: int
    name: str
    description: str
    benefit: str
    criteria: str

class SchemeEligibilityItem(BaseModel):
    id: int
    name: str
    description: str
    benefit: str
    criteria: str
    eligible: bool

class SchemeEligibilityResponse(BaseModel):
    eligible_count: int
    schemes: List[SchemeEligibilityItem]

# --- Routes ---

@router.get("", response_model=List[SchemeItem])
def list_all_schemes():
    return SCHEMES_DB


@router.get("/eligible", response_model=SchemeEligibilityResponse)
def check_schemes_eligibility(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    eligible_schemes = []
    eligible_count = 0
    
    # Extract profile attributes
    land = user.land_acres if user.land_acres is not None else 0.0
    crop = str(user.crop_type).strip().lower() if user.crop_type else ""
    
    for scheme in SCHEMES_DB:
        eligible = False
        name = scheme["name"]
        
        if name == "PM-Kisan":
            eligible = land < 2.0
        elif name == "PMFBY":
            eligible = True
        elif name == "KCC":
            eligible = True
        elif name == "Soil Health Card":
            eligible = True
        elif name == "PM Kisan Maandhan Yojana":
            eligible = True
        elif name == "eNAM":
            eligible = crop in ["paddy", "wheat", "maize"]
            
        if eligible:
            eligible_count += 1
            
        eligible_schemes.append({
            **scheme,
            "eligible": eligible
        })
        
    return {
        "eligible_count": eligible_count,
        "schemes": eligible_schemes
    }
