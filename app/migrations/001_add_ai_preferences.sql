-- Migration: Add AI preferences and user activity tables
-- Created: 2025-11-05
-- Description: Adds tables for storing user AI provider preferences and activity tracking

-- Create ai_preferences table
CREATE TABLE IF NOT EXISTS ai_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    enabled_providers JSON DEFAULT '[]'::json,
    default_provider VARCHAR(50),
    mix_providers BOOLEAN DEFAULT FALSE,
    provider_settings JSON DEFAULT '{}'::json,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    work_id INTEGER NOT NULL REFERENCES works(id),
    activity_type VARCHAR(50),
    metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_preferences_user_id ON ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_work_id ON user_activities(work_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Add comments to tables
COMMENT ON TABLE ai_preferences IS 'Stores user preferences for AI provider configuration';
COMMENT ON TABLE user_activities IS 'Tracks user activity for AI recommendations';

-- Add comments to columns
COMMENT ON COLUMN ai_preferences.enabled_providers IS 'JSON array of enabled provider names';
COMMENT ON COLUMN ai_preferences.default_provider IS 'Default provider to use when only one is needed';
COMMENT ON COLUMN ai_preferences.mix_providers IS 'Whether to mix responses from multiple providers';
COMMENT ON COLUMN ai_preferences.provider_settings IS 'Provider-specific settings as JSON';
COMMENT ON COLUMN ai_preferences.temperature IS 'Temperature for LLM generation (0.0-2.0)';
COMMENT ON COLUMN ai_preferences.max_tokens IS 'Maximum tokens for LLM generation';

COMMENT ON COLUMN user_activities.activity_type IS 'Type of activity: view, search, download, bookmark';
COMMENT ON COLUMN user_activities.metadata IS 'Additional activity data as JSON';
