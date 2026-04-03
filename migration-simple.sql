-- Careful migration script for remote database
-- Only adds columns that don't already exist

-- Add missing columns to sessions table
ALTER TABLE sessions ADD COLUMN token_hash TEXT;
ALTER TABLE sessions ADD COLUMN ip_address TEXT;  
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN last_used_at TEXT;

-- Update existing sessions to have token_hash (copy from token for now)
UPDATE sessions SET token_hash = token WHERE token_hash IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_sessions_user_agent ON sessions(user_agent);
CREATE INDEX IF NOT EXISTS idx_sessions_last_used_at ON sessions(last_used_at);
