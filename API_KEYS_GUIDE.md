# Free API Keys Guide - Historical Data Sources

## Overview

This guide explains how to get free API keys for fetching historical forex data. All three data sources offer generous free tiers with no credit card required.

---

## 1. Yahoo Finance (Recommended to Start)

### No API Key Required!

**Best For**: Daily and higher timeframes, quick setup, unlimited use

**Setup**: None required. Works immediately.

**Usage**:
- Just select "Yahoo Finance" as your data source
- No configuration needed
- Unlimited free access

**Pros**:
- Completely free
- No registration
- No rate limits
- Good data quality for daily timeframes

**Cons**:
- Intraday data may be limited
- No official API (uses download endpoint)
- May have occasional missing data

---

## 2. Alpha Vantage (Free Tier: 25 calls/day)

### Getting Your Free API Key

**Step 1: Visit Registration Page**
```
https://www.alphavantage.co/support/#api-key
```

**Step 2: Fill Out Form**
- First Name: Your name
- Last Name: Your name
- Email: Your email (they don't spam!)
- Organization: Can enter "Personal" or "Individual"

**Step 3: Get Instant API Key**
- API key displayed immediately
- Also sent to your email
- No verification needed
- No credit card required

**Example API Key Format**: `ABCD1234EFGH5678`

### Free Tier Limits
- **25 API calls per day**
- **500 API calls per month**
- Resets at midnight UTC
- No upgrade required for basic use

### Adding to FX Trading Dashboard

1. Navigate to **Backtesting > Data Manager**
2. Click **Fetch from API** tab
3. Expand **API Keys (optional)** section
4. Paste your key in the **Alpha Vantage API Key** field
5. Your key is saved for future use

### Best Use Cases
- Intraday data (1min, 5min, 15min, 30min, 60min)
- High-quality forex data
- Reliable and consistent data

### Rate Limit Strategy
- Use for intraday timeframes (Yahoo doesn't support these as well)
- Can fetch ~25 symbols per day
- Each symbol/timeframe combination counts as 1 call

### Example Usage
```javascript
// Fetch 1 year of hourly data for EURUSD
// This uses only 1 API call!
Symbol: EURUSD
Timeframe: 1H
Date Range: 2024-01-01 to 2024-12-31
```

### Support
- Email: support@alphavantage.co
- Documentation: https://www.alphavantage.co/documentation/
- FAQ: https://www.alphavantage.co/support/#support

---

## 3. Twelve Data (Free Tier: 800 calls/day)

### Getting Your Free API Key

**Step 1: Sign Up**
```
https://twelvedata.com/pricing
```
Click "Get started free" under the Free plan

**Step 2: Create Account**
- Email: Your email
- Password: Choose a password
- Click "Sign Up"

**Step 3: Verify Email**
- Check your email inbox
- Click verification link
- You'll be redirected to dashboard

**Step 4: Get API Key**
- Log in to https://twelvedata.com/
- Click on your profile (top right)
- Go to "API Keys"
- Your key is displayed
- Click "Copy" to copy it

**Example API Key Format**: `abcd1234efgh5678ijkl9012mnop3456`

### Free Tier Limits
- **800 API calls per day**
- Resets at midnight UTC
- Perfect for multiple symbols or longer date ranges
- No credit card required

### Adding to FX Trading Dashboard

1. Navigate to **Backtesting > Data Manager**
2. Click **Fetch from API** tab
3. Expand **API Keys (optional)** section
4. Paste your key in the **Twelve Data API Key** field
5. Your key is saved for future use

### Best Use Cases
- Multiple symbols per day (800 calls is generous!)
- All timeframes including 4H (not available elsewhere)
- Excellent forex coverage
- Backup when Alpha Vantage limit reached

### Rate Limit Strategy
- Use for primary data fetching (800 calls goes a long way)
- Can fetch hundreds of symbols per day
- Great for bulk historical data downloads

### Supported Forex Pairs
Over 2000+ forex pairs including:
- All majors (EURUSD, GBPUSD, USDJPY, etc.)
- All minors (EURGBP, EURJPY, AUDJPY, etc.)
- Exotics (USDTRY, USDZAR, USDMXN, etc.)
- Crypto pairs (BTC/USD, ETH/USD, etc.)

### Support
- Email: support@twelvedata.com
- Documentation: https://twelvedata.com/docs
- Live Chat: Available on website

---

## Comparison Table

| Feature | Yahoo Finance | Alpha Vantage | Twelve Data |
|---------|---------------|---------------|-------------|
| **API Key Required** | No | Yes | Yes |
| **Daily Calls** | Unlimited | 25 | 800 |
| **Monthly Calls** | Unlimited | 500 | ~24,000 |
| **Signup Required** | No | Yes | Yes |
| **Credit Card** | No | No | No |
| **1M Timeframe** | Limited | ✓ | ✓ |
| **5M Timeframe** | ✓ | ✓ | ✓ |
| **15M Timeframe** | ✓ | ✓ | ✓ |
| **1H Timeframe** | ✓ | ✓ | ✓ |
| **4H Timeframe** | No | No | ✓ |
| **1D Timeframe** | ✓ | ✓ | ✓ |
| **Best For** | Quick start, daily data | Intraday data | Bulk fetching, 4H data |

---

## Recommended Strategy

### For Beginners (No API Keys)
1. Start with **Yahoo Finance**
2. Fetch daily or higher timeframe data
3. No setup required
4. Test the system and get comfortable

### For Active Backtesting (Free API Keys)
1. Get **Twelve Data** API key (5 minutes)
2. Use for primary data fetching (800 calls/day)
3. Optionally get **Alpha Vantage** as backup
4. Can fetch dozens of symbols per day

### For Power Users (All Sources)
1. Use **all three sources** with fallback
2. Set priority: Twelve Data → Yahoo → Alpha Vantage
3. Automatic failover if one source hits limit
4. Maximum reliability and coverage

### API Key Priority Example
```javascript
// In FX Trading Dashboard
Data Sources (try in order):
☑ Twelve Data        // Try first (800 calls/day)
☑ Yahoo Finance      // Fallback (unlimited)
☑ Alpha Vantage      // Last resort (25 calls/day)
```

This ensures:
- Maximum daily capacity (800+ symbols)
- Automatic failover if rate limit hit
- Always available (Yahoo has no limit)

---

## Security Best Practices

### Do's
✓ Keep API keys private
✓ Use different keys for development and production
✓ Regenerate keys if compromised
✓ Monitor usage in provider dashboards

### Don'ts
✗ Share API keys publicly
✗ Commit keys to Git repositories
✗ Use same key across multiple apps
✗ Exceed rate limits (may get banned)

---

## Troubleshooting

### "API Key is Required"
**Problem**: Selected Alpha Vantage or Twelve Data without entering key
**Solution**: Either enter API key or use Yahoo Finance instead

### "Daily Rate Limit Reached"
**Problem**: Exceeded 25 calls (Alpha Vantage) or 800 calls (Twelve Data)
**Solution**:
1. Wait until tomorrow (resets midnight UTC)
2. Use different data source
3. Check usage in provider dashboard

### "Invalid API Key"
**Problem**: API key not recognized
**Solution**:
1. Double-check you copied entire key (no spaces)
2. Verify email for Twelve Data
3. Generate new key from provider dashboard

### "No Data Returned"
**Problem**: API returned empty response
**Solution**:
1. Check symbol format (EURUSD not EUR-USD)
2. Try different date range
3. Verify timeframe is supported
4. Check provider status page

---

## Getting Help

### FX Trading Dashboard
- Check **Data Source Information** box at bottom of Data Manager
- Click help icon for inline tips
- View validation reports for data quality

### Provider Support

**Alpha Vantage**
- Support: support@alphavantage.co
- Status: Check website for outages
- Community: Stack Overflow tag `alphavantage`

**Twelve Data**
- Support: support@twelvedata.com
- Live Chat: On website during business hours
- Docs: Comprehensive API documentation

---

## Cost Upgrade Paths (Optional)

### If Free Tier Becomes Limiting

**Alpha Vantage Premium**
- From $49.99/month
- 75-1200 calls/minute
- Priority support
- https://www.alphavantage.co/premium/

**Twelve Data Premium**
- From $79/month
- 30,000 calls/day
- Real-time data
- Priority support
- https://twelvedata.com/pricing

**Alternative: Multiple Free Accounts**
- Create separate accounts with different emails
- Rotate API keys daily
- Technically allowed for personal use
- Stay within terms of service

---

## Quick Start Checklist

- [ ] Try Yahoo Finance first (no setup)
- [ ] If need intraday data, get Twelve Data key (5 min)
- [ ] Add key to FX Trading Dashboard
- [ ] Test with small date range (1 month)
- [ ] Verify data quality in "My Datasets" tab
- [ ] Expand to larger date ranges
- [ ] Set up multiple sources for reliability

---

## Summary

All three data sources are excellent and free:

1. **Yahoo Finance**: Best for beginners, no setup, unlimited
2. **Twelve Data**: Best for serious users, 800 calls/day, easy signup
3. **Alpha Vantage**: Good for intraday, 25 calls/day, instant key

Start with Yahoo, add Twelve Data when ready, use all three for maximum reliability!
