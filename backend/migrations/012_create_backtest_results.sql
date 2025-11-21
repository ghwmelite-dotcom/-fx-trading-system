-- Backtest Results Table for MT5 HTML Report Upload
-- Simplified approach: Users upload MT5 Strategy Tester HTML reports

CREATE TABLE IF NOT EXISTS backtest_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ea_name TEXT NOT NULL,
  description TEXT,

  -- Test Configuration
  symbol TEXT,
  period TEXT,
  model TEXT,
  test_start_date TEXT,
  test_end_date TEXT,

  -- Account Metrics
  initial_deposit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  equity REAL DEFAULT 0,
  total_net_profit REAL DEFAULT 0,
  gross_profit REAL DEFAULT 0,
  gross_loss REAL DEFAULT 0,
  profit_factor REAL DEFAULT 0,

  -- Drawdown
  max_drawdown REAL DEFAULT 0,
  max_drawdown_percent REAL DEFAULT 0,
  relative_drawdown REAL DEFAULT 0,

  -- Trade Statistics
  total_trades INTEGER DEFAULT 0,
  short_positions INTEGER DEFAULT 0,
  long_positions INTEGER DEFAULT 0,
  profit_trades INTEGER DEFAULT 0,
  loss_trades INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  loss_rate REAL DEFAULT 0,
  roi REAL DEFAULT 0,

  -- Trade Extremes
  largest_profit_trade REAL DEFAULT 0,
  largest_loss_trade REAL DEFAULT 0,
  average_profit_trade REAL DEFAULT 0,
  average_loss_trade REAL DEFAULT 0,

  -- Consecutive Stats
  max_consecutive_wins INTEGER DEFAULT 0,
  max_consecutive_losses INTEGER DEFAULT 0,
  max_consecutive_profit REAL DEFAULT 0,
  max_consecutive_loss REAL DEFAULT 0,

  -- Advanced Metrics
  recovery_factor REAL DEFAULT 0,
  sharpe_ratio REAL DEFAULT 0,

  -- Raw Report Data
  report_html TEXT,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_created_at ON backtest_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_results_ea_name ON backtest_results(ea_name);
