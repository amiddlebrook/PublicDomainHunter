"""
Database models for Public Domain Hunter.

Defines the database schema using SQLAlchemy ORM.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from .database import Base

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
    works = relationship("Work", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    ai_preferences = relationship(
        "AIPreference",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    activities = relationship(
        "UserActivity",
        back_populates="user",
        cascade="all, delete-orphan",
    )

class Work(Base):
    """
    Public domain work/IP asset model.

    Supports multiple IP types:
    - book, document, image, audio, video (original types)
    - patent (utility, design, plant, reissue)
    - trademark (word, design, combined, sound)
    - scientific_paper (journal articles, preprints)
    - music_score (sheet music, compositions)
    - design (industrial designs)
    - software (public domain code)
    - dataset (government/research data)
    """

    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    author = Column(String(255))
    original_publication_year = Column(Integer)
    public_domain_year = Column(Integer)
    description = Column(Text)
    source_url = Column(String(500))
    download_url = Column(String(500))
    media_type = Column(String(50))  # book, document, image, audio, video, patent, trademark, scientific_paper, music_score
    language = Column(String(10), default="en")
    page_count = Column(Integer)
    file_size = Column(Integer)  # in bytes
    additional_metadata = Column(JSON)  # Additional metadata as JSON
    status = Column(String(20), default="active")  # active, archived, deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ===== PATENT-SPECIFIC FIELDS =====
    patent_number = Column(String(50), index=True)
    patent_type = Column(String(20))  # utility, design, plant, reissue
    filing_date = Column(DateTime(timezone=True))
    grant_date = Column(DateTime(timezone=True))
    expiration_date = Column(DateTime(timezone=True), index=True)
    inventors = Column(JSON)  # [{name, city, country}]
    assignee = Column(String(255))
    cpc_codes = Column(JSON)  # Array of CPC classification codes
    claims_count = Column(Integer)
    citation_count = Column(Integer)
    abstract = Column(Text)

    # ===== TRADEMARK-SPECIFIC FIELDS =====
    registration_number = Column(String(50), index=True)
    serial_number = Column(String(50))
    mark_type = Column(String(20))  # word, design, combined, sound
    trademark_status = Column(String(20), index=True)  # live, dead, cancelled, expired, abandoned
    abandonment_date = Column(DateTime(timezone=True))
    word_mark = Column(String(500))
    nice_classes = Column(JSON)  # Array of Nice classification integers
    goods_services = Column(JSON)  # Array of goods/services descriptions

    # ===== SCIENTIFIC PAPER FIELDS =====
    doi = Column(String(100), index=True)
    pmid = Column(String(20))
    arxiv_id = Column(String(50))
    journal = Column(String(255))
    publication_date = Column(DateTime(timezone=True))
    authors = Column(JSON)  # [{name, affiliation}]
    keywords = Column(JSON)  # Array of keywords
    oa_status = Column(String(20))  # gold, green, bronze, hybrid, closed

    # ===== MUSIC-SPECIFIC FIELDS =====
    composer = Column(String(255), index=True)
    opus_number = Column(String(50))
    instrumentation = Column(JSON)  # Array of instruments
    duration_seconds = Column(Integer)
    score_url = Column(String(500))

    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="works")
    metrics = relationship("WorkMetric", back_populates="work", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="work", cascade="all, delete-orphan")
    activities = relationship(
        "UserActivity",
        back_populates="work",
        cascade="all, delete-orphan",
    )
    patent_claims = relationship("PatentClaim", back_populates="work", cascade="all, delete-orphan")
    patent_drawings = relationship("PatentDrawing", back_populates="work", cascade="all, delete-orphan")

class WorkMetric(Base):
    """Metrics and analytics for public domain works/IP assets."""
    __tablename__ = "work_metrics"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    metric_date = Column(DateTime(timezone=True), server_default=func.now())

    # Legacy metrics
    search_volume = Column(Integer, default=0)
    trend_score = Column(Float, default=0.0)
    competition_score = Column(Float, default=0.0)
    demand_score = Column(Float, default=0.0)
    monetization_potential = Column(Float, default=0.0)
    amazon_sales_rank = Column(Integer)
    google_trends_interest = Column(Float, default=0.0)

    # Core monetization engine metrics
    master_monetization_score = Column(Float, default=0.0)
    market_saturation_index = Column(Float, default=0.0)
    cross_platform_score = Column(Float, default=0.0)
    demographic_match_score = Column(Float, default=0.0)
    temporal_window_score = Column(Float, default=0.0)
    derivative_potential = Column(Float, default=0.0)
    competitive_moat_score = Column(Float, default=0.0)
    ai_prediction_score = Column(Float, default=0.0)
    patent_invention_score = Column(Float, default=0.0)

    # Platform-specific scores
    film_tv_potential = Column(Float, default=0.0)
    game_potential = Column(Float, default=0.0)
    audiobook_potential = Column(Float, default=0.0)
    merchandise_potential = Column(Float, default=0.0)
    educational_potential = Column(Float, default=0.0)
    app_potential = Column(Float, default=0.0)
    book_republish_potential = Column(Float, default=0.0)

    # Demographic appeal
    gen_z_appeal = Column(Float, default=0.0)
    millennial_appeal = Column(Float, default=0.0)
    gen_x_appeal = Column(Float, default=0.0)
    boomer_appeal = Column(Float, default=0.0)

    # ===== PATENT-SPECIFIC METRICS =====
    manufacturing_complexity = Column(Float, default=0.0)  # 0-100 (lower is easier)
    component_availability = Column(Float, default=0.0)  # 0-100 (higher is better)
    regulatory_barriers = Column(Float, default=0.0)  # 0-100 (lower is better)
    technology_readiness_level = Column(Integer)  # TRL 1-9
    licensing_potential = Column(Float, default=0.0)
    direct_manufacturing_score = Column(Float, default=0.0)
    improvement_patents_count = Column(Integer, default=0)
    workaround_complexity = Column(Float, default=0.0)

    # ===== TRADEMARK-SPECIFIC METRICS =====
    mark_strength = Column(String(20))  # generic, descriptive, suggestive, arbitrary, fanciful
    revival_risk = Column(Float, default=0.0)  # 0-100 (lower is better)
    domain_availability = Column(Float, default=0.0)  # 0-100
    social_handle_availability = Column(Float, default=0.0)  # 0-100
    conflict_risk = Column(Float, default=0.0)  # 0-100 (lower is better)

    # ===== SCIENTIFIC PAPER METRICS =====
    citation_velocity = Column(Float, default=0.0)  # Citations per year
    altmetric_score = Column(Float, default=0.0)
    practical_application_score = Column(Float, default=0.0)

    # JSON data fields
    saturation_data = Column(JSON)
    ai_analysis = Column(JSON)
    opportunity_angles = Column(JSON)
    comparable_works = Column(JSON)
    additional_metadata = Column(JSON)

    calculation_version = Column(String(20), default="v2.0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    work = relationship("Work", back_populates="metrics")


class PatentClaim(Base):
    """Individual patent claims for detailed analysis."""
    __tablename__ = "patent_claims"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    claim_number = Column(Integer, nullable=False)
    claim_type = Column(String(20), nullable=False)  # independent, dependent
    claim_text = Column(Text, nullable=False)
    parent_claim_id = Column(Integer, ForeignKey("patent_claims.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work = relationship("Work", back_populates="patent_claims")
    parent_claim = relationship("PatentClaim", remote_side=[id])


class PatentDrawing(Base):
    """Patent drawings/figures."""
    __tablename__ = "patent_drawings"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    drawing_number = Column(Integer, nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    thumbnail_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work = relationship("Work", back_populates="patent_drawings")


class PublicDomainEntry(Base):
    """Track works entering the public domain."""
    __tablename__ = "public_domain_entries"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"))
    ip_type = Column(String(20), nullable=False)  # patent, copyright, trademark
    entry_year = Column(Integer, nullable=False, index=True)
    entry_date = Column(DateTime(timezone=True))
    jurisdiction = Column(String(10), default="US")
    reason = Column(String(50))  # expiration, abandonment, dedication
    original_term_years = Column(Integer)
    notable = Column(Boolean, default=False, index=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work = relationship("Work")


class SavedSearch(Base):
    """User saved searches with optional alerts."""
    __tablename__ = "saved_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    search_type = Column(String(20), nullable=False)  # patent, trademark, scientific, all
    query = Column(Text, nullable=False)
    filters = Column(JSON)
    alert_enabled = Column(Boolean, default=False)
    alert_frequency = Column(String(20), default="weekly")  # daily, weekly, monthly
    last_alert_sent = Column(DateTime(timezone=True))
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")

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

class AIPreference(Base):
    """User AI provider preferences and settings."""
    __tablename__ = "ai_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Enabled providers (stored as JSON array)
    enabled_providers = Column(JSON, default=list)  # List of provider names

    # Default provider to use
    default_provider = Column(String(50))

    # Whether to mix responses from multiple providers
    mix_providers = Column(Boolean, default=False)

    # Provider-specific settings
    provider_settings = Column(JSON, default=dict)  # Settings per provider

    # Generation settings
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4000)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="ai_preferences")

class UserActivity(Base):
    """Track user activity for AI recommendations."""
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    activity_type = Column(String(50))  # view, search, download, bookmark
    additional_metadata = Column(JSON)  # Additional activity data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="activities")
    work = relationship("Work", back_populates="activities")
