from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.document import Document
from models.loan import Loan
from models.repayment import Repayment
from services.eligibility import calculate_score

router = APIRouter(prefix="/api/loans", tags=["loans"])

# --- Helper function for SMS ---
def send_sms(phone: str, message: str) -> bool:
    print(f"[SMS to {phone}]: {message}")
    return True

# --- Pydantic Schemas ---

class EligibilityRequest(BaseModel):
    user_id: int
    existing_loans: int = 0
    repayment_history: int = 0
    crop_type: Optional[str] = None
    land_acres: Optional[float] = None
    shg_member: Optional[bool] = None
    district: Optional[str] = None

class ScoreBreakdown(BaseModel):
    docs: int
    crop: int
    land: float
    shg: int
    history: int
    penalty: int

class EligibilityResponse(BaseModel):
    score: float
    tier: str
    approved: bool
    max_amount: int
    interest_rate: int
    weather_risk: str
    breakdown: ScoreBreakdown

class LoanApplyRequest(BaseModel):
    user_id: int
    crop_type: str
    land_acres: float
    shg_member: bool
    amount: float
    repayment_mode: str  # "monthly" | "harvest" | "yearly"
    district: str

class RepaymentResponse(BaseModel):
    id: int
    month_number: int
    amount: float
    status: str
    due_date: datetime

    class Config:
        from_attributes = True

class LoanApplyResponse(BaseModel):
    loan_id: int
    status: str
    score: float
    tier: str
    repayment_schedule: List[RepaymentResponse]

class LoanDetailResponse(BaseModel):
    id: int
    user_id: int
    crop_type: str
    land_acres: float
    shg_member: bool
    amount: float
    repayment_mode: str
    district: str
    score: float
    tier: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    repayments: List[RepaymentResponse]

    class Config:
        from_attributes = True

class LoanListResponse(BaseModel):
    id: int
    user_id: int
    farmer_name: Optional[str] = "Farmer"
    crop_type: str
    land_acres: float
    shg_member: bool
    amount: float
    repayment_mode: str
    district: str
    score: float
    tier: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RejectRequest(BaseModel):
    reason: str

class ApproveResponse(BaseModel):
    loan_id: int
    status: str
    sms_sent: bool

class RejectResponse(BaseModel):
    loan_id: int
    status: str

# --- Routes ---

@router.post("/eligibility", response_model=EligibilityResponse)
def check_loan_eligibility(request: EligibilityRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {request.user_id} not found."
        )
        
    docs_count = db.query(Document).filter(Document.user_id == request.user_id).count()
    
    crop = request.crop_type if request.crop_type is not None else user.crop_type
    land_acres = request.land_acres if request.land_acres is not None else user.land_acres
    shg_member = request.shg_member if request.shg_member is not None else user.shg_member
    district = request.district if request.district is not None else user.district
    
    eligibility_result = calculate_score(
        crop=crop,
        land_acres=land_acres,
        shg_member=shg_member,
        docs_count=docs_count,
        existing_loans=request.existing_loans,
        district=district,
        repayment_history=request.repayment_history
    )
    
    return eligibility_result


