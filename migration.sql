-- Migration script to update remote database schema
-- This updates existing tables to match the current API expectations

-- Add missing columns to sessions table
ALTER TABLE sessions ADD COLUMN token_hash TEXT;
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN last_used_at TEXT;

-- Update existing sessions to have token_hash (copy from token for now)
UPDATE sessions SET token_hash = token WHERE token_hash IS NULL;

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN profile_image_url TEXT;

-- Add missing columns to houses table if they don't exist
ALTER TABLE houses ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE houses ADD COLUMN code TEXT DEFAULT '';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_houses_user_id ON houses(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_house_id ON activity_log(house_id);
