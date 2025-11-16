# EA System Deployment Guide

## Quick Deployment Checklist

### Step 1: Run Database Migration

```bash
cd backend
npx wrangler d1 migrations apply fx-trading-db --remote
```

This creates:
- `expert_advisors` table
- `ea_backtests` table
- `ea_backtest_metrics` table
- All necessary indexes

### Step 2: Verify Migration

```bash
npx wrangler d1 execute fx-trading-db --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%ea%' OR name LIKE '%expert%';" --remote
```

Expected output:
```
expert_advisors
ea_backtests
ea_backtest_metrics
```

### Step 3: Deploy Backend

```bash
cd backend
npm run deploy
```

This deploys:
- Updated `backtestingRoutes.js` with 8 new EA endpoints
- `backend/src/mql5/lexer.js` - MQL5 tokenizer
- `backend/src/mql5/parser.js` - MQL5 AST parser
- `backend/src/mql5/transpiler.js` - JavaScript transpiler
- `backend/src/mql5/mt5api.js` - MT5 API emulation
- `backend/src/mql5/eaRunner.js` - EA execution engine

### Step 4: Test Endpoints

```bash
# Test EA list (should return empty array)
curl https://your-worker.workers.dev/api/backtest/ea/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: {"success":true,"eas":[]}
```

### Step 5: Upload Sample EA

```bash
curl -X POST https://your-worker.workers.dev/api/backtest/ea/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@backend/sample-eas/SimpleMA_Crossover.mq5" \
  -F "name=MA Crossover Test" \
  -F "description=Testing EA upload"
```

Expected response:
```json
{
  "success": true,
  "eaId": 1,
  "name": "MA Crossover Test",
  "status": "active",
  "parameters": [
    {"name": "FastMA", "type": "int", "defaultValue": "10"},
    {"name": "SlowMA", "type": "int", "defaultValue": "30"},
    ...
  ],
  "hasTranspiledCode": true
}
```

### Step 6: Run Test Backtest

1. First, ensure you have a dataset with historical data
2. Then run:

```bash
curl -X POST https://your-worker.workers.dev/api/backtest/ea/run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eaId": 1,
    "datasetId": YOUR_DATASET_ID,
    "parameters": {
      "FastMA": 10,
      "SlowMA": 30,
      "LotSize": 0.1,
      "StopLoss": 50,
      "TakeProfit": 100
    },
    "config": {
      "initialBalance": 10000,
      "symbol": "EURUSD",
      "timeframe": "H1"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "backtestId": 1,
  "results": {
    "totalTrades": ...,
    "netProfit": ...,
    "winRate": ...,
    ...
  },
  "logs": [...]
}
```

---

## Troubleshooting

### Migration Fails

**Error:** "Table already exists"
- Tables may already be created
- Check with: `npx wrangler d1 execute fx-trading-db --command "SELECT name FROM sqlite_master WHERE type='table';" --remote`
- If tables exist, skip migration

**Error:** "Database not found"
- Verify `wrangler.toml` has correct database binding
- Check database name matches

### Deploy Fails

**Error:** "Module not found"
- Ensure all files in `backend/src/mql5/` directory exist
- Check import paths are correct

**Error:** "Syntax error"
- Run: `cd backend && npm run build` to check for syntax errors
- Fix any reported errors

### EA Upload Fails

**Error:** "Failed to parse EA"
- Check MQL5 file syntax
- Try with provided sample EAs first
- Review parse errors in response

**Error:** "File and name are required"
- Ensure form-data includes both `file` and `name` fields
- Use `-F` flag with curl, not `-d`

### Backtest Fails

**Error:** "EA has parse errors"
- EA failed to transpile
- Check `parse_errors` field in EA details
- View `transpiled_code` field (should not be null)

**Error:** "No historical data found"
- Dataset has no data
- Upload CSV data first
- Verify dataset belongs to authenticated user

**Error:** "Timeout"
- Dataset too large (>10,000 candles)
- EA too complex
- Try smaller dataset or simpler EA

---

## Files Created

