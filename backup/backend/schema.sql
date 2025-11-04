-- FX Trading Dashboard - D1 Database Schema
-- Run these commands to set up your database

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    broker TEXT NOT NULL,
    balance REAL DEFAULT 0,
    account_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    pair TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
    size REAL NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL NOT NULL,
    pnl REAL NOT NULL,
    account_id INTEGER NOT NULL,
    ticket INTEGER UNIQUE,  -- MT4/MT5 ticket number (prevents duplicates)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(pair);
CREATE INDEX IF NOT EXISTS idx_trades_ticket ON trades(ticket);

-- Insert sample accounts (optional)
INSERT INTO accounts (name, broker, balance, account_number) VALUES
    ('FTMO Challenge', 'FTMO', 10000, 'FTMO-12345'),
    ('Funded Account', 'The5ers', 25000, 'T5-67890'),
    ('Personal Account', 'IC Markets', 5000, 'ICM-11111');

-- Insert sample trades (optional - for testing)
INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id) VALUES
    ('2025-10-20', 'EUR/USD', 'buy', 0.1, 1.0850, 1.0870, 20.00, 1),
    ('2025-10-20', 'GBP/USD', 'sell', 0.2, 1.2650, 1.2630, 40.00, 1),
    ('2025-10-19', 'USD/JPY', 'buy', 0.15, 149.50, 149.80, 30.00, 2),
    ('2025-10-19', 'EUR/USD', 'buy', 0.1, 1.0860, 1.0840, -20.00, 2);

-- Query to check your data
-- SELECT * FROM trades ORDER BY date DESC LIMIT 10;
-- SELECT * FROM accounts;