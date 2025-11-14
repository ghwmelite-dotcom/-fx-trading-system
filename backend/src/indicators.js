// Technical Indicators Module for Backtesting Engine
// Provides all common FX technical indicators for strategy building

// ============================================
// MOVING AVERAGES
// ============================================

/**
 * Simple Moving Average (SMA)
 * @param {Array} data - Array of numbers (typically close prices)
 * @param {number} period - MA period
 * @returns {Array} - Array of SMA values (same length as data, early values are null)
 */
export function sma(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 * @param {Array} data - Array of numbers
 * @param {number} period - EMA period
 * @returns {Array} - Array of EMA values
 */
export function ema(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);

  // First EMA is SMA
  let emaValue = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // Calculate initial SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      emaValue = sum / period;
      result.push(emaValue);
    } else {
      // EMA = (Close - EMA_prev) * multiplier + EMA_prev
      emaValue = (data[i] - emaValue) * multiplier + emaValue;
      result.push(emaValue);
    }
  }

  return result;
}

/**
 * Weighted Moving Average (WMA)
 * @param {Array} data - Array of numbers
 * @param {number} period - WMA period
 * @returns {Array} - Array of WMA values
 */
export function wma(data, period) {
  const result = [];
  const divisor = (period * (period + 1)) / 2;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j] * (period - j);
      }
      result.push(sum / divisor);
    }
  }

  return result;
}

// ============================================
// MOMENTUM INDICATORS
// ============================================

/**
 * Relative Strength Index (RSI)
 * @param {Array} data - Array of close prices
 * @param {number} period - RSI period (typically 14)
 * @returns {Array} - Array of RSI values (0-100)
 */
export function rsi(data, period = 14) {
  const result = [];
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      result.push(null);
    } else {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);

      if (i < period) {
        result.push(null);
      } else if (i === period) {
        // First RSI calculation using SMA
        const avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - (100 / (1 + rs));
        result.push(rsiValue);
      } else {
        // Subsequent RSI using smoothed averages
        const prevRSI = result[i - 1];
        const prevRS = (100 - prevRSI) / prevRSI;
        const prevAvgGain = prevRS / (1 + prevRS) * period;
        const prevAvgLoss = period / (1 + prevRS);

        const avgGain = (prevAvgGain * (period - 1) + gains[i]) / period;
        const avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - (100 / (1 + rs));
        result.push(rsiValue);
      }
    }
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 * @param {Array} data - Array of close prices
 * @param {number} fastPeriod - Fast EMA period (typically 12)
 * @param {number} slowPeriod - Slow EMA period (typically 26)
 * @param {number} signalPeriod - Signal line period (typically 9)
 * @returns {Object} - {macd: [], signal: [], histogram: []}
 */
export function macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = ema(data, fastPeriod);
  const slowEMA = ema(data, slowPeriod);

  // MACD line = Fast EMA - Slow EMA
  const macdLine = fastEMA.map((fast, i) => {
    if (fast === null || slowEMA[i] === null) return null;
    return fast - slowEMA[i];
  });

  // Signal line = EMA of MACD line
  const macdValues = macdLine.filter(v => v !== null);
  const signalEMA = ema(macdValues, signalPeriod);

  // Pad signal line with nulls
  const nullCount = macdLine.findIndex(v => v !== null) + signalPeriod - 1;
  const signalLine = Array(nullCount).fill(null).concat(signalEMA.filter(v => v !== null));

  // Histogram = MACD - Signal
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null;
    return macd - signalLine[i];
  });

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

/**
 * Stochastic Oscillator
 * @param {Array} high - Array of high prices
 * @param {Array} low - Array of low prices
 * @param {Array} close - Array of close prices
 * @param {number} period - %K period (typically 14)
 * @param {number} kSmooth - %K smoothing (typically 3)
 * @param {number} dPeriod - %D period (typically 3)
 * @returns {Object} - {k: [], d: []}
 */
export function stochastic(high, low, close, period = 14, kSmooth = 3, dPeriod = 3) {
  const rawK = [];

  // Calculate raw %K
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      rawK.push(null);
    } else {
      const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
      const currentClose = close[i];

      if (highestHigh === lowestLow) {
        rawK.push(50); // Avoid division by zero
      } else {
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        rawK.push(k);
      }
    }
  }

  // Smooth %K
  const validK = rawK.filter(v => v !== null);
  const smoothK = sma(validK, kSmooth);
  const nullCount = rawK.findIndex(v => v !== null) + kSmooth - 1;
  const k = Array(nullCount).fill(null).concat(smoothK.filter(v => v !== null));

  // Calculate %D (SMA of %K)
  const validKForD = k.filter(v => v !== null);
  const dValues = sma(validKForD, dPeriod);
  const dNullCount = k.findIndex(v => v !== null) + dPeriod - 1;
  const d = Array(dNullCount).fill(null).concat(dValues.filter(v => v !== null));

  return { k, d };
}

