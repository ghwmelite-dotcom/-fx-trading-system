-- Migration: 007_backtesting_system.sql
-- Description: Comprehensive backtesting engine and strategy simulator
-- Features: Historical data storage, strategy management, backtest execution, performance analytics

-- ============================================
-- HISTORICAL DATA STORAGE
-- ============================================

-- Store OHLCV data for backtesting (supports multiple timeframes)
CREATE TABLE IF NOT EXISTS historical_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL, -- '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'
  timestamp DATETIME NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL DEFAULT 0,
  spread REAL DEFAULT 0, -- Average spread in pips for the period
  data_source TEXT DEFAULT 'csv', -- 'csv', 'mt5', 'api', 'manual'
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, symbol, timeframe, timestamp)
);

-- Indexes for fast data retrieval during backtesting
CREATE INDEX IF NOT EXISTS idx_historical_data_user_symbol ON historical_data(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_historical_data_symbol_timeframe ON historical_data(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp ON historical_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_historical_data_composite ON historical_data(user_id, symbol, timeframe, timestamp);

-- Track data upload sessions and metadata
CREATE TABLE IF NOT EXISTS data_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  data_source TEXT NOT NULL, -- 'csv', 'mt5', 'api'
  total_bars INTEGER DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  file_url TEXT, -- R2 URL for CSV files
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_uploads_user_id ON data_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_data_uploads_status ON data_uploads(status);

-- ============================================
-- STRATEGY DEFINITIONS
-- ============================================

-- Store trading strategy configurations
CREATE TABLE IF NOT EXISTS strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL, -- 'indicator', 'rules', 'custom'

  -- Indicator-based strategy config (JSON)
  indicator_config TEXT, -- {"type": "ma_crossover", "fast_period": 10, "slow_period": 20, "signal": "sma"}

  -- Rules-based strategy config (JSON array of conditions)
  rules_config TEXT, -- [{"field": "close", "operator": ">", "indicator": "MA", "params": {"period": 20}}]

  -- Custom JavaScript code for advanced strategies
  custom_code TEXT, -- JavaScript function: function execute(bars, indicators) { return signals; }

  -- Entry/Exit rules
  entry_conditions TEXT, -- JSON array of entry rules
  exit_conditions TEXT, -- JSON array of exit rules

  -- Risk management
  stop_loss_type TEXT DEFAULT 'fixed', -- 'fixed', 'atr', 'percentage', 'trailing'
  stop_loss_value REAL, -- Value in pips or percentage
  take_profit_type TEXT DEFAULT 'fixed', -- 'fixed', 'atr', 'percentage', 'risk_reward'
  take_profit_value REAL,
  trailing_stop_enabled INTEGER DEFAULT 0,
  trailing_stop_distance REAL,

  -- Position sizing
  position_size_type TEXT DEFAULT 'fixed', -- 'fixed', 'percentage', 'risk_based'
  position_size_value REAL DEFAULT 0.01, -- Lot size or percentage
  max_risk_per_trade REAL DEFAULT 1.0, -- Max % of account to risk per trade

  -- Strategy metadata
  is_active INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0, -- Allow sharing strategies
  tags TEXT, -- JSON array ["scalping", "trend-following"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_type ON strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategies_active ON strategies(is_active);

-- ============================================
-- BACKTEST CONFIGURATIONS
-- ============================================

-- Store backtest execution configurations
CREATE TABLE IF NOT EXISTS backtests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Instrument and timeframe
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,

  -- Date range
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,

  -- Initial capital and account settings
  initial_capital REAL DEFAULT 10000.0,
  account_currency TEXT DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,

  -- Execution simulation settings
  commission_per_lot REAL DEFAULT 7.0, -- Round-turn commission
  spread_pips REAL, -- Fixed spread (if NULL, use historical spread from data)
  slippage_pips REAL DEFAULT 0.5, -- Estimated slippage
  use_realistic_fills INTEGER DEFAULT 1, -- Enable realistic fill simulation

  -- Market hours modeling
  respect_market_hours INTEGER DEFAULT 0,
  trading_hours_start TEXT, -- "09:00"
  trading_hours_end TEXT, -- "17:00"
  trading_timezone TEXT DEFAULT 'UTC',

  -- Execution status
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100%
  error_message TEXT,

  -- Execution metadata
  bars_processed INTEGER DEFAULT 0,
  execution_time_ms INTEGER, -- Time taken to run backtest
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy_id ON backtests(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtests_status ON backtests(status);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at ON backtests(created_at);

-- ============================================
-- BACKTEST TRADES (SIMULATED)
-- ============================================

-- Store individual trades generated by backtest
CREATE TABLE IF NOT EXISTS backtest_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backtest_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Trade identification
  trade_number INTEGER NOT NULL, -- Sequential trade number in this backtest

  -- Instrument
  symbol TEXT NOT NULL,

  -- Entry
  entry_time DATETIME NOT NULL,
  entry_price REAL NOT NULL,
  entry_signal TEXT, -- 'buy', 'sell'
  entry_reason TEXT, -- Description of why trade was entered

  -- Exit
  exit_time DATETIME,
  exit_price REAL,
  exit_reason TEXT, -- 'stop_loss', 'take_profit', 'trailing_stop', 'signal', 'end_of_period'

  -- Position details
  lot_size REAL NOT NULL,
  position_size_units REAL, -- Actual units traded

  -- Risk management (as executed)
  stop_loss_price REAL,
  take_profit_price REAL,
  risk_reward_ratio REAL,

  -- Performance
  profit_loss REAL, -- P&L in account currency
  profit_loss_pips REAL, -- P&L in pips
  profit_loss_percent REAL, -- % of account
  commission REAL, -- Commission paid
  swap REAL DEFAULT 0, -- Swap/rollover fees
  slippage REAL DEFAULT 0, -- Slippage cost
  net_profit REAL, -- P&L - commission - slippage - swap

  -- Trade duration
  duration_bars INTEGER, -- How many bars the trade lasted
  duration_minutes INTEGER,

  -- Account balance tracking
  balance_before REAL,
  balance_after REAL,
  equity_before REAL,
  equity_after REAL,

  -- Max adverse/favorable excursion
  mae REAL, -- Maximum Adverse Excursion (worst drawdown during trade)
  mfe REAL, -- Maximum Favorable Excursion (best profit during trade)

  -- Trade metadata
  is_winning_trade INTEGER, -- 1 if profitable, 0 if loss
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (backtest_id) REFERENCES backtests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_id ON backtest_trades(backtest_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_user_id ON backtest_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_entry_time ON backtest_trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_symbol ON backtest_trades(symbol);

-- ============================================
-- BACKTEST RESULTS & PERFORMANCE METRICS
-- ============================================

-- Store aggregated backtest performance metrics
CREATE TABLE IF NOT EXISTS backtest_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backtest_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,

  -- Overall Performance
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  break_even_trades INTEGER DEFAULT 0,

  -- Win Rate
  win_rate REAL, -- Percentage
  loss_rate REAL,

  -- Profit Metrics
  gross_profit REAL DEFAULT 0,
  gross_loss REAL DEFAULT 0,
  net_profit REAL DEFAULT 0,
  total_commission REAL DEFAULT 0,
  total_slippage REAL DEFAULT 0,
  total_swap REAL DEFAULT 0,

  -- Return Metrics
  total_return REAL, -- Total % return
  annual_return REAL, -- Annualized return %
  monthly_return_avg REAL,

  -- Profit Factor
  profit_factor REAL, -- Gross profit / Gross loss

  -- Expectancy
  expectancy REAL, -- Average expected profit per trade
  expectancy_percent REAL,

  -- Average Trade Metrics
  avg_trade_profit REAL,
  avg_trade_loss REAL,
  avg_win REAL,
  avg_loss REAL,
  avg_trade_duration_minutes REAL,

  -- Best/Worst Trades
  largest_win REAL,
  largest_loss REAL,
  largest_win_pips REAL,
  largest_loss_pips REAL,

  -- Consecutive Wins/Losses
  max_consecutive_wins INTEGER,
  max_consecutive_losses INTEGER,

  -- Drawdown Analysis
  max_drawdown REAL, -- Maximum drawdown in account currency
  max_drawdown_percent REAL, -- Maximum drawdown %
  max_drawdown_duration_days INTEGER,
  avg_drawdown REAL,

  -- Risk-Adjusted Returns
  sharpe_ratio REAL, -- Risk-adjusted return metric
  sortino_ratio REAL, -- Downside risk-adjusted return
  calmar_ratio REAL, -- Annual return / Max drawdown

  -- Recovery Factor
  recovery_factor REAL, -- Net profit / Max drawdown

  -- R-Multiple Analysis
  avg_r_multiple REAL, -- Average return per unit of risk

  -- Time-based metrics
  trading_days INTEGER,
  avg_trades_per_day REAL,
  avg_trades_per_week REAL,
  avg_trades_per_month REAL,

  -- Final Account State
  final_balance REAL,
  final_equity REAL,
  max_balance REAL,
  min_balance REAL,

  -- Equity Curve Data (JSON)
  equity_curve TEXT, -- [{"date": "2024-01-01", "balance": 10500, "equity": 10450}]

  -- Monthly Returns (JSON)
  monthly_returns TEXT, -- [{"month": "2024-01", "return": 5.2, "trades": 15}]

  -- Drawdown Periods (JSON)
  drawdown_periods TEXT, -- [{"start": "2024-01-15", "end": "2024-01-20", "depth": -250}]

  -- Trade Distribution (JSON)
  trade_distribution TEXT, -- {"0-10": 5, "10-20": 12, "20-50": 8, ...}

  -- Calculation timestamp
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (backtest_id) REFERENCES backtests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backtest_results_backtest_id ON backtest_results(backtest_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_user_id ON backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_sharpe ON backtest_results(sharpe_ratio);
CREATE INDEX IF NOT EXISTS idx_backtest_results_profit_factor ON backtest_results(profit_factor);

-- ============================================
-- BACKTEST COMPARISON & OPTIMIZATION
-- ============================================

-- Store strategy optimization runs (parameter sweeps)
CREATE TABLE IF NOT EXISTS strategy_optimizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,
  name TEXT NOT NULL,

  -- Parameters being optimized (JSON)
  parameters TEXT NOT NULL, -- [{"name": "fast_ma", "min": 5, "max": 50, "step": 5}]

  -- Optimization criteria
  optimization_metric TEXT DEFAULT 'sharpe_ratio', -- 'profit_factor', 'total_return', 'sharpe_ratio'

  -- Symbol and timeframe
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,

  -- Execution status
  status TEXT DEFAULT 'pending',
  total_combinations INTEGER,
  completed_combinations INTEGER DEFAULT 0,

  -- Best result tracking
  best_backtest_id INTEGER,
  best_parameters TEXT, -- JSON of best parameter combination
  best_metric_value REAL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
  FOREIGN KEY (best_backtest_id) REFERENCES backtests(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_optimizations_user_id ON strategy_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_strategy_id ON strategy_optimizations(strategy_id);

-- ============================================
-- BACKTEST VS LIVE COMPARISON
-- ============================================

-- Link backtests to live trading periods for comparison
CREATE TABLE IF NOT EXISTS backtest_live_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  backtest_id INTEGER NOT NULL,
  strategy_id INTEGER NOT NULL,

  -- Live trading period
  live_start_date DATETIME NOT NULL,
  live_end_date DATETIME,

  -- Comparison metrics (backtest vs live)
  backtest_win_rate REAL,
  live_win_rate REAL,
  win_rate_difference REAL,

  backtest_profit_factor REAL,
  live_profit_factor REAL,
  profit_factor_difference REAL,

  backtest_sharpe REAL,
  live_sharpe REAL,
  sharpe_difference REAL,

  backtest_avg_trade REAL,
  live_avg_trade REAL,
  avg_trade_difference REAL,

  -- Slippage analysis
  expected_slippage REAL,
  actual_slippage REAL,
  slippage_difference REAL,

  -- Notes
  notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (backtest_id) REFERENCES backtests(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON backtest_live_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_backtest_id ON backtest_live_comparisons(backtest_id);

-- ============================================
-- VIEWS FOR QUICK ACCESS
-- ============================================

-- Quick overview of user's backtesting activity
CREATE VIEW IF NOT EXISTS backtest_summary AS
SELECT
  b.id,
  b.name,
  b.symbol,
  b.timeframe,
  b.status,
  s.name as strategy_name,
  s.strategy_type,
  br.net_profit,
  br.total_return,
  br.win_rate,
  br.profit_factor,
  br.sharpe_ratio,
  br.max_drawdown_percent,
  br.total_trades,
  b.created_at,
  b.completed_at
FROM backtests b
LEFT JOIN strategies s ON b.strategy_id = s.id
LEFT JOIN backtest_results br ON b.id = br.backtest_id
WHERE b.status = 'completed';

-- Strategy performance across all backtests
CREATE VIEW IF NOT EXISTS strategy_performance AS
SELECT
  s.id as strategy_id,
  s.name as strategy_name,
  s.strategy_type,
  COUNT(b.id) as total_backtests,
  AVG(br.net_profit) as avg_net_profit,
  AVG(br.total_return) as avg_return,
  AVG(br.win_rate) as avg_win_rate,
  AVG(br.profit_factor) as avg_profit_factor,
  AVG(br.sharpe_ratio) as avg_sharpe_ratio,
  MAX(br.total_return) as best_return,
  MIN(br.max_drawdown_percent) as best_drawdown
FROM strategies s
LEFT JOIN backtests b ON s.id = b.strategy_id AND b.status = 'completed'
LEFT JOIN backtest_results br ON b.id = br.backtest_id
GROUP BY s.id, s.name, s.strategy_type;
