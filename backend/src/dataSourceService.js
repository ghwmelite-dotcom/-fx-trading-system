// Data Source Service for Historical Forex Data Fetching
// Supports multiple free APIs: Alpha Vantage, Yahoo Finance, Twelve Data
// Implements rate limiting, data validation, gap filling, and merging strategies

/**
 * Rate limiter to prevent API throttling
 */
const rateLimiter = {
  alphaVantage: {
    lastCall: null,
    minInterval: 12000, // 12 seconds between calls (free tier: 25 calls/day)
    dailyLimit: 25,
    callsToday: 0,
    lastResetDate: null
  },
  twelveData: {
    lastCall: null,
    minInterval: 1000, // 1 second between calls (free tier: 800 calls/day)
    dailyLimit: 800,
    callsToday: 0,
    lastResetDate: null
  },
  yahoo: {
    lastCall: null,
    minInterval: 500, // 0.5 seconds (no strict limit but be respectful)
    dailyLimit: null, // Unlimited
    callsToday: 0,
    lastResetDate: null
  }
};

/**
 * Wait for rate limit compliance
 * @param {string} source - Data source name
 */
async function waitForRateLimit(source) {
  const limiter = rateLimiter[source];
  if (!limiter) return;

  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (limiter.lastResetDate !== today) {
    limiter.callsToday = 0;
    limiter.lastResetDate = today;
  }

  // Check daily limit
  if (limiter.dailyLimit && limiter.callsToday >= limiter.dailyLimit) {
    throw new Error(`Daily rate limit reached for ${source}. Limit: ${limiter.dailyLimit} calls/day.`);
  }

  // Wait for minimum interval
  if (limiter.lastCall) {
    const elapsed = Date.now() - limiter.lastCall;
    const remaining = limiter.minInterval - elapsed;
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
  }

  limiter.lastCall = Date.now();
  limiter.callsToday++;
}

/**
 * Normalize symbol format for different data sources
 * @param {string} symbol - Symbol in format like "EUR/USD" or "EURUSD"
 * @param {string} source - Data source name
 * @returns {object} Normalized symbol parts
 */
function normalizeSymbol(symbol, source) {
  // Remove common separators
  const clean = symbol.replace(/[\/\-_\s]/g, '').toUpperCase();

  // Extract base and quote currency (assume 6 characters for forex)
  const base = clean.substring(0, 3);
  const quote = clean.substring(3, 6);

  switch (source) {
    case 'alphaVantage':
      return { base, quote, formatted: `${base}${quote}` };

    case 'yahoo':
      // Yahoo uses format like EURUSD=X for forex
      return { base, quote, formatted: `${base}${quote}=X` };

    case 'twelveData':
      // Twelve Data uses format like EUR/USD
      return { base, quote, formatted: `${base}/${quote}` };

    default:
      return { base, quote, formatted: clean };
  }
}

/**
 * Convert timeframe to source-specific format
 * @param {string} timeframe - Timeframe like "1H", "1D", "5M"
 * @param {string} source - Data source name
 * @returns {string} Source-specific timeframe
 */
function convertTimeframe(timeframe, source) {
  const map = {
    '1M': { alphaVantage: '1min', yahoo: '1m', twelveData: '1min' },
    '5M': { alphaVantage: '5min', yahoo: '5m', twelveData: '5min' },
    '15M': { alphaVantage: '15min', yahoo: '15m', twelveData: '15min' },
    '30M': { alphaVantage: '30min', yahoo: '30m', twelveData: '30min' },
    '1H': { alphaVantage: '60min', yahoo: '1h', twelveData: '1h' },
    '4H': { alphaVantage: null, yahoo: '1d', twelveData: '4h' }, // Alpha Vantage doesn't support 4H
    '1D': { alphaVantage: 'daily', yahoo: '1d', twelveData: '1day' },
    '1W': { alphaVantage: 'weekly', yahoo: '1wk', twelveData: '1week' },
    '1MO': { alphaVantage: 'monthly', yahoo: '1mo', twelveData: '1month' }
  };

  return map[timeframe.toUpperCase()]?.[source] || timeframe;
}