// ============================================
// VOLATILITY INDICATORS
// ============================================

/**
 * Bollinger Bands
 * @param {Array} data - Array of close prices
 * @param {number} period - Period for SMA (typically 20)
 * @param {number} stdDev - Number of standard deviations (typically 2)
 * @returns {Object} - {upper: [], middle: [], lower: []}
 */
export function bollingerBands(data, period = 20, stdDev = 2) {
  const middle = sma(data, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      // Calculate standard deviation
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const sd = Math.sqrt(variance);

      upper.push(mean + (stdDev * sd));
      lower.push(mean - (stdDev * sd));
    }
  }

  return { upper, middle, lower };
}

/**
 * Average True Range (ATR)
 * @param {Array} high - Array of high prices
 * @param {Array} low - Array of low prices
 * @param {Array} close - Array of close prices
 * @param {number} period - ATR period (typically 14)
 * @returns {Array} - Array of ATR values
 */
export function atr(high, low, close, period = 14) {
  const trueRanges = [];

  // Calculate True Range for each bar
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      trueRanges.push(high[i] - low[i]);
    } else {
      const tr = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
      trueRanges.push(tr);
    }
  }

  // Calculate ATR (smoothed average of TR)
  const result = [];
  let atrValue = null;

  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First ATR is simple average
      atrValue = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(atrValue);
    } else {
      // Subsequent ATR is smoothed
      atrValue = ((atrValue * (period - 1)) + trueRanges[i]) / period;
      result.push(atrValue);
    }
  }

  return result;
}

// ============================================
// TREND INDICATORS
// ============================================

/**
 * Average Directional Index (ADX)
 * Measures trend strength (0-100)
 * @param {Array} high - Array of high prices
 * @param {Array} low - Array of low prices
 * @param {Array} close - Array of close prices
 * @param {number} period - ADX period (typically 14)
 * @returns {Object} - {adx: [], plusDI: [], minusDI: []}
 */
export function adx(high, low, close, period = 14) {
  const plusDM = [];
  const minusDM = [];
  const tr = [];

  // Calculate +DM, -DM, and TR
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(high[i] - low[i]);
    } else {
      const highDiff = high[i] - high[i - 1];
      const lowDiff = low[i - 1] - low[i];

      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      tr.push(Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      ));
    }
  }

  // Smooth +DM, -DM, and TR
  const smoothPlusDM = [];
  const smoothMinusDM = [];
  const smoothTR = [];

  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      smoothPlusDM.push(null);
      smoothMinusDM.push(null);
      smoothTR.push(null);
    } else if (i === period - 1) {
      smoothPlusDM.push(plusDM.slice(0, period).reduce((a, b) => a + b, 0));
      smoothMinusDM.push(minusDM.slice(0, period).reduce((a, b) => a + b, 0));
      smoothTR.push(tr.slice(0, period).reduce((a, b) => a + b, 0));
    } else {
      smoothPlusDM.push(smoothPlusDM[i - 1] - (smoothPlusDM[i - 1] / period) + plusDM[i]);
      smoothMinusDM.push(smoothMinusDM[i - 1] - (smoothMinusDM[i - 1] / period) + minusDM[i]);
      smoothTR.push(smoothTR[i - 1] - (smoothTR[i - 1] / period) + tr[i]);
    }
  }

  // Calculate +DI and -DI
  const plusDI = smoothPlusDM.map((val, i) => {
    if (val === null || smoothTR[i] === 0) return null;
    return (val / smoothTR[i]) * 100;
  });

  const minusDI = smoothMinusDM.map((val, i) => {
    if (val === null || smoothTR[i] === 0) return null;
    return (val / smoothTR[i]) * 100;
  });

  // Calculate DX
  const dx = plusDI.map((plus, i) => {
    if (plus === null || minusDI[i] === null) return null;
    const sum = plus + minusDI[i];
    if (sum === 0) return 0;
    return (Math.abs(plus - minusDI[i]) / sum) * 100;
  });

  // Calculate ADX (smoothed DX)
  const validDX = dx.filter(v => v !== null);
  const adxValues = [];
  let adxValue = null;

  for (let i = 0; i < validDX.length; i++) {
    if (i < period - 1) {
      adxValues.push(null);
    } else if (i === period - 1) {
      adxValue = validDX.slice(0, period).reduce((a, b) => a + b, 0) / period;
      adxValues.push(adxValue);
    } else {
      adxValue = ((adxValue * (period - 1)) + validDX[i]) / period;
      adxValues.push(adxValue);
    }
  }

  // Pad ADX with nulls
  const adxNullCount = dx.findIndex(v => v !== null) + period - 1;
  const adxResult = Array(adxNullCount).fill(null).concat(adxValues.filter(v => v !== null));

  return { adx: adxResult, plusDI, minusDI };
}

