-- Migration: 008_data_source_tracking.sql
-- Description: Add data source tracking, API key management, and automatic update scheduling
-- Extends the backtesting system with multi-source data fetching capabilities

-- ============================================
-- EXTEND DATASETS TABLE
-- ============================================

-- Add columns to track data source and fetch configuration
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we'll add these directly

-- Add source tracking
ALTER TABLE historical_data ADD COLUMN fetch_source TEXT DEFAULT 'csv';
-- Possible values: 'csv', 'alphavantage', 'yahoo', 'twelvedata', 'merged', 'manual'

ALTER TABLE historical_data ADD COLUMN is_gap_filled INTEGER DEFAULT 0;
-- Mark candles that were generated to fill gaps (not real market data)

-- ============================================
-- DATASETS METADATA TABLE
-- ============================================

-- Create a dedicated table for dataset-level metadata
-- This tracks upload/fetch sessions and configurations
CREATE TABLE IF NOT EXISTS datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,

  -- Data source information
  data_source TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'alphavantage', 'yahoo', 'twelvedata', 'merged'
  fetch_config TEXT, -- JSON config: {"sources": ["yahoo", "alphavantage"], "apiKeys": {...}, "mergeStrategy": "prefer-newest"}

  -- Data statistics
  total_candles INTEGER DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  gaps_filled INTEGER DEFAULT 0,
  validation_issues INTEGER DEFAULT 0,

  -- Automatic updates
  auto_update INTEGER DEFAULT 0, -- 1 if scheduled for automatic updates
  update_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  update_time TEXT, -- UTC time in HH:MM format
  last_updated DATETIME,
  next_update DATETIME,

  -- Metadata
  description TEXT,
  tags TEXT, -- JSON array
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, symbol, timeframe, name)
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_symbol ON datasets(symbol);
CREATE INDEX IF NOT EXISTS idx_datasets_auto_update ON datasets(auto_update);
CREATE INDEX IF NOT EXISTS idx_datasets_next_update ON datasets(next_update);

-- ============================================
-- API KEY STORAGE (ENCRYPTED)
-- ============================================

-- Store user API keys for data providers
-- SECURITY NOTE: In production, these should be encrypted at rest
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'alphavantage', 'twelvedata', 'polygon', 'finnhub', etc.
  api_key TEXT NOT NULL, -- Encrypted in production

  -- Key metadata
  key_name TEXT, -- User-friendly name (e.g., "My Alpha Vantage Key")
  tier TEXT DEFAULT 'free', -- 'free', 'premium', 'enterprise'

  -- Rate limiting tracking
  daily_limit INTEGER,
  monthly_limit INTEGER,

  -- Status
  is_active INTEGER DEFAULT 1,
  last_used DATETIME,
  last_error TEXT,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- For keys with expiration

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider, key_name)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- API USAGE TRACKING
-- ============================================

-- Track API calls for rate limiting and usage analytics
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  provider TEXT NOT NULL,
  endpoint TEXT, -- Specific endpoint called (e.g., 'FX_DAILY', 'time_series')

  -- Request details
  symbol TEXT,
  timeframe TEXT,
  request_params TEXT, -- JSON of parameters

  -- Response details
  status TEXT DEFAULT 'success', -- 'success', 'error', 'rate_limit', 'timeout'
  status_code INTEGER,
  error_message TEXT,
  candles_fetched INTEGER DEFAULT 0,
  response_time_ms INTEGER,

  -- Rate limiting
  calls_count INTEGER DEFAULT 1,

  -- Timestamps
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  date DATE DEFAULT CURRENT_DATE,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_usage_provider_date ON api_usage(provider, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status);

-- ============================================
-- DATA FETCH JOBS (FOR ASYNC PROCESSING)
-- ============================================

-- Track long-running data fetch operations
CREATE TABLE IF NOT EXISTS data_fetch_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dataset_id INTEGER,

  -- Job configuration
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  sources TEXT NOT NULL, -- JSON array of sources to try

  -- Fetch configuration
  merge_strategy TEXT DEFAULT 'prefer-newest',
  fill_gaps INTEGER DEFAULT 1,
  validate_data INTEGER DEFAULT 1,
  api_keys TEXT, -- JSON object with API keys

  -- Job status
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100%
  current_step TEXT,

  -- Results
  candles_fetched INTEGER DEFAULT 0,
  gaps_filled INTEGER DEFAULT 0,
  validation_issues INTEGER DEFAULT 0,
  primary_source TEXT, -- Source that provided most data
  sources_used TEXT, -- JSON array of sources actually used

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fetch_jobs_user_id ON data_fetch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_status ON data_fetch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_created_at ON data_fetch_jobs(created_at);