/**
 * Fetch data from Alpha Vantage API
 * @param {string} symbol - Currency pair (e.g., "EUR/USD")
 * @param {string} timeframe - Timeframe
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<Array>} Array of OHLCV candles
 */
async function fetchFromAlphaVantage(symbol, timeframe, startDate, endDate, apiKey) {
  if (!apiKey) {
    throw new Error('Alpha Vantage API key is required');
  }

  await waitForRateLimit('alphaVantage');

  const { base, quote } = normalizeSymbol(symbol, 'alphaVantage');
  const interval = convertTimeframe(timeframe, 'alphaVantage');

  if (!interval) {
    throw new Error(`Timeframe ${timeframe} not supported by Alpha Vantage`);
  }

  // Determine function based on timeframe
  const isIntraday = ['1min', '5min', '15min', '30min', '60min'].includes(interval);
  const func = isIntraday ? 'FX_INTRADAY' : 'FX_DAILY';

  // Build URL
  let url = `https://www.alphavantage.co/query?function=${func}&from_symbol=${base}&to_symbol=${quote}&apikey=${apiKey}`;

  if (isIntraday) {
    url += `&interval=${interval}&outputsize=full`;
  } else {
    url += '&outputsize=full';
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Check for API errors
  if (data['Error Message']) {
    throw new Error(`Alpha Vantage: ${data['Error Message']}`);
  }

  if (data['Note']) {
    // Rate limit message
    throw new Error(`Alpha Vantage rate limit: ${data['Note']}`);
  }

  // Extract time series data
  const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
  if (!timeSeriesKey) {
    throw new Error('No time series data found in Alpha Vantage response');
  }

  const timeSeries = data[timeSeriesKey];
  const candles = [];

  // Parse dates for filtering
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const [timestamp, values] of Object.entries(timeSeries)) {
    const candleDate = new Date(timestamp);

    // Filter by date range
    if (candleDate >= start && candleDate <= end) {
      candles.push({
        timestamp: timestamp,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: 0, // Forex doesn't have volume in Alpha Vantage
        source: 'alphavantage'
      });
    }
  }

  // Sort by timestamp ascending
  candles.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return candles;
}

/**
 * Fetch data from Yahoo Finance
 * @param {string} symbol - Currency pair
 * @param {string} timeframe - Timeframe
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} Array of OHLCV candles
 */
async function fetchFromYahoo(symbol, timeframe, startDate, endDate) {
  await waitForRateLimit('yahoo');

  const { formatted } = normalizeSymbol(symbol, 'yahoo');
  const interval = convertTimeframe(timeframe, 'yahoo');

  // Convert dates to Unix timestamps
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v7/finance/download/${formatted}?period1=${period1}&period2=${period2}&interval=${interval}&events=history`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('No data returned from Yahoo Finance');
  }

  // Parse CSV (skip header)
  const candles = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');

    if (values.length < 6) continue;

    // Yahoo CSV format: Date,Open,High,Low,Close,Adj Close,Volume
    const timestamp = values[0].trim();
    const open = parseFloat(values[1]);
    const high = parseFloat(values[2]);
    const low = parseFloat(values[3]);
    const close = parseFloat(values[4]);
    const volume = parseFloat(values[6] || 0);

    // Skip invalid rows
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      continue;
    }

    candles.push({
      timestamp: timestamp.includes('T') ? timestamp : timestamp + 'T00:00:00Z',
      open,
      high,
      low,
      close,
      volume,
      source: 'yahoo'
    });
  }

  return candles;
}

/**
 * Fetch data from Twelve Data API
 * @param {string} symbol - Currency pair
 * @param {string} timeframe - Timeframe
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @param {string} apiKey - Twelve Data API key
 * @returns {Promise<Array>} Array of OHLCV candles
 */
async function fetchFromTwelveData(symbol, timeframe, startDate, endDate, apiKey) {
  if (!apiKey) {
    throw new Error('Twelve Data API key is required');
  }

  await waitForRateLimit('twelveData');

  const { formatted } = normalizeSymbol(symbol, 'twelveData');
  const interval = convertTimeframe(timeframe, 'twelveData');

  // Build URL
  const url = `https://api.twelvedata.com/time_series?symbol=${formatted}&interval=${interval}&start_date=${startDate.split('T')[0]}&end_date=${endDate.split('T')[0]}&apikey=${apiKey}&format=JSON&outputsize=5000`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Check for errors
  if (data.status === 'error') {
    throw new Error(`Twelve Data: ${data.message}`);
  }

  if (!data.values || !Array.isArray(data.values)) {
    throw new Error('No data returned from Twelve Data');
  }

  // Parse data
  const candles = data.values.map(bar => ({
    timestamp: bar.datetime,
    open: parseFloat(bar.open),
    high: parseFloat(bar.high),
    low: parseFloat(bar.low),
    close: parseFloat(bar.close),
    volume: parseFloat(bar.volume || 0),
    source: 'twelvedata'
  }));

  // Sort by timestamp ascending (Twelve Data returns newest first)
  candles.reverse();

  return candles;
}