/**
 * Parabolic SAR
 * @param {Array} high - Array of high prices
 * @param {Array} low - Array of low prices
 * @param {number} accelerationFactor - Initial AF (typically 0.02)
 * @param {number} maxAcceleration - Max AF (typically 0.2)
 * @returns {Array} - Array of SAR values
 */
export function parabolicSAR(high, low, accelerationFactor = 0.02, maxAcceleration = 0.2) {
  const sar = [];
  let isLong = true;
  let af = accelerationFactor;
  let ep = high[0]; // Extreme point
  let sarValue = low[0];

  sar.push(sarValue);

  for (let i = 1; i < high.length; i++) {
    // Calculate new SAR
    sarValue = sarValue + af * (ep - sarValue);

    // Check for reversal
    if (isLong) {
      if (low[i] < sarValue) {
        // Reversal to short
        isLong = false;
        sarValue = ep;
        ep = low[i];
        af = accelerationFactor;
      } else {
        // Continue long
        if (high[i] > ep) {
          ep = high[i];
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    } else {
      if (high[i] > sarValue) {
        // Reversal to long
        isLong = true;
        sarValue = ep;
        ep = high[i];
        af = accelerationFactor;
      } else {
        // Continue short
        if (low[i] < ep) {
          ep = low[i];
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    }

    sar.push(sarValue);
  }

  return sar;
}

// ============================================
// VOLUME INDICATORS
// ============================================

/**
 * On-Balance Volume (OBV)
 * @param {Array} close - Array of close prices
 * @param {Array} volume - Array of volume data
 * @returns {Array} - Array of OBV values
 */
export function obv(close, volume) {
  const result = [volume[0]];

  for (let i = 1; i < close.length; i++) {
    if (close[i] > close[i - 1]) {
      result.push(result[i - 1] + volume[i]);
    } else if (close[i] < close[i - 1]) {
      result.push(result[i - 1] - volume[i]);
    } else {
      result.push(result[i - 1]);
    }
  }

  return result;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get indicator function by name
 * @param {string} name - Indicator name
 * @returns {Function} - Indicator function
 */
export function getIndicator(name) {
  const indicators = {
    sma,
    ema,
    wma,
    rsi,
    macd,
    stochastic,
    bollingerBands,
    atr,
    adx,
    parabolicSAR,
    obv
  };

  return indicators[name.toLowerCase()] || null;
}

/**
 * Calculate all indicators for a dataset
 * @param {Object} bars - OHLCV data {open: [], high: [], low: [], close: [], volume: []}
 * @param {Object} config - Indicator configurations
 * @returns {Object} - Object with all calculated indicators
 */
export function calculateIndicators(bars, config = {}) {
  const result = {};

  // Extract OHLCV arrays
  const { open, high, low, close, volume } = bars;

  // Calculate requested indicators
  if (config.sma) {
    config.sma.forEach(period => {
      result[`sma_${period}`] = sma(close, period);
    });
  }

  if (config.ema) {
    config.ema.forEach(period => {
      result[`ema_${period}`] = ema(close, period);
    });
  }

  if (config.rsi) {
    config.rsi.forEach(period => {
      result[`rsi_${period}`] = rsi(close, period);
    });
  }

  if (config.macd) {
    const { fast = 12, slow = 26, signal = 9 } = config.macd;
    const macdResult = macd(close, fast, slow, signal);
    result.macd_line = macdResult.macd;
    result.macd_signal = macdResult.signal;
    result.macd_histogram = macdResult.histogram;
  }

  if (config.bollingerBands) {
    const { period = 20, stdDev = 2 } = config.bollingerBands;
    const bb = bollingerBands(close, period, stdDev);
    result.bb_upper = bb.upper;
    result.bb_middle = bb.middle;
    result.bb_lower = bb.lower;
  }

  if (config.atr) {
    config.atr.forEach(period => {
      result[`atr_${period}`] = atr(high, low, close, period);
    });
  }

  if (config.stochastic) {
    const { period = 14, kSmooth = 3, dPeriod = 3 } = config.stochastic;
    const stoch = stochastic(high, low, close, period, kSmooth, dPeriod);
    result.stoch_k = stoch.k;
    result.stoch_d = stoch.d;
  }

  if (config.adx) {
    config.adx.forEach(period => {
      const adxResult = adx(high, low, close, period);
      result[`adx_${period}`] = adxResult.adx;
      result[`plusDI_${period}`] = adxResult.plusDI;
      result[`minusDI_${period}`] = adxResult.minusDI;
    });
  }

  return result;
}

// Export all indicators
export default {
  sma,
  ema,
  wma,
  rsi,
  macd,
  stochastic,
  bollingerBands,
  atr,
  adx,
  parabolicSAR,
  obv,
  getIndicator,
  calculateIndicators
};
