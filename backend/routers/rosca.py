import secrets
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# --- Pydantic Schemas ---

class WinnerDetail(BaseModel):
    month: int
    name: str
    amount_won: float

class CurrentAuction(BaseModel):
    month: int
    current_bid: float
    bids_placed: int
    days_remaining: int

class GroupDetailsResponse(BaseModel):
    id: int
    name: str
    members: int
    monthly_contribution: float
    pool_size: float
    duration_months: int
    current_month: int
    status: str
    my_position: int
    paid_months: int
    next_payment: str
    winners: List[WinnerDetail]
    current_auction: CurrentAuction

class BidRequest(BaseModel):
    group_id: int
    user_id: int
    amount: float

class BidResponse(BaseModel):
    success: bool
    bid: float
    message: str

class CreateGroupRequest(BaseModel):
    name: str
    members_count: int
    monthly_contribution: float
    created_by: int

class CreateGroupResponse(BaseModel):
    id: int
    name: str
    pool_size: float
    duration: int
    invite_code: str
    status: str

class PayRequest(BaseModel):
    group_id: int
    user_id: int
    month: int

class PayResponse(BaseModel):
    success: bool
    paid: float
    total_paid: float

# --- Routes ---

@router.get("/my-groups", response_model=GroupDetailsResponse)
def get_my_groups(user_id: int):
    # Hardcoded active group response as requested for the demo
    return {
        "id": 1,
        "name": "Mandya Farmers Circle",
        "members": 10,
        "monthly_contribution": 1000.0,
        "pool_size": 10000.0,
        "duration_months": 10,
        "current_month": 3,
        "status": "active",
        "my_position": 4,
        "paid_months": 3,
        "next_payment": "2026-06-01",
        "winners": [
            {"month": 1, "name": "Ravi Kumar", "amount_won": 9500.0},
            {"month": 2, "name": "Lakshmi Devi", "amount_won": 9100.0}
        ],
        "current_auction": {
            "month": 3,
            "current_bid": 9200.0,
            "bids_placed": 3,
            "days_remaining": 2
        }
    }


@router.post("/bid", response_model=BidResponse)
def place_bid(request: BidRequest):
    # Validate that bid amount is less than total pool size (10,000 for our demo group)
    pool_size = 10000.0
    if request.amount >= pool_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid amount must be less than the total pool size of Rs.{pool_size:.0f}."
        )
        
    return {
        "success": True,
        "bid": request.amount,
        "message": f"Bid placed! Current highest: Rs.{request.amount:.0f}"
    }


@router.post("/create", response_model=CreateGroupResponse)
def create_rosca_group(request: CreateGroupRequest):
    # Generate a unique hex invite code for high-fidelity feel (e.g. GC-D5B4)
    invite_hex = secrets.token_hex(2).upper()
    invite_code = f"GC-{invite_hex}"
    
    pool_size = request.members_count * request.monthly_contribution
    
    return {
        "id": 99,
        "name": request.name,
        "pool_size": pool_size,
        "duration": request.members_count,
        "invite_code": invite_code,
        "status": "forming"
    }


@router.post("/pay-contribution", response_model=PayResponse)
def pay_contribution(request: PayRequest):
    monthly_contribution = 1000.0
    total_paid = request.month * monthly_contribution
    
    return {
        "success": True,
        "paid": monthly_contribution,
        "total_paid": total_paid
    }