/**
 * Main fetch function that tries multiple sources
 * @param {Array<string>} sources - Array of source names to try in order
 * @param {string} symbol - Currency pair
 * @param {string} timeframe - Timeframe
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {object} apiKeys - Object with API keys { alphaVantage, twelveData }
 * @returns {Promise<object>} Result with data and metadata
 */
export async function fetchFromSources(sources, symbol, timeframe, startDate, endDate, apiKeys = {}) {
  const errors = [];

  for (const source of sources) {
    try {
      let data;

      switch (source.toLowerCase()) {
        case 'alphavantage':
          data = await fetchFromAlphaVantage(symbol, timeframe, startDate, endDate, apiKeys.alphavantage);
          break;

        case 'yahoo':
          data = await fetchFromYahoo(symbol, timeframe, startDate, endDate);
          break;

        case 'twelvedata':
          data = await fetchFromTwelveData(symbol, timeframe, startDate, endDate, apiKeys.twelvedata);
          break;

        default:
          throw new Error(`Unknown data source: ${source}`);
      }

      if (data && data.length > 0) {
        return {
          success: true,
          source,
          data,
          candles: data.length
        };
      }
    } catch (error) {
      errors.push({ source, error: error.message });
    }
  }

  // All sources failed
  throw new Error(`All data sources failed: ${errors.map(e => `${e.source}: ${e.error}`).join('; ')}`);
}

/**
 * Validate OHLC candle data
 * @param {object} candle - Single candle
 * @returns {object} Validation result
 */
export function validateCandle(candle) {
  const { open, high, low, close, timestamp } = candle;
  const issues = [];

  // Timestamp validation
  if (!timestamp || isNaN(new Date(timestamp))) {
    issues.push('Invalid timestamp');
  }

  // Price validation
  if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
    issues.push('Negative or zero prices');
  }

  // OHLC relationship validation
  if (high < open || high < close || high < low) {
    issues.push('High price is not the highest');
  }

  if (low > open || low > close || low > high) {
    issues.push('Low price is not the lowest');
  }

  // Check for extreme price movements (likely data errors)
  const maxPrice = Math.max(open, high, low, close);
  const minPrice = Math.min(open, high, low, close);
  const range = maxPrice - minPrice;
  const avgPrice = (open + close) / 2;

  if (range / avgPrice > 0.5) { // 50% range is suspicious for forex
    issues.push('Extreme price movement detected (possible data error)');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate entire dataset
 * @param {Array} data - Array of candles
 * @returns {object} Validation summary
 */
export function validateData(data) {
  const results = {
    total: data.length,
    valid: 0,
    invalid: 0,
    issues: []
  };

  data.forEach((candle, index) => {
    const validation = validateCandle(candle);
    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid++;
      results.issues.push({
        index,
        timestamp: candle.timestamp,
        problems: validation.issues
      });
    }
  });

  return results;
}

/**
 * Get interval in milliseconds for a timeframe
 * @param {string} timeframe - Timeframe like "1H", "1D"
 * @returns {number} Milliseconds
 */
