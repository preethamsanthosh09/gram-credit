import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models.rosca import ChitGroup, ChitMember, ChitBid, ChitWinner
from models.user import User

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
def get_my_groups(user_id: int, group_id: Optional[int] = None, db: Session = Depends(get_db)):
    # Ensure user exists in SQLite to prevent autoincrement ID collisions
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            phone="7975200593" if user_id == 1 else f"9910000{user_id:03d}",
            name="Ravi Kumar" if user_id == 1 else f"Demo Farmer {user_id}",
            role="farmer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)


    # Find if user has a registered group
    if group_id is not None:
        member_rel = db.query(ChitMember).filter(
            ChitMember.user_id == user_id,
            ChitMember.group_id == group_id
        ).first()
    else:
        member_rel = db.query(ChitMember).filter(ChitMember.user_id == user_id).first()
    
    if not member_rel:
        # Auto-seed a beautiful premium active group for this user if SQLite is blank
        group = ChitGroup(
            name="Mandya Farmers Circle",
            members_count=10,
            monthly_contribution=1000.0,
            pool_size=10000.0,
            duration_months=10,
            current_month=3,
            status="active",
            invite_code="GC-CHIT-9018"
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        
        # Add current user as member
        member_rel = ChitMember(
            group_id=group.id,
            user_id=user_id,
            position=4,
            paid_months=3
        )
        db.add(member_rel)
        
        # Add other farmers as members to build a complete visual registry
        other_members = [
            ("Lakshmi Devi", 2),
            ("Suresh Patil", 3),
            ("Meena Bai", 5),
            ("Gopal Reddy", 6),
            ("Anita Kumari", 7)
        ]
        for name, pos in other_members:
            dummy_phone = f"99000000{pos:02d}"
            dummy_user = db.query(User).filter(User.phone == dummy_phone).first()
            if not dummy_user:
                dummy_user = User(name=name, phone=dummy_phone, role="farmer")
                db.add(dummy_user)
                db.commit()
                db.refresh(dummy_user)
                
            db_member = ChitMember(group_id=group.id, user_id=dummy_user.id, position=pos, paid_months=3)
            db.add(db_member)
        
        # Add historical winners
        w1 = ChitWinner(group_id=group.id, user_id=user_id, month=1, amount_won=9500.0)
        
        dummy_user2 = db.query(User).filter(User.name == "Lakshmi Devi").first()
        w2 = ChitWinner(group_id=group.id, user_id=dummy_user2.id if dummy_user2 else user_id, month=2, amount_won=9100.0)
        
        db.add(w1)
        db.add(w2)
        
        # Add an initial Month 3 bid
        bid1 = ChitBid(group_id=group.id, user_id=dummy_user2.id if dummy_user2 else user_id, month=3, amount=9200.0)
        db.add(bid1)
        
        db.commit()
        db.refresh(group)
        member_rel = db.query(ChitMember).filter(ChitMember.user_id == user_id).first()
    
    if not member_rel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered chit circle membership found for this user."
        )
        
    group = db.query(ChitGroup).filter(ChitGroup.id == member_rel.group_id).first()
    
    # Query winners list
    db_winners = db.query(ChitWinner).filter(ChitWinner.group_id == group.id).all()
    winners_list = []
    for w in db_winners:
        winner_user = db.query(User).filter(User.id == w.user_id).first()
        winners_list.append({
            "month": w.month,
            "name": winner_user.name if (winner_user and winner_user.name) else "Farmer",
            "amount_won": w.amount_won
        })
        
    # Query current month's highest bid
    highest_bid = db.query(ChitBid).filter(
        ChitBid.group_id == group.id,
        ChitBid.month == group.current_month
    ).order_by(ChitBid.amount.asc()).first()
    
    bids_placed = db.query(ChitBid).filter(
        ChitBid.group_id == group.id,
        ChitBid.month == group.current_month
    ).count()
    
    current_bid_value = highest_bid.amount if highest_bid else 9200.0
    
    return {
        "id": group.id,
        "name": group.name,
        "members": group.members_count,
        "monthly_contribution": group.monthly_contribution,
        "pool_size": group.pool_size,
        "duration_months": group.duration_months,
        "current_month": group.current_month,
        "status": group.status,
        "my_position": member_rel.position,
        "paid_months": member_rel.paid_months,
        "next_payment": "2026-06-01",
        "winners": winners_list,
        "current_auction": {
            "month": group.current_month,
            "current_bid": current_bid_value,
            "bids_placed": max(bids_placed, 3),
            "days_remaining": 2
        }
    }


