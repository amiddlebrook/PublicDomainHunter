-- Cloudflare D1 Schema for Public Domain Hunter
-- Based on the SQLAlchemy models in app/models.py

-- Drop tables if they exist to allow for a clean slate
DROP TABLE IF EXISTS UserActivity;
DROP TABLE IF EXISTS AIPreference;
DROP TABLE IF EXISTS Subscription;
DROP TABLE IF EXISTS Alert;
DROP TABLE IF EXISTS WorkMetric;
DROP TABLE IF EXISTS Work;
DROP TABLE IF EXISTS User;

-- User model for authentication and user management
CREATE TABLE User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Public domain work model
CREATE TABLE Work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    original_publication_year INTEGER,
    public_domain_year INTEGER,
    description TEXT,
    source_url TEXT,
    download_url TEXT,
    media_type TEXT,
    language TEXT DEFAULT 'en',
    page_count INTEGER,
    file_size INTEGER,
    metadata TEXT, -- JSON stored as TEXT
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

-- Metrics and analytics for public domain works
CREATE TABLE WorkMetric (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_id INTEGER NOT NULL,
    metric_date TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Legacy metrics (maintained for backwards compatibility)
    search_volume INTEGER DEFAULT 0,
    trend_score REAL DEFAULT 0.0,
    competition_score REAL DEFAULT 0.0,
    demand_score REAL DEFAULT 0.0,
    monetization_potential REAL DEFAULT 0.0,
    amazon_sales_rank INTEGER,
    google_trends_interest REAL DEFAULT 0.0,
    
    -- NEW: Core Monetization Engine Metrics
    master_monetization_score REAL DEFAULT 0.0,     -- Comprehensive 0-100 score
    market_saturation_index REAL DEFAULT 0.0,       -- 0-100 (lower is better)
    cross_platform_score REAL DEFAULT 0.0,          -- 0-100 (multi-format potential)
    demographic_match_score REAL DEFAULT 0.0,       -- 0-100 (audience fit)
    temporal_window_score REAL DEFAULT 0.0,         -- 0-100 (timing opportunity)
    derivative_potential REAL DEFAULT 0.0,          -- 0-100 (spinoff/sequel opportunities)
    competitive_moat_score REAL DEFAULT 0.0,        -- 0-100 (defensibility)
    ai_prediction_score REAL DEFAULT 0.0,           -- 0-100 (LLM consensus)
    patent_invention_score REAL DEFAULT 0.0,        -- 0-100 (tech monetization)
    
    -- Platform-specific potential scores
    film_tv_potential REAL DEFAULT 0.0,             -- 0-100
    game_potential REAL DEFAULT 0.0,                -- 0-100
    audiobook_potential REAL DEFAULT 0.0,           -- 0-100
    merchandise_potential REAL DEFAULT 0.0,         -- 0-100
    educational_potential REAL DEFAULT 0.0,         -- 0-100
    app_potential REAL DEFAULT 0.0,                 -- 0-100
    book_republish_potential REAL DEFAULT 0.0,      -- 0-100
    
    -- Demographic appeal breakdown
    gen_z_appeal REAL DEFAULT 0.0,                  -- 0-100 (ages 18-27)
    millennial_appeal REAL DEFAULT 0.0,             -- 0-100 (ages 28-43)
    gen_x_appeal REAL DEFAULT 0.0,                  -- 0-100 (ages 44-59)
    boomer_appeal REAL DEFAULT 0.0,                 -- 0-100 (ages 60+)
    
    -- Market intelligence data (JSON stored as TEXT)
    saturation_data TEXT,                            -- Existing adaptations count, trademarks, etc.
    ai_analysis TEXT,                                -- LLM insights and predictions
    opportunity_angles TEXT,                         -- Recommended strategies
    comparable_works TEXT,                           -- Similar successful monetizations
    
    -- Metadata
    metadata TEXT,                                   -- Additional metrics data
    calculation_version TEXT DEFAULT 'v1.0',        -- Track algorithm version
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

-- Alert configuration for users
CREATE TABLE Alert (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    alert_type TEXT,
    threshold_value REAL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

-- User subscription model
CREATE TABLE Subscription (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_type TEXT,
    status TEXT DEFAULT 'active',
    start_date TEXT DEFAULT CURRENT_TIMESTAMP,
    end_date TEXT,
    stripe_subscription_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

-- User AI provider preferences and settings
CREATE TABLE AIPreference (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    enabled_providers TEXT, -- JSON array stored as TEXT
    default_provider TEXT,
    mix_providers INTEGER DEFAULT 0,
    provider_settings TEXT, -- JSON object stored as TEXT
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

-- Track user activity for AI recommendations
CREATE TABLE UserActivity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    activity_type TEXT,
    metadata TEXT, -- JSON object stored as TEXT
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id),
    FOREIGN KEY (work_id) REFERENCES Work(id)
);

-- Create indexes for commonly queried columns
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_work_title ON Work(title);
CREATE INDEX idx_work_author ON Work(author);
CREATE INDEX idx_work_media_type ON Work(media_type);

-- Indexes for monetization metrics (for fast opportunity queries)
CREATE INDEX idx_metric_work_date ON WorkMetric(work_id, metric_date DESC);
CREATE INDEX idx_master_score ON WorkMetric(master_monetization_score DESC);
CREATE INDEX idx_market_saturation ON WorkMetric(market_saturation_index ASC);
CREATE INDEX idx_temporal_window ON WorkMetric(temporal_window_score DESC);
CREATE INDEX idx_film_tv_potential ON WorkMetric(film_tv_potential DESC);
CREATE INDEX idx_game_potential ON WorkMetric(game_potential DESC);
