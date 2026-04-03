-- Safe schema fix - add missing columns without dropping data
-- Run with: wrangler d1 execute housing-editor --remote --file fix-schema.sql

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN profile_image_url TEXT;

-- Add missing columns to houses table if they don't exist  
ALTER TABLE houses ADD COLUMN thumbnail_url TEXT;
ALTER TABLE houses ADD COLUMN is_public INTEGER DEFAULT 0;

-- Make sure sessions table has all required columns
ALTER TABLE sessions ADD COLUMN token_hash TEXT;
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_houses_user_id ON houses(user_id);
CREATE INDEX IF NOT EXISTS idx_houses_is_public ON houses(is_public);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