@router.post("/bid", response_model=BidResponse)
def place_bid(request: BidRequest, db: Session = Depends(get_db)):
    group = db.query(ChitGroup).filter(ChitGroup.id == request.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit group not found.")
        
    if request.amount >= group.pool_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid amount must be less than the total pool size of Rs.{group.pool_size:.0f}."
        )
        
    # Save the bid persistently in SQLite
    db_bid = ChitBid(
        group_id=request.group_id,
        user_id=request.user_id,
        month=group.current_month,
        amount=request.amount
    )
    db.add(db_bid)
    db.commit()
    
    return {
        "success": True,
        "bid": request.amount,
        "message": f"Bid placed! Current lowest bid: Rs.{request.amount:.0f}"
    }


@router.post("/create", response_model=CreateGroupResponse)
def create_rosca_group(request: CreateGroupRequest, db: Session = Depends(get_db)):
    invite_hex = secrets.token_hex(2).upper()
    invite_code = f"GC-{invite_hex}"
    
    pool_size = request.members_count * request.monthly_contribution
    
    # Save Chit Group persistently
    group = ChitGroup(
        name=request.name,
        members_count=request.members_count,
        monthly_contribution=request.monthly_contribution,
        pool_size=pool_size,
        duration_months=request.members_count,
        current_month=1,
        status="forming",
        invite_code=invite_code
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Add creator as first member
    member = ChitMember(
        group_id=group.id,
        user_id=request.created_by,
        position=1,
        paid_months=0
    )
    db.add(member)
    db.commit()
    
    return {
        "id": group.id,
        "name": group.name,
        "pool_size": pool_size,
        "duration": group.duration_months,
        "invite_code": invite_code,
        "status": group.status
    }


@router.post("/pay-contribution", response_model=PayResponse)
def pay_contribution(request: PayRequest, db: Session = Depends(get_db)):
    member = db.query(ChitMember).filter(
        ChitMember.group_id == request.group_id,
        ChitMember.user_id == request.user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chit membership record not found.")
        
    group = db.query(ChitGroup).filter(ChitGroup.id == request.group_id).first()
    
    # Increment paid months persistently in SQLite
    member.paid_months = min(member.paid_months + 1, group.duration_months)
    
    # If the user has paid for the current active month, close the auction and advance the month!
    if member.paid_months >= group.current_month:
        # Determine the winner based on lowest bid (standard for reverse auctions)
        lowest_bid = db.query(ChitBid).filter(
            ChitBid.group_id == group.id,
            ChitBid.month == group.current_month
        ).order_by(ChitBid.amount.asc()).first()
        
        amount_won = lowest_bid.amount if lowest_bid else (group.pool_size - 1000.0)
        winner_user_id = lowest_bid.user_id if lowest_bid else request.user_id
        
        # Seed winner row if none exists
        existing_winner = db.query(ChitWinner).filter(
            ChitWinner.group_id == group.id,
            ChitWinner.month == group.current_month
        ).first()
        
        if not existing_winner:
            db_winner = ChitWinner(
                group_id=group.id,
                user_id=winner_user_id,
                month=group.current_month,
                amount_won=amount_won
            )
            db.add(db_winner)
            
        # Advance the active circle month
        group.current_month = min(group.current_month + 1, group.duration_months)
        
    db.commit()
    db.refresh(member)
    
    return {
        "success": True,
        "paid": group.monthly_contribution,
        "total_paid": member.paid_months * group.monthly_contribution
    }

class GroupSummary(BaseModel):
    id: int
    name: str
    status: str

@router.get("/user-groups", response_model=List[GroupSummary])
def get_user_groups(user_id: int, db: Session = Depends(get_db)):
    memberships = db.query(ChitMember).filter(ChitMember.user_id == user_id).all()
    groups_list = []
    for m in memberships:
        g = db.query(ChitGroup).filter(ChitGroup.id == m.group_id).first()
        if g:
            groups_list.append({
                "id": g.id,
                "name": g.name,
                "status": g.status
            })
    return groups_list