### Backend Core
- `backend/src/mql5/lexer.js` (630 lines)
- `backend/src/mql5/parser.js` (850 lines)
- `backend/src/mql5/transpiler.js` (420 lines)
- `backend/src/mql5/mt5api.js` (650 lines)
- `backend/src/mql5/eaRunner.js` (380 lines)

### Backend Routes
- `backend/src/backtestingRoutes.js` (UPDATED - added 8 EA endpoints, +550 lines)

### Database
- `backend/migrations/009_ea_upload_system.sql` (3 tables, 9 indexes)

### Sample EAs
- `backend/sample-eas/SimpleMA_Crossover.mq5`
- `backend/sample-eas/RSI_Strategy.mq5`
- `backend/sample-eas/BollingerBands_Breakout.mq5`

### Documentation
- `EA_SYSTEM_DOCUMENTATION.md` (Complete system docs)
- `DEPLOY_EA_SYSTEM.md` (This file)

**Total Lines of Code:** ~3,500 lines
**Total Files Created:** 11 files

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/backtest/ea/upload` | Upload MQL5 EA |
| GET | `/api/backtest/ea/list` | List user's EAs |
| GET | `/api/backtest/ea/:id` | Get EA details |
| DELETE | `/api/backtest/ea/:id` | Delete EA |
| POST | `/api/backtest/ea/run` | Run backtest |
| GET | `/api/backtest/ea/:eaId/backtests` | List EA backtests |
| GET | `/api/backtest/ea/backtest/:id` | Get backtest results |
| DELETE | `/api/backtest/ea/backtest/:id` | Delete backtest |

---

## Next Steps (Frontend Implementation)

The backend is fully functional. To complete the system:

1. **Create EA Upload Component** (`frontend/src/components/EAUpload.jsx`)
   - File upload with drag & drop
   - EA name/description form
   - Parse results display
   - Parameter preview

2. **Create EA List Component** (`frontend/src/components/EAList.jsx`)
   - Table of uploaded EAs
   - Status indicators
   - View/Delete actions
   - Filter/search

3. **Create EA Backtest Component** (`frontend/src/components/EABacktest.jsx`)
   - Dataset selector
   - Parameter configurator
   - Backtest configuration (balance, spread, etc.)
   - Run backtest button

4. **Create Results Viewer** (`frontend/src/components/EAResults.jsx`)
   - Performance metrics cards
   - Equity curve chart (Recharts)
   - Trade list table
   - Export results

5. **Integrate with BacktestBuilder**
   - Add "Expert Advisor" tab to BacktestBuilder
   - Reuse existing components where possible
   - Consistent styling with platform

---

## Production Considerations

### Performance

- **Large Datasets:** Consider implementing pagination for trade lists
- **Long Backtests:** Add progress updates (may require WebSocket)
- **Concurrent Users:** Monitor Cloudflare Workers CPU time limits

### Security

- **File Size Limits:** Add max file size check (suggest 100KB)
- **Rate Limiting:** Implement backtest rate limiting per user
- **Malicious Code:** EAs run in isolated VM (Cloudflare Workers), but monitor for abuse

### Monitoring

- **Error Tracking:** Log parse errors, execution errors
- **Performance Metrics:** Track avg backtest time, success rate
- **Usage Stats:** Monitor uploads, backtest runs per user

### Backup

- **Database:** Regular D1 database backups
- **EA Source Code:** Consider R2 storage for original .mq5 files
- **Backtest Results:** Archive old results to reduce database size

---

## Success Criteria

System is successfully deployed when:

✅ All 3 database tables created
✅ All 8 API endpoints respond correctly
✅ Sample EA uploads successfully
✅ Sample EA transpiles without errors
✅ Backtest runs and returns results
✅ Results include all expected metrics
✅ Equity curve has data points
✅ Trade list populates correctly

---

## Support

If you encounter issues:

1. Check this guide first
2. Review `EA_SYSTEM_DOCUMENTATION.md`
3. Test with provided sample EAs
4. Check Cloudflare Workers logs: `npx wrangler tail`
5. Verify database state: `npx wrangler d1 execute ...`

---

**Deployment Status:** Ready for Production
**Last Updated:** 2025-01-16
**Version:** 1.0.0
