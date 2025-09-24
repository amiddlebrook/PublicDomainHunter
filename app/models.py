"""
Database models for Public Domain Hunter.

Defines the database schema using SQLAlchemy ORM.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User model for authentication and user management."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    works = relationship("Work", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

class Work(Base):
    """Public domain work model."""
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    author = Column(String(255))
    original_publication_year = Column(Integer)
    public_domain_year = Column(Integer)
    description = Column(Text)
    source_url = Column(String(500))
    download_url = Column(String(500))
    media_type = Column(String(50))  # book, document, image, audio, video
    language = Column(String(10), default="en")
    page_count = Column(Integer)
    file_size = Column(Integer)  # in bytes
    metadata = Column(JSON)  # Additional metadata as JSON
    status = Column(String(20), default="active")  # active, archived, deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    user = relationship("User", back_populates="works")
    metrics = relationship("WorkMetric", back_populates="work")
    alerts = relationship("Alert", back_populates="work")

class WorkMetric(Base):
    """Metrics and analytics for public domain works."""
    __tablename__ = "work_metrics"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    metric_date = Column(DateTime(timezone=True), server_default=func.now())
    search_volume = Column(Integer, default=0)
    trend_score = Column(Float, default=0.0)
    competition_score = Column(Float, default=0.0)
    demand_score = Column(Float, default=0.0)
    monetization_potential = Column(Float, default=0.0)
    amazon_sales_rank = Column(Integer)
    google_trends_interest = Column(Float, default=0.0)
    metadata = Column(JSON)  # Additional metrics data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    work = relationship("Work", back_populates="metrics")

class Alert(Base):
    """Alert configuration for users."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    alert_type = Column(String(50))  # new_work, trend_change, competition_change
    threshold_value = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="alerts")
    work = relationship("Work", back_populates="alerts")

class Subscription(Base):
    """User subscription model."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_type = Column(String(50))  # free, basic, premium, enterprise
    status = Column(String(20), default="active")  # active, cancelled, expired
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True))
    stripe_subscription_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions")
