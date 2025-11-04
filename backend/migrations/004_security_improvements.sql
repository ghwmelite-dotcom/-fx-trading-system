-- Migration 004: Security Improvements
-- Adds must_change_password flag for forcing password changes
-- Run with: wrangler d1 migrations apply fx-trading-db --remote

-- Add must_change_password column to users table
ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0;

-- Set must_change_password=1 for the default admin user (force password change)
UPDATE users SET must_change_password = 1 WHERE username = 'admin';

-- Add last_password_change timestamp
ALTER TABLE users ADD COLUMN last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add failed_login_attempts for future rate limiting
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;

-- Add last_failed_login timestamp
ALTER TABLE users ADD COLUMN last_failed_login DATETIME;

-- Add account_locked flag
ALTER TABLE users ADD COLUMN account_locked INTEGER DEFAULT 0;
