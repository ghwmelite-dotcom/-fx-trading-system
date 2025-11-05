# Multi-Account Support Upgrade Complete ✅

## What Was Changed

### Backend (Already Deployed ✅)
**File:** `backend/src/index.js`

1. **Auto-Account Creation** (Lines 1118-1144)
   - MT5 webhook now checks if account exists
   - Automatically creates new accounts when unknown account IDs detected
   - Extracts broker name and initial balance from webhook data

2. **Real-Time Balance Calculation** (Lines 1020-1033)
   - Account balances now calculated as: Initial Balance + Total P&L
   - Dynamic calculation on every API call
   - Accurate representation of current account state

### MT5 Expert Advisor (Updated ✅)
**File:** `FX Dashboard Auto Sync EA.mq5`
**Version:** 1.00 → 2.00

1. **Removed Manual Account ID** (Line 15)
   - ❌ Old: `input int ACCOUNT_ID = 1;`
   - ✅ New: Auto-detected from MT5

2. **Auto-Detect Account Info** (Lines 163-165)
   ```mql5
   long accountNumber = AccountInfoInteger(ACCOUNT_LOGIN);
   string brokerName = AccountInfoString(ACCOUNT_COMPANY);
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   ```

3. **Enhanced Webhook Payload** (Lines 176-178)
   - Now sends: `accountId`, `broker`, `balance`
   - Backend uses this to create/update accounts

## What You Need To Do

### Step 1: Recompile the EA
1. Open **MetaEditor** (F4 in MT5)
2. Open: `FX Dashboard Auto Sync EA.mq5`
3. Press **F7** to compile
4. Close MetaEditor

### Step 2: Restart MT5
- Close and reopen MetaTrader 5
- This ensures the new EA version is loaded

### Step 3: Remove Old EA & Add New One
For **each MT5 account**:
1. Right-click the chart with the old EA → Remove Expert Advisor
2. Drag the **new v2.00 EA** onto any chart
3. In the inputs dialog:
   - ✅ Set `API_URL` to your worker URL
   - ✅ Set `API_KEY` (if you have one)
   - ✅ Leave `CHECK_INTERVAL` at 60
   - ⚠️ **Note:** No more ACCOUNT_ID field!
4. Click **OK**

### Step 4: Verify in Dashboard
1. Wait 1-2 minutes for trades to sync
2. Go to **Overview Tab** → Scroll to "All Accounts" section
3. You should now see multiple accounts:
   - **MT5 Account 123456** (Your first account)
   - **MT5 Account 789012** (Your second account)
   - etc.

4. Go to **Trades Tab**
5. Click the **Trade Copier** section (top of page)
6. You should now see multiple accounts to select as master/slave

## Expected Results

### Before ✗
- ❌ Only 1 account showing (10k default)
- ❌ All trades grouped together
- ❌ Trade Copier unusable (no slaves)
- ❌ Incorrect total balance

### After ✓
- ✅ Multiple accounts showing (one per MT5 account)
- ✅ Trades separated by account
- ✅ Trade Copier fully functional
- ✅ Accurate balances per account
- ✅ Correct total balance (sum of all accounts)

## Trade Copier Now Works

**Master Account** → Select any of your MT5 accounts
**Slave Accounts** → Select one or more other accounts
**Lot Multiplier** → Set to 1.0 (or adjust as needed)
**Enable Toggle** → Turn on

Now when you trade on the master account, trades automatically copy to slave accounts!

## Troubleshooting

### "Still only seeing 1 account"
1. Check MT5 Terminal → Experts tab for errors
2. Verify URL is allowed: Tools → Options → Expert Advisors
3. Check EA is running (smiling face icon on chart)
4. Wait 60 seconds and refresh dashboard

### "EA not compiling"
- Make sure you're using **MT5** (not MT4)
- File must be in: `MT5/MQL5/Experts/` folder
- Check for syntax errors in MetaEditor

### "Accounts showing but balance is wrong"
- Initial balance defaults to 10,000
- Will adjust as trades sync
- P&L is added to initial balance for true balance

## Support

If issues persist:
1. Check backend logs: `npx wrangler tail` (in backend folder)
2. Check MT5 Experts tab for error messages
3. Verify API URL is correct in EA inputs
4. Ensure WebRequest is allowed for your Worker URL

## Commits

- **Backend:** `4439e73` - feat: Auto-create MT5 accounts and calculate real-time balances
- **EA:** `b8e7285` - feat: EA v2.0 - Auto-detect MT5 account numbers

## Next Steps

1. Recompile EA in MetaEditor
2. Restart MT5
3. Replace EA on all accounts
4. Verify multiple accounts appear in dashboard
5. Test Trade Copier functionality

---

**Status:** ✅ Backend deployed, EA updated, ready to use!
