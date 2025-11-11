-- Public Domain Hunter - D1 (SQLite) Database Schema
-- This schema is compatible with Cloudflare D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  is_active INTEGER DEFAULT 1,
  is_superuser INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Works table
CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT,
  original_publication_year INTEGER,
  public_domain_year INTEGER,
  description TEXT,
  source_url TEXT,
  download_url TEXT,
  media_type TEXT DEFAULT 'book',
  language TEXT DEFAULT 'en',
  page_count INTEGER,
  file_size INTEGER,
  metadata TEXT DEFAULT '{}',
  status TEXT DEFAULT 'active',
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_works_title ON works(title);
CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);

-- Work metrics table
CREATE TABLE IF NOT EXISTS work_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  metric_date TEXT DEFAULT (datetime('now')),
  search_volume INTEGER DEFAULT 0,
  trend_score REAL DEFAULT 0.0,
  competition_score REAL DEFAULT 0.0,
  monetization_potential REAL DEFAULT 0.0,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_work_metrics_work_id ON work_metrics(work_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold_value REAL,
  is_active INTEGER DEFAULT 1,
  last_triggered TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Discovery logs table
CREATE TABLE IF NOT EXISTS discovery_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  total_discovered INTEGER DEFAULT 0,
  sources_data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Competition logs table
CREATE TABLE IF NOT EXISTS competition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  competitor_count INTEGER DEFAULT 0,
  market_saturation TEXT,
  competition_data TEXT DEFAULT '{}',
  analysis_date TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competition_logs_work_id ON competition_logs(work_id);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_files_work_id ON files(work_id);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,
  report_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- AI Preferences table (from migration)
CREATE TABLE IF NOT EXISTS ai_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_model TEXT DEFAULT 'gpt-4',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  custom_prompts TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_preferences_user_id ON ai_preferences(user_id);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
