from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models.user import User
from auth_helper import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Pydantic Schemas ---

class FirebaseLoginRequest(BaseModel):
    firebase_uid: str
    phone: str
    name: Optional[str] = None

class MockLoginRequest(BaseModel):
    phone: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    crop_type: Optional[str] = None
    land_acres: Optional[float] = None
    shg_member: Optional[bool] = None

class UserShortResponse(BaseModel):
    id: int
    name: Optional[str] = None
    phone: str
    role: str

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserShortResponse

class UserFullResponse(BaseModel):
    id: int
    name: Optional[str] = None
    phone: str
    role: str
    district: Optional[str] = None
    crop_type: Optional[str] = None
    land_acres: Optional[float] = None
    shg_member: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CreditScoreHistoryItem(BaseModel):
    month: str
    score: int

class NextMilestone(BaseModel):
    score: int
    reward: str

class CreditScoreResponse(BaseModel):
    score: int
    tier: str
    history: List[CreditScoreHistoryItem]
    next_milestone: NextMilestone
    how_to_improve: List[str]

class ScoreUpdateRequest(BaseModel):
    user_id: int
    action: str

class ScoreUpdateResponse(BaseModel):
    user_id: int
    new_score: int


# --- Helper logic for token generation ---
def generate_auth_token_response(user: User) -> dict:
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "phone": user.phone,
            "role": user.role
        }
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "role": user.role
        }
    }

# --- Routes ---

@router.post("/firebase-login", response_model=AuthResponse)
def firebase_login(request: FirebaseLoginRequest, db: Session = Depends(get_db)):
    # 1. Try to find user by firebase_uid
    user = db.query(User).filter(User.firebase_uid == request.firebase_uid).first()
    
    if not user:
        # 2. Try to find user by phone (e.g. created through mock login)
        user = db.query(User).filter(User.phone == request.phone).first()
        if user:
            # Link firebase_uid to existing user
            user.firebase_uid = request.firebase_uid
            if request.name and not user.name:
                user.name = request.name
            db.commit()
            db.refresh(user)
        else:
            # 3. Create a brand new user
            user = User(
                firebase_uid=request.firebase_uid,
                phone=request.phone,
                name=request.name,
                role="farmer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
    # 4. Generate token and return response
    return generate_auth_token_response(user)


@router.post("/mock-login", response_model=AuthResponse)
def mock_login(request: MockLoginRequest, db: Session = Depends(get_db)):
    # Only allow phone "7975200593"
    if request.phone != "7975200593":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock login is restricted to demo number 7975200593."
        )
        
    # Find or create user
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        user = User(
            phone=request.phone,
            name="Demo Farmer",
            role="farmer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Generate token and return response
    return generate_auth_token_response(user)


@router.get("/me", response_model=UserFullResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserFullResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update fields if provided
    if request.name is not None:
        current_user.name = request.name
    if request.district is not None:
        current_user.district = request.district
    if request.crop_type is not None:
        current_user.crop_type = request.crop_type
    if request.land_acres is not None:
        current_user.land_acres = request.land_acres
    if request.shg_member is not None:
        current_user.shg_member = request.shg_member
        
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/credit-score", response_model=CreditScoreResponse)
def get_credit_score(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
        
    score = user.credit_score
    
    if score >= 90:
        tier = "Premium"
    elif score >= 70:
        tier = "Standard"
    elif score >= 50:
        tier = "Basic"
    else:
        tier = "Subprime"
        
    history = [
        {"month": "Jan", "score": max(score - 28, 30)},
        {"month": "Feb", "score": max(score - 18, 35)},
        {"month": "Mar", "score": max(score - 8, 40)},
        {"month": "Apr", "score": score}
    ]
    
    next_milestone = {
        "score": 85 if score < 85 else 95,
        "reward": "Unlock Rs.1,00,000 loan limit" if score < 85 else "Unlock premium lower interest rates (8%)"
    }
    
    how_to_improve = [
        "Repay next EMI on time (+10 pts)",
        "Upload land document (+5 pts)",
        "Join SHG (+20 pts)"
    ]
    
    return {
        "score": score,
        "tier": tier,
        "history": history,
        "next_milestone": next_milestone,
        "how_to_improve": how_to_improve
    }


@router.post("/credit-score/update", response_model=ScoreUpdateResponse)
def update_credit_score(request: ScoreUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {request.user_id} not found."
        )
        
    points_map = {
        "repayment_made": 10,
        "document_added": 5,
        "shg_joined": 20
    }
    
    if request.action not in points_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Allowed actions: repayment_made, document_added, shg_joined."
        )
        
    points = points_map[request.action]
    user.credit_score = min(user.credit_score + points, 100)  # Capped at 100
    db.commit()
    db.refresh(user)
    
    return {
        "user_id": user.id,
        "new_score": user.credit_score
    }

