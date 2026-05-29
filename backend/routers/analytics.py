from datetime import datetime, timezone, timedelta, time
from collections import deque
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.document import Document
from models.loan import Loan
from models.repayment import Repayment

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# --- Pydantic Schemas ---

class SummaryResponse(BaseModel):
    total_loans: int
    approved: int
    pending: int
    total_disbursed: float
    pending_kyc: int
    approved_today: int
    repayments_due_week: int

class MonthlyTrend(BaseModel):
    month: str
    loans: int

# --- Routes ---

@router.get("/summary", response_model=SummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    # 1. Total loans
    total_loans = db.query(Loan).count()
    
    # 2. Approved loans count
    approved = db.query(Loan).filter(Loan.status == "approved").count()
    
    # 3. Pending loans count
    pending = db.query(Loan).filter(Loan.status == "pending").count()
    
    # 4. Total disbursed amount (sum of approved loans)
    total_disbursed_res = db.query(func.sum(Loan.amount)).filter(Loan.status == "approved").scalar()
    total_disbursed = float(total_disbursed_res) if total_disbursed_res is not None else 0.0
    
    # 5. Pending KYC count
    # Count of users where uploaded documents in the documents table is less than 3
    # Use LEFT OUTER JOIN to include users with 0 documents
    pending_kyc = db.query(User.id).join(
        Document, User.id == Document.user_id, isouter=True
    ).group_by(User.id).having(
        func.count(Document.id) < 3
    ).count()
    
    # 6. Approved today count
    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(datetime.now(timezone.utc).date(), time.max).replace(tzinfo=timezone.utc)
    approved_today = db.query(Loan).filter(
        Loan.status == "approved",
        Loan.approved_at >= today_start,
        Loan.approved_at <= today_end
    ).count()
    
    # 7. Repayments due in the next 7 days
    now = datetime.now(timezone.utc)
    in_7_days = now + timedelta(days=7)
    repayments_due_week = db.query(Repayment).filter(
        Repayment.status == "pending",
        Repayment.due_date >= now,
        Repayment.due_date <= in_7_days
    ).count()
    
    return {
        "total_loans": total_loans,
        "approved": approved,
        "pending": pending,
        "total_disbursed": total_disbursed,
        "pending_kyc": pending_kyc,
        "approved_today": approved_today,
        "repayments_due_week": repayments_due_week
    }


@router.get("/monthly", response_model=List[MonthlyTrend])
def get_monthly_trends(db: Session = Depends(get_db)):
    current_date = datetime.now(timezone.utc)
    months_deque = deque()
    
    # Loop over the last 6 months, oldest first
    for i in range(6):
        year = current_date.year
        month = current_date.month - i
        while month <= 0:
            month += 12
            year -= 1
            
        start_of_month = datetime(year, month, 1, tzinfo=timezone.utc)
        
        # End of the month range calculation
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
        else:
            end_of_month = datetime(year, month + 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
            
        month_name = start_of_month.strftime("%b")  # E.g. "Jan"
        
        loans_count = db.query(Loan).filter(
            Loan.created_at >= start_of_month,
            Loan.created_at <= end_of_month
        ).count()
        
        months_deque.appendleft({
            "month": month_name,
            "loans": loans_count
        })
        
    return list(months_deque)
