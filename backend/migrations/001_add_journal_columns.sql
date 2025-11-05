-- Migration: Add Trade Journal columns to trades table
-- Date: November 4, 2025
-- Description: Adds notes, tags, ratings, emotions, and screenshot fields for trade journaling

-- Add journal columns to trades table
ALTER TABLE trades ADD COLUMN notes TEXT;
ALTER TABLE trades ADD COLUMN tags TEXT; -- JSON array stored as text (e.g., '["scalping","trend-following"]')
ALTER TABLE trades ADD COLUMN rating INTEGER; -- Overall trade rating (1-5 stars)
ALTER TABLE trades ADD COLUMN setup_quality INTEGER; -- Setup rating (1-5 stars)
ALTER TABLE trades ADD COLUMN execution_quality INTEGER; -- Execution rating (1-5 stars)
ALTER TABLE trades ADD COLUMN emotions TEXT; -- JSON array stored as text (e.g., '["confident","patient"]')
ALTER TABLE trades ADD COLUMN screenshot_url TEXT; -- Cloudflare R2 URL for trade screenshot
ALTER TABLE trades ADD COLUMN lessons_learned TEXT; -- Key takeaways from the trade
ALTER TABLE trades ADD COLUMN updated_at DATETIME; -- Last journal update timestamp

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_trades_tags ON trades(tags);

-- Migration verification query
-- SELECT COUNT(*) as total_trades,
--        COUNT(notes) as trades_with_notes,
--        COUNT(tags) as trades_with_tags,
--        COUNT(screenshot_url) as trades_with_screenshots
-- FROM trades;
