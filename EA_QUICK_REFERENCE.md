# EA System - Quick Reference Card

## Deployment (3 Commands)

```bash
# 1. Run migration
cd backend && npx wrangler d1 migrations apply fx-trading-db --remote

# 2. Deploy backend
npm run deploy

# 3. Test
curl https://your-worker.workers.dev/api/backtest/ea/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## File Structure

```
backend/
├── src/
│   ├── mql5/
│   │   ├── lexer.js         # Tokenizer
│   │   ├── parser.js        # AST builder
│   │   ├── transpiler.js    # JS generator
│   │   ├── mt5api.js        # MT5 emulation
│   │   └── eaRunner.js      # Executor
│   └── backtestingRoutes.js # +8 endpoints
├── migrations/
│   └── 009_ea_upload_system.sql
└── sample-eas/
    ├── SimpleMA_Crossover.mq5
    ├── RSI_Strategy.mq5
    └── BollingerBands_Breakout.mq5
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST   | `/api/backtest/ea/upload` | Upload EA |
| GET    | `/api/backtest/ea/list` | List EAs |
| GET    | `/api/backtest/ea/:id` | EA details |
| DELETE | `/api/backtest/ea/:id` | Delete EA |
| POST   | `/api/backtest/ea/run` | Run backtest |
| GET    | `/api/backtest/ea/:eaId/backtests` | List backtests |
| GET    | `/api/backtest/ea/backtest/:id` | Results |
| DELETE | `/api/backtest/ea/backtest/:id` | Delete backtest |

---

## Quick Test

### 1. Upload EA
```bash
curl -X POST http://localhost:8787/api/backtest/ea/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@backend/sample-eas/SimpleMA_Crossover.mq5" \
  -F "name=Test EA" \
  -F "description=Testing"
```

### 2. Run Backtest
```bash
curl -X POST http://localhost:8787/api/backtest/ea/run \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eaId": 1,
    "datasetId": 1,
    "parameters": {},
    "config": {"initialBalance": 10000}
  }'
```

### 3. View Results
```bash
curl http://localhost:8787/api/backtest/ea/backtest/1 \
  -H "Authorization: Bearer TOKEN"
```

---

## Database Tables

```sql
-- expert_advisors: EA storage
SELECT id, name, status, parameters FROM expert_advisors;

-- ea_backtests: Backtest runs
SELECT id, ea_id, status, started_at FROM ea_backtests;

-- ea_backtest_metrics: Quick metrics
SELECT backtest_id, net_profit, win_rate FROM ea_backtest_metrics;
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "EA has parse errors" | Check MQL5 syntax, try sample EA |
| "No historical data" | Upload CSV data first |
| "Timeout" | Use smaller dataset (<10k candles) |
| "Table already exists" | Skip migration, tables exist |
| "Module not found" | Verify files in backend/src/mql5/ |

---

## MQL5 Functions Supported

### Trading (11)
`OrderSend`, `OrderClose`, `OrderModify`, `OrderDelete`, `OrderSelect`, `OrdersTotal`, `OrderTicket`, `OrderType`, `OrderProfit`, `OrderOpenPrice`, `OrderClosePrice`

### Indicators (8)
`iMA`, `iRSI`, `iMACD`, `iBands`, `iATR`, `iStochastic`, `iCCI`, `iMomentum`

### Market Data (8)
`Symbol`, `Period`, `Bid`, `Ask`, `Point`, `iClose`, `iOpen`, `iHigh`, `iLow`

### Account (4)
`AccountBalance`, `AccountEquity`, `AccountProfit`, `AccountFreeMargin`

---

## Metrics Returned (25+)

**Profit:**
- Net Profit, Gross Profit/Loss, Total Return
- Profit Factor, Expectancy

**Trades:**
- Total Trades, Winning/Losing Trades
- Win Rate, Avg Win/Loss, Largest Win/Loss

**Risk:**
- Max Drawdown ($), Max Drawdown (%)
- Sharpe Ratio, Sortino Ratio

**Other:**
- Consecutive Wins/Losses
- Long/Short Stats
- Equity Curve
- Trade List

---

## Performance Limits

| Metric | Limit | Recommendation |
|--------|-------|----------------|
| Dataset Size | 10,000 candles | Use smaller ranges |
| EA File Size | 100 KB | Optimize code |
| CPU Time | 50ms/request | Simplify logic |
| Backtest Time | ~10 sec | Monitor logs |

---

## Development Workflow

```mermaid
Upload EA → Parse → Transpile → Store
                                  ↓
Historical Data ← Select Dataset ← Configure
        ↓
    Run Backtest
        ↓
   View Results
```

---

## Code Examples

### Upload EA (JavaScript)
```javascript
const formData = new FormData();
formData.append('file', eaFile);
formData.append('name', 'My EA');
formData.append('description', 'Description');

const response = await fetch('/api/backtest/ea/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Run Backtest (JavaScript)
```javascript
const response = await fetch('/api/backtest/ea/run', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eaId: 1,
    datasetId: 1,
    parameters: { FastMA: 10, SlowMA: 30 },
    config: { initialBalance: 10000 }
  })
});
```

---

## Monitoring

### Check Logs
```bash
npx wrangler tail
```

### Check Database
```bash
npx wrangler d1 execute fx-trading-db \
  --command "SELECT COUNT(*) FROM expert_advisors;" \
  --remote
```

### Check Backtest Status
```bash
npx wrangler d1 execute fx-trading-db \
  --command "SELECT status, COUNT(*) FROM ea_backtests GROUP BY status;" \
  --remote
```

---

## Security Checklist

- [x] Prepared statements (SQL injection prevention)
- [x] User authentication required
- [x] User data isolation
- [x] Input validation
- [x] Error handling
- [ ] Rate limiting (recommended)
- [ ] File size limits (recommended)

---

## Sample EA Parameters

### SimpleMA_Crossover
```json
{
  "FastMA": 10,
  "SlowMA": 30,
  "LotSize": 0.1,
  "StopLoss": 50,
  "TakeProfit": 100
}
```

### RSI_Strategy
```json
{
  "RSI_Period": 14,
  "RSI_Oversold": 30,
  "RSI_Overbought": 70,
  "LotSize": 0.1
}
```

### BollingerBands_Breakout
```json
{
  "BB_Period": 20,
  "BB_Deviation": 2.0,
  "LotSize": 0.1,
  "MaxTrades": 1
}
```

---

## Support Files

| File | Purpose |
|------|---------|
| `EA_SYSTEM_DOCUMENTATION.md` | Complete docs (600 lines) |
| `DEPLOY_EA_SYSTEM.md` | Deployment guide (300 lines) |
| `EA_SYSTEM_SUMMARY.md` | Implementation summary |
| `EA_QUICK_REFERENCE.md` | This file |

---

## Quick Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [MQL5 Language Reference](https://www.mql5.com/en/docs)
- [MetaTrader 5 Docs](https://www.metatrader5.com/en/automated-trading)

---

**Version:** 1.0.0
**Last Updated:** 2025-01-16
**Status:** Production Ready (Backend)

---

*Print this reference card for quick access during development and deployment.*
