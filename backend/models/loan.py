from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_type = Column(String, nullable=False)
    land_acres = Column(Float, nullable=False)
    shg_member = Column(Boolean, nullable=False)
    amount = Column(Float, nullable=False)
    repayment_mode = Column(String, nullable=False)  # "monthly" | "harvest" | "yearly"
    district = Column(String, nullable=False)
    
    # Eligibility values saved upon loan application
    score = Column(Float, nullable=False)
    tier = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # "pending" | "approved" | "rejected" | "active" | "paid"
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="loans")
    repayments = relationship("Repayment", back_populates="loan", cascade="all, delete-orphan")
