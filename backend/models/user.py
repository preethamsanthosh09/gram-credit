from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="farmer")
    
    # Profile fields
    district = Column(String, nullable=True)
    crop_type = Column(String, nullable=True)
    land_acres = Column(Float, nullable=True)
    shg_member = Column(Boolean, nullable=True, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    credit_score = Column(Integer, nullable=False, default=70)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")



