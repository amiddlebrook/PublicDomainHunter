-- Migration: Add user API keys storage
-- Created: 2025-01-11
-- Description: Adds encrypted API key storage for BYOK (Bring Your Own Key) model
-- Users must provide their own AI API keys to use the platform

-- Add api_keys column to AIPreference table
-- Stores encrypted JSON object with user's API keys
-- Format: { "openai": "encrypted_key", "claude": "encrypted_key", ... }
ALTER TABLE AIPreference ADD COLUMN api_keys TEXT DEFAULT NULL;

-- Add setup_completed flag to track if user has completed initial setup
ALTER TABLE AIPreference ADD COLUMN setup_completed INTEGER DEFAULT 0;

-- Add subscription tier for monetization
-- Tiers: 'free' (limited features), 'pro' ($29/mo), 'enterprise' (custom)
ALTER TABLE Subscription ADD COLUMN tier TEXT DEFAULT 'free';

-- Add API usage tracking for potential metered billing
CREATE TABLE IF NOT EXISTS APIUsage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    requests_count INTEGER DEFAULT 0,
    usage_date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id)
);

-- Index for efficient usage lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON APIUsage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON APIUsage(provider);

-- Create index for setup_completed lookups
CREATE INDEX IF NOT EXISTS idx_ai_pref_setup ON AIPreference(user_id, setup_completed);
