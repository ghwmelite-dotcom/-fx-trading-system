-- Migration: 009_ea_upload_system.sql
-- Description: EA Upload and Backtesting System
-- Adds tables for storing uploaded Expert Advisors, their transpiled code, and backtest results

-- Store uploaded Expert Advisors
CREATE TABLE IF NOT EXISTS expert_advisors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  original_code TEXT NOT NULL, -- Original MQL5 source code
  transpiled_code TEXT, -- Generated JavaScript code
  parameters TEXT, -- JSON array of input parameters with metadata
  version TEXT DEFAULT '1.0',
  file_size INTEGER, -- Size in bytes
  is_public INTEGER DEFAULT 0, -- Whether EA is shared publicly
  parse_errors TEXT, -- JSON array of parse errors if any
  status TEXT DEFAULT 'active', -- active, archived, error
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Track EA backtest runs
CREATE TABLE IF NOT EXISTS ea_backtests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ea_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  dataset_id INTEGER NOT NULL,
  parameters TEXT, -- JSON of parameter values used for this run
  config TEXT, -- JSON of backtest configuration (initial balance, spread, etc.)
  results TEXT, -- JSON of comprehensive backtest results
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  logs TEXT, -- JSON array of execution logs
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (ea_id) REFERENCES expert_advisors(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Track EA backtest performance metrics for quick comparison
CREATE TABLE IF NOT EXISTS ea_backtest_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backtest_id INTEGER NOT NULL UNIQUE,
  net_profit REAL,
  total_return REAL,
  profit_factor REAL,
  sharpe_ratio REAL,
  max_drawdown REAL,
  win_rate REAL,
  total_trades INTEGER,
  avg_trade REAL,
  expectancy REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (backtest_id) REFERENCES ea_backtests(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_eas_user ON expert_advisors(user_id);
CREATE INDEX IF NOT EXISTS idx_eas_status ON expert_advisors(status);
CREATE INDEX IF NOT EXISTS idx_eas_public ON expert_advisors(is_public);

CREATE INDEX IF NOT EXISTS idx_ea_backtests_ea ON ea_backtests(ea_id);
CREATE INDEX IF NOT EXISTS idx_ea_backtests_user ON ea_backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_ea_backtests_dataset ON ea_backtests(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ea_backtests_status ON ea_backtests(status);

CREATE INDEX IF NOT EXISTS idx_ea_metrics_backtest ON ea_backtest_metrics(backtest_id);
CREATE INDEX IF NOT EXISTS idx_ea_metrics_profit_factor ON ea_backtest_metrics(profit_factor);
CREATE INDEX IF NOT EXISTS idx_ea_metrics_sharpe ON ea_backtest_metrics(sharpe_ratio);