-- ============================================
-- SCHEDULED UPDATES
-- ============================================

-- Track scheduled dataset update tasks
CREATE TABLE IF NOT EXISTS scheduled_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Schedule configuration
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  time_utc TEXT NOT NULL, -- Time in HH:MM format
  day_of_week INTEGER, -- 0-6 for weekly updates (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly updates

  -- Update configuration
  fetch_config TEXT, -- JSON config for fetching

  -- Status
  is_active INTEGER DEFAULT 1,
  last_run DATETIME,
  last_status TEXT, -- 'success', 'failed', 'skipped'
  last_error TEXT,
  next_run DATETIME,

  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduled_updates_dataset_id ON scheduled_updates(dataset_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_next_run ON scheduled_updates(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_active ON scheduled_updates(is_active);

-- ============================================
-- DATA QUALITY REPORTS
-- ============================================

-- Track data quality metrics for each dataset
CREATE TABLE IF NOT EXISTS data_quality_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Quality metrics
  total_candles INTEGER,
  valid_candles INTEGER,
  invalid_candles INTEGER,
  gap_filled_candles INTEGER,

  -- OHLC validation
  ohlc_errors INTEGER DEFAULT 0,
  zero_price_errors INTEGER DEFAULT 0,
  extreme_movement_errors INTEGER DEFAULT 0,
  timestamp_errors INTEGER DEFAULT 0,

  -- Gap analysis
  total_gaps INTEGER DEFAULT 0,
  max_gap_size INTEGER DEFAULT 0, -- In number of missing candles
  avg_gap_size REAL DEFAULT 0,

  -- Coverage
  expected_candles INTEGER, -- Based on timeframe and date range
  coverage_percent REAL, -- Actual / Expected * 100

  -- Issues (JSON array)
  issues TEXT, -- [{"timestamp": "...", "type": "...", "description": "..."}]

  report_date DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quality_reports_dataset_id ON data_quality_reports(dataset_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_report_date ON data_quality_reports(report_date);

-- ============================================
-- VIEWS FOR QUICK ACCESS
-- ============================================

-- Overview of all datasets with quality metrics
CREATE VIEW IF NOT EXISTS dataset_overview AS
SELECT
  d.id,
  d.user_id,
  d.name,
  d.symbol,
  d.timeframe,
  d.data_source,
  d.total_candles,
  d.start_date,
  d.end_date,
  d.gaps_filled,
  d.validation_issues,
  d.auto_update,
  d.last_updated,
  d.next_update,
  d.is_active,
  d.created_at,
  q.coverage_percent,
  q.ohlc_errors,
  q.total_gaps
FROM datasets d
LEFT JOIN (
  SELECT
    dataset_id,
    coverage_percent,
    ohlc_errors,
    total_gaps,
    ROW_NUMBER() OVER (PARTITION BY dataset_id ORDER BY report_date DESC) as rn
  FROM data_quality_reports
) q ON d.id = q.dataset_id AND q.rn = 1;

-- API usage summary by provider and day
CREATE VIEW IF NOT EXISTS api_usage_summary AS
SELECT
  provider,
  date,
  COUNT(*) as total_calls,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_calls,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_calls,
  SUM(CASE WHEN status = 'rate_limit' THEN 1 ELSE 0 END) as rate_limited_calls,
  SUM(candles_fetched) as total_candles_fetched,
  AVG(response_time_ms) as avg_response_time_ms
FROM api_usage
GROUP BY provider, date;

-- User's API key status
CREATE VIEW IF NOT EXISTS user_api_keys_status AS
SELECT
  ak.id,
  ak.user_id,
  ak.provider,
  ak.key_name,
  ak.tier,
  ak.is_active,
  ak.daily_limit,
  ak.monthly_limit,
  ak.last_used,
  ak.created_at,
  ak.expires_at,
  COALESCE(daily.calls_today, 0) as calls_today,
  COALESCE(monthly.calls_this_month, 0) as calls_this_month
FROM api_keys ak
LEFT JOIN (
  SELECT user_id, provider, COUNT(*) as calls_today
  FROM api_usage
  WHERE date = CURRENT_DATE
  GROUP BY user_id, provider
) daily ON ak.user_id = daily.user_id AND ak.provider = daily.provider
LEFT JOIN (
  SELECT user_id, provider, COUNT(*) as calls_this_month
  FROM api_usage
  WHERE date >= date('now', 'start of month')
  GROUP BY user_id, provider
) monthly ON ak.user_id = monthly.user_id AND ak.provider = monthly.provider;