function getIntervalMs(timeframe) {
  const map = {
    '1M': 60 * 1000,
    '5M': 5 * 60 * 1000,
    '15M': 15 * 60 * 1000,
    '30M': 30 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000
  };

  return map[timeframe.toUpperCase()] || 60 * 60 * 1000; // Default to 1H
}

/**
 * Fill gaps in time series data
 * @param {Array} data - Array of candles
 * @param {string} timeframe - Timeframe
 * @returns {object} Result with filled data and gap count
 */
export function fillGaps(data, timeframe) {
  if (data.length < 2) {
    return { data, gapsFilled: 0 };
  }

  const intervalMs = getIntervalMs(timeframe);
  const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const filled = [];
  let gapsFilled = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    filled.push(sorted[i]);

    const current = new Date(sorted[i].timestamp);
    const next = new Date(sorted[i + 1].timestamp);
    const gap = next - current;

    // If gap is larger than 1.5x the expected interval, fill it
    if (gap > intervalMs * 1.5) {
      const missingCandles = Math.floor(gap / intervalMs) - 1;

      for (let j = 1; j <= missingCandles; j++) {
        const filledTimestamp = new Date(current.getTime() + (j * intervalMs));
        filled.push({
          timestamp: filledTimestamp.toISOString(),
          open: sorted[i].close,
          high: sorted[i].close,
          low: sorted[i].close,
          close: sorted[i].close,
          volume: 0,
          filled: true,
          source: sorted[i].source
        });
        gapsFilled++;
      }
    }
  }

  filled.push(sorted[sorted.length - 1]);

  return {
    data: filled,
    gapsFilled
  };
}

/**
 * Merge data from multiple sources
 * @param {Array<Array>} dataArrays - Arrays of candle data from different sources
 * @param {string} strategy - Merge strategy ('prefer-newest', 'prefer-complete', 'first-available')
 * @returns {Array} Merged data
 */
export function mergeDataSources(dataArrays, strategy = 'prefer-newest') {
  if (dataArrays.length === 0) return [];
  if (dataArrays.length === 1) return dataArrays[0];

  // Create a map of timestamp -> candles from different sources
  const candleMap = new Map();

  dataArrays.forEach((dataArray, sourceIndex) => {
    dataArray.forEach(candle => {
      const timestamp = candle.timestamp;

      if (!candleMap.has(timestamp)) {
        candleMap.set(timestamp, []);
      }

      candleMap.get(timestamp).push({ ...candle, sourceIndex });
    });
  });

  // Merge based on strategy
  const merged = [];

  for (const [timestamp, candles] of candleMap.entries()) {
    let selected;

    switch (strategy) {
      case 'prefer-newest':
        // Use candle from the most recent source (last in array)
        selected = candles.reduce((prev, curr) =>
          curr.sourceIndex > prev.sourceIndex ? curr : prev
        );
        break;

      case 'prefer-complete':
        // Use candle with volume data if available
        selected = candles.find(c => c.volume > 0) || candles[0];
        break;

      case 'first-available':
      default:
        // Use first available
        selected = candles[0];
        break;
    }

    merged.push(selected);
  }

  // Sort by timestamp
  merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return merged;
}

/**
 * Get rate limit status for all sources
 * @returns {object} Status for each source
 */
export function getRateLimitStatus() {
  const today = new Date().toDateString();

  const status = {};

  for (const [source, limiter] of Object.entries(rateLimiter)) {
    // Reset counter if new day
    if (limiter.lastResetDate !== today) {
      limiter.callsToday = 0;
      limiter.lastResetDate = today;
    }

    status[source] = {
      available: true,
      requiresApiKey: source !== 'yahoo',
      dailyLimit: limiter.dailyLimit || 'unlimited',
      callsUsed: limiter.callsToday,
      callsRemaining: limiter.dailyLimit ? limiter.dailyLimit - limiter.callsToday : 'unlimited',
      lastCall: limiter.lastCall ? new Date(limiter.lastCall).toISOString() : null
    };
  }

  return status;
}
