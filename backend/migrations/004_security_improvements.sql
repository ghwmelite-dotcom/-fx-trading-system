-- Migration 004: Security Improvements
-- Adds must_change_password flag for forcing password changes
-- Run with: wrangler d1 migrations apply fx-trading-db --remote

-- Add must_change_password column to users table
ALTER TABLE users ADD COLUMN must_change_password INTEGER;

-- Set must_change_password=0 for existing users, 1 for admin
UPDATE users SET must_change_password = 0 WHERE must_change_password IS NULL;
UPDATE users SET must_change_password = 1 WHERE username = 'admin';

-- Add last_password_change timestamp
ALTER TABLE users ADD COLUMN last_password_change DATETIME;

-- Add failed_login_attempts for future rate limiting
-- ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER;  -- Already exists
-- UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;

-- Add last_failed_login timestamp
ALTER TABLE users ADD COLUMN last_failed_login DATETIME;

-- Add account_locked flag
ALTER TABLE users ADD COLUMN account_locked INTEGER;
UPDATE users SET account_locked = 0 WHERE account_locked IS NULL;
