"""
Pydantic schemas for request/response validation.

Defines the data models used for API requests and responses.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    """Enum for different media types."""
    BOOK = "book"
    DOCUMENT = "document"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    PATENT = "patent"
    TRADEMARK = "trademark"
    SCIENTIFIC_PAPER = "scientific_paper"
    MUSIC_SCORE = "music_score"
    DESIGN = "design"
    SOFTWARE = "software"
    DATASET = "dataset"

class WorkStatus(str, Enum):
    """Enum for work status."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"

class AlertType(str, Enum):
    """Enum for alert types."""
    NEW_WORK = "new_work"
    TREND_CHANGE = "trend_change"
    COMPETITION_CHANGE = "competition_change"

class SubscriptionPlan(str, Enum):
    """Enum for subscription plans."""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

# Base schemas
class WorkBase(BaseModel):
    """Base schema for work data."""
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=255)
    original_publication_year: Optional[int] = None
    public_domain_year: Optional[int] = None
    description: Optional[str] = None
    source_url: Optional[str] = Field(None, max_length=500)
    download_url: Optional[str] = Field(None, max_length=500)
    media_type: MediaType = MediaType.BOOK
    language: str = "en"
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class UserBase(BaseModel):
    """Base schema for user data."""
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=255)
    is_active: bool = True
    is_superuser: bool = False

# Request schemas
class WorkCreate(WorkBase):
    """Schema for creating a new work."""
    pass

class WorkUpdate(BaseModel):
    """Schema for updating a work."""
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=255)
    original_publication_year: Optional[int] = None
    public_domain_year: Optional[int] = None
    description: Optional[str] = None
    source_url: Optional[str] = Field(None, max_length=500)
    download_url: Optional[str] = Field(None, max_length=500)
    media_type: Optional[MediaType] = None
    language: Optional[str] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[WorkStatus] = None

class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8)

class AlertCreate(BaseModel):
    """Schema for creating an alert."""
    work_id: int
    alert_type: AlertType
    threshold_value: Optional[float] = None
    is_active: bool = True

# Response schemas
class WorkResponse(WorkBase):
    """Schema for work response."""
    id: int
    status: WorkStatus
    created_at: datetime
    updated_at: Optional[datetime]
    user_id: Optional[int]

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class WorkMetricResponse(BaseModel):
    """Schema for work metrics response."""
    id: int
    work_id: int
    metric_date: datetime
    search_volume: int
    trend_score: float
    competition_score: float
    demand_score: float
    monetization_potential: float
    amazon_sales_rank: Optional[int]
    google_trends_interest: float
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    """Schema for alert response."""
    id: int
    user_id: int
    work_id: int
    alert_type: AlertType
    threshold_value: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class SearchResponse(BaseModel):
    """Schema for search response."""
    query: str
    total_results: int
    works: List[WorkResponse]

# Authentication schemas
class Token(BaseModel):
    """Schema for authentication token."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for token data."""
    username: Optional[str] = None

class UserInDBBase(UserBase):
    """Base schema for user in database."""
    id: Optional[int] = None
    hashed_password: str

    class Config:
        from_attributes = True

class UserInDB(UserInDBBase):
    """Schema for user in database (complete)."""
    pass

# Subscription schemas
class SubscriptionResponse(BaseModel):
    """Schema for subscription response."""
    id: int
    user_id: int
    plan_type: SubscriptionPlan
    status: str
    start_date: datetime
    end_date: Optional[datetime]
    stripe_subscription_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Analytics schemas
class TrendData(BaseModel):
    """Schema for trend data."""
    date: datetime
    value: float
    metric_type: str

class CompetitionAnalysis(BaseModel):
    """Schema for competition analysis."""
    work_id: int
    competitor_count: int
    average_score: float
    top_competitors: List[Dict[str, Any]]

# Dashboard schemas
class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    total_works: int
    new_works_today: int
    total_users: int
    active_alerts: int
    average_trend_score: float
    top_performing_works: List[WorkResponse]
