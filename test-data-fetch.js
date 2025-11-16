// Test script for historical data fetching system
// This script tests the Yahoo Finance integration (no API key needed)

const API_URL = 'https://fx-trading-dashboard.simonrdev.workers.dev'; // Update with your worker URL
const AUTH_TOKEN = 'YOUR_JWT_TOKEN'; // Update with your JWT token

// Test configuration
const testConfig = {
  sources: ['yahoo'], // Start with Yahoo (no API key required)
  symbol: 'EURUSD',
  timeframe: '1D',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-12-31T23:59:59Z',
  fillGaps: true,
  validateData: true,
  mergeStrategy: 'prefer-newest'
};

async function testDataFetch() {
  console.log('🚀 Testing Historical Data Fetch System\n');
  console.log('Configuration:');
  console.log(`  - Sources: ${testConfig.sources.join(', ')}`);
  console.log(`  - Symbol: ${testConfig.symbol}`);
  console.log(`  - Timeframe: ${testConfig.timeframe}`);
  console.log(`  - Date Range: ${testConfig.startDate.split('T')[0]} to ${testConfig.endDate.split('T')[0]}`);
  console.log(`  - Fill Gaps: ${testConfig.fillGaps}`);
  console.log(`  - Validate Data: ${testConfig.validateData}\n`);

  try {
    console.log('📡 Fetching data from Yahoo Finance...\n');

    const response = await fetch(`${API_URL}/api/backtest/data/fetch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Fetch failed');
    }

    const result = await response.json();

    console.log('✅ Data fetch successful!\n');
    console.log('Results:');
    console.log(`  - Job ID: ${result.jobId}`);
    console.log(`  - Dataset ID: ${result.datasetId}`);
    console.log(`  - Source: ${result.source}`);
    console.log(`  - Candles fetched: ${result.candles}`);
    console.log(`  - Date range: ${result.dateRange.start.split('T')[0]} to ${result.dateRange.end.split('T')[0]}`);
    console.log(`  - Gaps filled: ${result.gapsFilled}`);
    console.log(`  - Validation issues: ${result.validationIssues}`);
    console.log(`  - Message: ${result.message}\n`);

    // Test source status
    console.log('📊 Checking data source status...\n');

    const statusResponse = await fetch(`${API_URL}/api/backtest/data/sources/status`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (statusResponse.ok) {
      const status = await statusResponse.json();

      console.log('Data Source Status:');
      for (const [source, info] of Object.entries(status)) {
        console.log(`\n  ${source}:`);
        console.log(`    - Available: ${info.available}`);
        console.log(`    - Requires API Key: ${info.requiresApiKey}`);
        console.log(`    - Daily Limit: ${info.dailyLimit}`);
        console.log(`    - Calls Remaining: ${info.callsRemaining}`);
        if (info.hasApiKey) {
          console.log(`    - Has API Key: ✓ (${info.tier} tier)`);
        }
      }
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Update API_URL with your Cloudflare Worker URL');
    console.error('2. Update AUTH_TOKEN with a valid JWT token (login to get one)');
    console.error('3. Ensure backend is deployed with latest changes');
    console.error('4. Run database migration: npx wrangler d1 migrations apply fx-trading-db --remote');
    process.exit(1);
  }
}

// Run tests
testDataFetch();
