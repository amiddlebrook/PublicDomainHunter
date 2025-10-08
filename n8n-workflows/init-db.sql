-- Public Domain Hunter - PostgreSQL initialization script
-- Run: psql -U <user> -d <db> -f init-db.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_superuser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Works
CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  original_publication_year INTEGER,
  public_domain_year INTEGER,
  description TEXT,
  source_url VARCHAR(500),
  download_url VARCHAR(500),
  media_type VARCHAR(50) DEFAULT 'book',
  language VARCHAR(10) DEFAULT 'en',
  page_count INTEGER,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_works_title ON works USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_works_metadata ON works USING GIN (metadata);

-- Work metrics
CREATE TABLE IF NOT EXISTS work_metrics (
  id SERIAL PRIMARY KEY,
  work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  metric_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_volume INTEGER DEFAULT 0,
  trend_score FLOAT DEFAULT 0.0,
  competition_score FLOAT DEFAULT 0.0,
  monetization_potential FLOAT DEFAULT 0.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_metrics_work_id ON work_metrics(work_id);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  threshold_value FLOAT,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Discovery logs
CREATE TABLE IF NOT EXISTS discovery_logs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(200),
  total_discovered INTEGER DEFAULT 0,
  sources_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competition logs
CREATE TABLE IF NOT EXISTS competition_logs (
  id SERIAL PRIMARY KEY,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  competitor_count INTEGER DEFAULT 0,
  market_saturation VARCHAR(50),
  competition_data JSONB DEFAULT '{}',
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_works_updated_at BEFORE UPDATE ON works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default admin (change password in production)
INSERT INTO users (email, username, hashed_password, full_name, is_superuser) VALUES
('admin@publicdomainhunter.com','admin','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU.pSMvF6hKm','Administrator',TRUE)
ON CONFLICT (username) DO NOTHING;