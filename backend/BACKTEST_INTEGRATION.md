# Backtesting System Integration Guide

## Step 1: Add Import to index.js

Add this import at the top of `backend/src/index.js` (around line 25, after other imports):

```javascript
import { registerBacktestingRoutes } from './backtestingRoutes.js';
```

## Step 2: Register Routes

Find the section where routes are defined in `index.js` (look for the routes array or routing logic).

Before the `export default` statement, add:

```javascript
// ============================================
// BACKTESTING SYSTEM ROUTES
// ============================================

// Helper function to create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Register all backtesting routes
registerBacktestingRoutes(routes, requireAuth, jsonResponse);
```

## Step 3: Run Database Migration

Execute the migration to create the backtesting tables:

```bash
cd backend
npx wrangler d1 migrations apply fx-trading-db --remote
```

For local development:

```bash
npx wrangler d1 migrations apply fx-trading-db --local
```

## Step 4: Deploy Backend

```bash
cd backend
npm run deploy
```

## API Endpoints

### Data Management
- `POST /api/backtest/data/upload` - Upload CSV historical data
- `GET /api/backtest/data` - List available historical data
- `DELETE /api/backtest/data/:symbol/:timeframe` - Delete historical data

### Strategy Management
- `POST /api/backtest/strategies` - Create strategy
- `GET /api/backtest/strategies` - List strategies
- `GET /api/backtest/strategies/:id` - Get strategy details
- `PUT /api/backtest/strategies/:id` - Update strategy
- `DELETE /api/backtest/strategies/:id` - Delete strategy

### Backtest Execution
- `POST /api/backtest/run` - Run a backtest
- `GET /api/backtest/results` - List backtests
- `GET /api/backtest/results/:id` - Get backtest details
- `DELETE /api/backtest/results/:id` - Delete backtest

## CSV Format for Data Upload

```csv
timestamp,open,high,low,close,volume,spread
2024-01-01 00:00:00,1.0950,1.0955,1.0948,1.0952,1000,0.0002
2024-01-01 01:00:00,1.0952,1.0958,1.0950,1.0956,1200,0.0002
```

Required columns:
- `timestamp` (or `date` or `time`) - DateTime in any parseable format
- `open` - Opening price
- `high` - High price
- `low` - Low price
- `close` - Closing price

Optional columns:
- `volume` - Volume (defaults to 0)
- `spread` - Spread in price units (defaults to 0)

## Example Strategy Creation

### Indicator-Based Strategy (MA Crossover)

```json
{
  "name": "MA Crossover 10/20",
  "strategy_type": "indicator",
  "indicator_config": {
    "type": "ma_crossover",
    "fast_period": 10,
    "slow_period": 20,
    "ma_type": "ema"
  },
  "stop_loss_type": "fixed",
  "stop_loss_value": 20,
  "take_profit_type": "risk_reward",
  "take_profit_value": 2,
  "position_size_type": "risk_based",
  "max_risk_per_trade": 1.0
}
```

### Rules-Based Strategy

```json
{
  "name": "RSI + Price Above MA",
  "strategy_type": "rules",
  "entry_conditions": [
    {
      "field": "rsi_14",
      "operator": "crosses_above",
      "value": 30,
      "signal": "buy",
      "logic": "AND"
    },
    {
      "field": "close",
      "operator": ">",
      "value": "sma_50",
      "signal": "buy"
    }
  ],
  "exit_conditions": [
    {
      "field": "rsi_14",
      "operator": "crosses_below",
      "value": 70,
      "signal": "close"
    }
  ],
  "stop_loss_type": "atr",
  "stop_loss_value": 2,
  "take_profit_type": "atr",
  "take_profit_value": 3
}
```

### Custom Code Strategy

```javascript
{
  "name": "Custom Momentum Strategy",
  "strategy_type": "custom",
  "custom_code": `
    // bars: {open: [], high: [], low: [], close: [], volume: [], timestamp: []}
    // indicators: {sma_20: [], rsi_14: [], ...}

    const signals = [];
    const sma20 = indicators.sma_20;
    const rsi = indicators.rsi_14;

    for (let i = 1; i < bars.close.length; i++) {
      if (sma20[i] === null || rsi[i] === null) continue;

      // Buy: Price crosses above SMA and RSI < 30
      if (bars.close[i-1] <= sma20[i-1] && bars.close[i] > sma20[i] && rsi[i] < 30) {
        signals.push({
          index: i,
          signal: 'buy',
          price: bars.close[i],
          reason: 'Price crossed above SMA20 with RSI oversold'
        });
      }

      // Sell: Price crosses below SMA and RSI > 70
      if (bars.close[i-1] >= sma20[i-1] && bars.close[i] < sma20[i] && rsi[i] > 70) {
        signals.push({
          index: i,
          signal: 'sell',
          price: bars.close[i],
          reason: 'Price crossed below SMA20 with RSI overbought'
        });
      }
    }

    return signals;
  `
}
```

## Example Backtest Execution

```json
{
  "strategy_id": 1,
  "name": "EUR/USD MA Crossover Test",
  "symbol": "EURUSD",
  "timeframe": "1h",
  "start_date": "2024-01-01 00:00:00",
  "end_date": "2024-03-31 23:59:59",
  "initial_capital": 10000,
  "commission_per_lot": 7.0,
  "spread_pips": 1.5,
  "slippage_pips": 0.5,
  "use_realistic_fills": 1
}
```

## Response Format

### Backtest Results Response

```json
{
  "success": true,
  "backtest_id": 1,
  "trades": 45,
  "metrics": {
    "total_trades": 45,
    "winning_trades": 27,
    "losing_trades": 18,
    "win_rate": 60.0,
    "net_profit": 2450.50,
    "total_return": 24.51,
    "annual_return": 35.2,
    "profit_factor": 1.85,
    "sharpe_ratio": 1.42,
    "max_drawdown": -850.30,
    "max_drawdown_percent": -8.2,
    "expectancy": 54.46,
    "avg_win": 180.25,
    "avg_loss": -95.60,
    "largest_win": 450.00,
    "largest_loss": -220.00,
    "max_consecutive_wins": 7,
    "max_consecutive_losses": 4
  }
}
```

## Testing

1. Upload historical data
2. Create a strategy
3. Run a backtest
4. View results

All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```
