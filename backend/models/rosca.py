from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class ChitGroup(Base):
    __tablename__ = "chit_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    members_count = Column(Integer, nullable=False, default=10)
    monthly_contribution = Column(Float, nullable=False, default=1000.0)
    pool_size = Column(Float, nullable=False, default=10000.0)
    duration_months = Column(Integer, nullable=False, default=10)
    current_month = Column(Integer, nullable=False, default=1)
    status = Column(String, nullable=False, default="active")  # "active" | "forming" | "completed"
    invite_code = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("ChitMember", back_populates="group", cascade="all, delete-orphan")
    bids = relationship("ChitBid", back_populates="group", cascade="all, delete-orphan")
    winners = relationship("ChitWinner", back_populates="group", cascade="all, delete-orphan")

class ChitMember(Base):
    __tablename__ = "chit_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chit_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    paid_months = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("ChitGroup", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='_group_user_uc'),
    )

class ChitBid(Base):
    __tablename__ = "chit_bids"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chit_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("ChitGroup", back_populates="bids")
    user = relationship("User")

class ChitWinner(Base):
    __tablename__ = "chit_winners"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chit_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    amount_won = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("ChitGroup", back_populates="winners")
    user = relationship("User")