@router.post("/apply", response_model=LoanApplyResponse)
def apply_for_loan(request: LoanApplyRequest, db: Session = Depends(get_db)):
    if request.repayment_mode not in ["monthly", "harvest", "yearly"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repayment_mode. Allowed types: monthly, harvest, yearly."
        )
        
    docs_count = db.query(Document).filter(Document.user_id == request.user_id).count()
    
    active_loans_count = db.query(Loan).filter(
        Loan.user_id == request.user_id,
        Loan.status != "paid",
        Loan.status != "rejected"
    ).count()
    
    paid_loans_count = db.query(Loan).filter(
        Loan.user_id == request.user_id,
        Loan.status == "paid"
    ).count()
    
    score_res = calculate_score(
        crop=request.crop_type,
        land_acres=request.land_acres,
        shg_member=request.shg_member,
        docs_count=docs_count,
        existing_loans=active_loans_count,
        district=request.district,
        repayment_history=paid_loans_count
    )
    score = score_res["score"]
    tier = score_res["tier"]
    
    if score < 50.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not eligible. Score: {score}"
        )
        
    # Initial status is set to "pending" to support approval flow
    new_loan = Loan(
        user_id=request.user_id,
        crop_type=request.crop_type,
        land_acres=request.land_acres,
        shg_member=request.shg_member,
        amount=request.amount,
        repayment_mode=request.repayment_mode,
        district=request.district,
        score=score,
        tier=tier,
        status="pending"
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    
    loan_created_time = new_loan.created_at if new_loan.created_at else datetime.now(timezone.utc)
    
    crop_lower = request.crop_type.strip().lower()
    harvest_map = {
        "paddy": [9, 10],
        "wheat": [2, 3],
        "sugarcane": [0, 1],
        "cotton": [9, 10],
        "maize": [8, 9]
    }
    harvest_months_list = harvest_map.get(crop_lower, [9, 10])
    
    repayments_list = []
    
    if request.repayment_mode == "monthly":
        emi = request.amount / 12.0
        for m in range(12):
            due = loan_created_time + timedelta(days=30 * (m + 1))
            repayments_list.append(
                Repayment(loan_id=new_loan.id, month_number=m, amount=round(emi, 2), due_date=due)
            )
            
    elif request.repayment_mode == "harvest":
        emi = request.amount / len(harvest_months_list)
        for m in range(12):
            is_harvest = m in harvest_months_list
            amt = emi if is_harvest else 0.0
            due = loan_created_time + timedelta(days=30 * (m + 1))
            repayments_list.append(
                Repayment(loan_id=new_loan.id, month_number=m, amount=round(amt, 2), due_date=due)
            )
            
    elif request.repayment_mode == "yearly":
        final_month = max(harvest_months_list)
        for m in range(12):
            amt = request.amount if m == final_month else 0.0
            due = loan_created_time + timedelta(days=30 * (m + 1))
            repayments_list.append(
                Repayment(loan_id=new_loan.id, month_number=m, amount=round(amt, 2), due_date=due)
            )
            
    for rep in repayments_list:
        db.add(rep)
    db.commit()
    db.refresh(new_loan)
    
    return {
        "loan_id": new_loan.id,
        "status": new_loan.status,
        "score": new_loan.score,
        "tier": new_loan.tier,
        "repayment_schedule": new_loan.repayments
    }


@router.patch("/{loan_id}/approve", response_model=ApproveResponse)
def approve_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with ID {loan_id} not found."
        )
        
    loan.status = "approved"
    loan.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(loan)
    
    farmer = db.query(User).filter(User.id == loan.user_id).first()
    farmer_name = farmer.name if (farmer and farmer.name) else "Farmer"
    farmer_phone = farmer.phone if farmer else "N/A"
    
    sms_sent = send_sms(
        phone=farmer_phone,
        message=f"Dear {farmer_name}, your GramCredit loan of Rs.{loan.amount:.0f} is APPROVED! Disbursement via UPI in 2 hours. Repayment starts after harvest. -GramCredit"
    )
    
    return {
        "loan_id": loan.id,
        "status": "approved",
        "sms_sent": sms_sent
    }


@router.patch("/{loan_id}/reject", response_model=RejectResponse)
def reject_loan(loan_id: int, request: RejectRequest, db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with ID {loan_id} not found."
        )
        
    loan.status = "rejected"
    db.commit()
    db.refresh(loan)
    
    farmer = db.query(User).filter(User.id == loan.user_id).first()
    farmer_name = farmer.name if (farmer and farmer.name) else "Farmer"
    farmer_phone = farmer.phone if farmer else "N/A"
    
    send_sms(
        phone=farmer_phone,
        message=f"Dear {farmer_name}, your loan application needs more info. Call 1800-XXX-XXXX. -GramCredit"
    )
    
    return {
        "loan_id": loan.id,
        "status": "rejected"
    }


@router.get("", response_model=List[LoanListResponse])
def list_loans(
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    crop_type: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Perform a joined query to pull farmer's name
    query = db.query(
        Loan.id,
        Loan.user_id,
        User.name.label("farmer_name"),
        Loan.crop_type,
        Loan.land_acres,
        Loan.shg_member,
        Loan.amount,
        Loan.repayment_mode,
        Loan.district,
        Loan.score,
        Loan.tier,
        Loan.status,
        Loan.created_at,
        Loan.approved_at
    ).join(User, Loan.user_id == User.id)
    
    # Apply dynamic filters
    if status is not None:
        query = query.filter(Loan.status == status)
    if user_id is not None:
        query = query.filter(Loan.user_id == user_id)
    if crop_type is not None:
        query = query.filter(Loan.crop_type == crop_type)
    if district is not None:
        query = query.filter(Loan.district == district)
        
    results = query.all()
    
    # Return formatted rows matching the List schema
    return results


@router.get("/{loan_id}", response_model=LoanDetailResponse)
def get_loan_details(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(Loan).options(joinedload(Loan.repayments)).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with ID {loan_id} not found."
        )
    return loan
