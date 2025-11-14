// Strategy Execution Engine
// Evaluates trading strategies and generates entry/exit signals

import { calculateIndicators, sma, ema, rsi, macd, bollingerBands, atr, stochastic, adx } from './indicators.js';

// ============================================
// SIGNAL GENERATION
// ============================================

/**
 * Generate trading signals based on strategy configuration
 * @param {Object} strategy - Strategy configuration
 * @param {Object} bars - OHLCV data {open: [], high: [], low: [], close: [], volume: [], timestamp: []}
 * @param {Object} indicators - Pre-calculated indicators
 * @returns {Array} - Array of signals [{index: 0, signal: 'buy'|'sell'|'close', price: 1.0950, reason: '...'}]
 */
export function generateSignals(strategy, bars, indicators) {
  const { strategy_type } = strategy;

  switch (strategy_type) {
    case 'indicator':
      return generateIndicatorSignals(strategy, bars, indicators);
    case 'rules':
      return generateRulesSignals(strategy, bars, indicators);
    case 'custom':
      return generateCustomSignals(strategy, bars, indicators);
    default:
      throw new Error(`Unknown strategy type: ${strategy_type}`);
  }
}

// ============================================
// INDICATOR-BASED STRATEGIES
// ============================================

/**
 * Generate signals from pre-built indicator strategies
 * @param {Object} strategy - Strategy with indicator_config
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @returns {Array} - Array of signals
 */
function generateIndicatorSignals(strategy, bars, indicators) {
  const config = JSON.parse(strategy.indicator_config || '{}');
  const signals = [];

  switch (config.type) {
    case 'ma_crossover':
      return maCrossoverSignals(bars, indicators, config);
    case 'rsi_extremes':
      return rsiExtremesSignals(bars, indicators, config);
    case 'macd_crossover':
      return macdCrossoverSignals(bars, indicators, config);
    case 'bollinger_bounce':
      return bollingerBounceSignals(bars, indicators, config);
    case 'stochastic_crossover':
      return stochasticCrossoverSignals(bars, indicators, config);
    default:
      throw new Error(`Unknown indicator strategy: ${config.type}`);
  }
}

/**
 * Moving Average Crossover Strategy
 * Buy when fast MA crosses above slow MA, sell when crosses below
 */
function maCrossoverSignals(bars, indicators, config) {
  const { fast_period = 10, slow_period = 20, ma_type = 'sma' } = config;
  const fastKey = `${ma_type}_${fast_period}`;
  const slowKey = `${ma_type}_${slow_period}`;

  const fastMA = indicators[fastKey];
  const slowMA = indicators[slowKey];
  const signals = [];

  for (let i = 1; i < bars.close.length; i++) {
    if (fastMA[i] === null || slowMA[i] === null) continue;

    // Bullish crossover: fast crosses above slow
    if (fastMA[i - 1] <= slowMA[i - 1] && fastMA[i] > slowMA[i]) {
      signals.push({
        index: i,
        signal: 'buy',
        price: bars.close[i],
        reason: `${ma_type.toUpperCase()}(${fast_period}) crossed above ${ma_type.toUpperCase()}(${slow_period})`
      });
    }
    // Bearish crossover: fast crosses below slow
    else if (fastMA[i - 1] >= slowMA[i - 1] && fastMA[i] < slowMA[i]) {
      signals.push({
        index: i,
        signal: 'sell',
        price: bars.close[i],
        reason: `${ma_type.toUpperCase()}(${fast_period}) crossed below ${ma_type.toUpperCase()}(${slow_period})`
      });
    }
  }

  return signals;
}

/**
 * RSI Extremes Strategy
 * Buy when RSI < oversold, sell when RSI > overbought
 */
function rsiExtremesSignals(bars, indicators, config) {
  const { period = 14, oversold = 30, overbought = 70 } = config;
  const rsiKey = `rsi_${period}`;
  const rsiValues = indicators[rsiKey];
  const signals = [];

  for (let i = 1; i < bars.close.length; i++) {
    if (rsiValues[i] === null) continue;

    // Buy signal: RSI crosses above oversold level
    if (rsiValues[i - 1] <= oversold && rsiValues[i] > oversold) {
      signals.push({
        index: i,
        signal: 'buy',
        price: bars.close[i],
        reason: `RSI(${period}) crossed above ${oversold} (oversold)`
      });
    }
    // Sell signal: RSI crosses below overbought level
    else if (rsiValues[i - 1] >= overbought && rsiValues[i] < overbought) {
      signals.push({
        index: i,
        signal: 'sell',
        price: bars.close[i],
        reason: `RSI(${period}) crossed below ${overbought} (overbought)`
      });
    }
  }

  return signals;
}

/**
 * MACD Crossover Strategy
 * Buy when MACD crosses above signal, sell when crosses below
 */
function macdCrossoverSignals(bars, indicators, config) {
  const macdLine = indicators.macd_line;
  const signalLine = indicators.macd_signal;
  const signals = [];

  for (let i = 1; i < bars.close.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) continue;

    // Bullish crossover
    if (macdLine[i - 1] <= signalLine[i - 1] && macdLine[i] > signalLine[i]) {
      signals.push({
        index: i,
        signal: 'buy',
        price: bars.close[i],
        reason: 'MACD crossed above signal line'
      });
    }
    // Bearish crossover
    else if (macdLine[i - 1] >= signalLine[i - 1] && macdLine[i] < signalLine[i]) {
      signals.push({
        index: i,
        signal: 'sell',
        price: bars.close[i],
        reason: 'MACD crossed below signal line'
      });
    }
  }

  return signals;
}

/**
 * Bollinger Bands Bounce Strategy
 * Buy when price touches lower band, sell when touches upper band
 */
function bollingerBounceSignals(bars, indicators, config) {
  const upper = indicators.bb_upper;
  const lower = indicators.bb_lower;
  const signals = [];

  for (let i = 0; i < bars.close.length; i++) {
    if (upper[i] === null || lower[i] === null) continue;

    // Buy when price touches or goes below lower band
    if (bars.low[i] <= lower[i]) {
      signals.push({
        index: i,
        signal: 'buy',
        price: bars.close[i],
        reason: 'Price touched lower Bollinger Band'
      });
    }
    // Sell when price touches or goes above upper band
    else if (bars.high[i] >= upper[i]) {
      signals.push({
        index: i,
        signal: 'sell',
        price: bars.close[i],
        reason: 'Price touched upper Bollinger Band'
      });
    }
  }

  return signals;
}

/**
 * Stochastic Crossover Strategy
 * Buy when %K crosses above %D in oversold, sell when crosses below in overbought
 */
function stochasticCrossoverSignals(bars, indicators, config) {
  const { oversold = 20, overbought = 80 } = config;
  const k = indicators.stoch_k;
  const d = indicators.stoch_d;
  const signals = [];

  for (let i = 1; i < bars.close.length; i++) {
    if (k[i] === null || d[i] === null) continue;

    // Bullish: %K crosses above %D in oversold zone
    if (k[i - 1] <= d[i - 1] && k[i] > d[i] && k[i] < oversold) {
      signals.push({
        index: i,
        signal: 'buy',
        price: bars.close[i],
        reason: 'Stochastic bullish crossover in oversold zone'
      });
    }
    // Bearish: %K crosses below %D in overbought zone
    else if (k[i - 1] >= d[i - 1] && k[i] < d[i] && k[i] > overbought) {
      signals.push({
        index: i,
        signal: 'sell',
        price: bars.close[i],
        reason: 'Stochastic bearish crossover in overbought zone'
      });
    }
  }

  return signals;
}

// ============================================
// RULES-BASED STRATEGIES
// ============================================

/**
 * Generate signals from rules-based visual builder
 * Rules format: [{field: 'close', operator: '>', value: 'sma_20'}, ...]
 * @param {Object} strategy - Strategy with rules_config
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @returns {Array} - Array of signals
 */
function generateRulesSignals(strategy, bars, indicators) {
  const entryRules = JSON.parse(strategy.entry_conditions || '[]');
  const exitRules = JSON.parse(strategy.exit_conditions || '[]');
  const signals = [];

  for (let i = 0; i < bars.close.length; i++) {
    // Check entry rules
    const entrySignal = evaluateRules(entryRules, bars, indicators, i);
    if (entrySignal) {
      signals.push({
        index: i,
        signal: entrySignal.signal, // 'buy' or 'sell'
        price: bars.close[i],
        reason: entrySignal.reason
      });
    }

    // Check exit rules
    const exitSignal = evaluateRules(exitRules, bars, indicators, i);
    if (exitSignal) {
      signals.push({
        index: i,
        signal: 'close',
        price: bars.close[i],
        reason: exitSignal.reason
      });
    }
  }

  return signals;
}

/**
 * Evaluate a set of rules for a specific bar
 * @param {Array} rules - Array of rule objects
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @param {number} index - Current bar index
 * @returns {Object|null} - Signal object or null
 */
function evaluateRules(rules, bars, indicators, index) {
  if (rules.length === 0) return null;

  const logic = rules[0].logic || 'AND'; // AND or OR
  let results = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, bars, indicators, index);
    results.push(result);
  }

  // Combine results based on logic
  const passed = logic === 'AND'
    ? results.every(r => r)
    : results.some(r => r);

  if (passed) {
    return {
      signal: rules[0].signal || 'buy', // 'buy', 'sell', 'close'
      reason: rules.map(r => r.description || 'Rule matched').join(' AND ')
    };
  }

  return null;
}

/**
 * Evaluate a single rule condition
 * @param {Object} rule - Rule object {field, operator, value, lookback}
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @param {number} index - Current bar index
 * @returns {boolean} - True if rule passes
 */
function evaluateRule(rule, bars, indicators, index) {
  const { field, operator, value, lookback = 0 } = rule;
  const actualIndex = index - lookback;

  if (actualIndex < 0) return false;

  // Get left-hand value (from bars or indicators)
  const leftValue = getValue(field, bars, indicators, actualIndex);
  if (leftValue === null || leftValue === undefined) return false;

  // Get right-hand value (could be number, indicator, or field)
  const rightValue = getValue(value, bars, indicators, actualIndex);
  if (rightValue === null || rightValue === undefined) return false;

  // Evaluate condition
  switch (operator) {
    case '>':
      return leftValue > rightValue;
    case '<':
      return leftValue < rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<=':
      return leftValue <= rightValue;
    case '==':
      return Math.abs(leftValue - rightValue) < 0.00001; // Float comparison
    case '!=':
      return Math.abs(leftValue - rightValue) >= 0.00001;
    case 'crosses_above':
      if (actualIndex === 0) return false;
      const prevLeft1 = getValue(field, bars, indicators, actualIndex - 1);
      const prevRight1 = getValue(value, bars, indicators, actualIndex - 1);
      return prevLeft1 <= prevRight1 && leftValue > rightValue;
    case 'crosses_below':
      if (actualIndex === 0) return false;
      const prevLeft2 = getValue(field, bars, indicators, actualIndex - 1);
      const prevRight2 = getValue(value, bars, indicators, actualIndex - 1);
      return prevLeft2 >= prevRight2 && leftValue < rightValue;
    default:
      return false;
  }
}

/**
 * Get value from field name (supports bars fields and indicators)
 * @param {string|number} field - Field name or numeric value
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @param {number} index - Bar index
 * @returns {number|null} - Value
 */
function getValue(field, bars, indicators, index) {
  // If it's a number, return it
  if (typeof field === 'number') {
    return field;
  }

  // Try to parse as number
  const numValue = parseFloat(field);
  if (!isNaN(numValue)) {
    return numValue;
  }

  // Check if it's a bar field
  const barFields = ['open', 'high', 'low', 'close', 'volume'];
  if (barFields.includes(field.toLowerCase())) {
    return bars[field.toLowerCase()][index];
  }

  // Check if it's an indicator
  if (indicators[field]) {
    return indicators[field][index];
  }

  return null;
}

// ============================================
// CUSTOM CODE STRATEGIES
// ============================================

/**
 * Execute custom JavaScript strategy code
 * @param {Object} strategy - Strategy with custom_code
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @returns {Array} - Array of signals
 */
function generateCustomSignals(strategy, bars, indicators) {
  try {
    // Security note: In production, consider using a sandboxed environment
    // For now, we'll use Function constructor with limited scope
    const customFunction = new Function('bars', 'indicators', strategy.custom_code);

    // Execute custom code
    const signals = customFunction(bars, indicators);

    // Validate signals format
    if (!Array.isArray(signals)) {
      throw new Error('Custom code must return an array of signals');
    }

    // Validate each signal
    return signals.filter(signal => {
      return signal.index !== undefined &&
             signal.signal !== undefined &&
             signal.price !== undefined;
    });
  } catch (error) {
    console.error('Custom strategy execution error:', error);
    throw new Error(`Custom strategy error: ${error.message}`);
  }
}

// ============================================
// POSITION MANAGEMENT
// ============================================

/**
 * Calculate position size based on strategy configuration
 * @param {Object} strategy - Strategy configuration
 * @param {number} accountBalance - Current account balance
 * @param {number} entryPrice - Entry price
 * @param {number} stopLossPrice - Stop loss price
 * @param {string} symbol - Trading symbol
 * @returns {number} - Lot size
 */
export function calculatePositionSize(strategy, accountBalance, entryPrice, stopLossPrice, symbol) {
  const { position_size_type, position_size_value, max_risk_per_trade } = strategy;

  switch (position_size_type) {
    case 'fixed':
      // Fixed lot size
      return position_size_value;

    case 'percentage':
      // Percentage of account balance
      // Calculate lot size that equals X% of account
      const percentageAmount = accountBalance * (position_size_value / 100);
      return percentageAmount / (entryPrice * 100000); // Approximate for standard lot

    case 'risk_based':
      // Risk-based position sizing
      if (!stopLossPrice) return position_size_value; // Fallback to fixed

      const riskAmount = accountBalance * (max_risk_per_trade / 100);
      const stopLossPips = Math.abs(entryPrice - stopLossPrice) / getPipSize(symbol);
      const pipValue = 10; // $10 per pip for standard lot (simplified)

      // Lot size = Risk Amount / (Stop Loss Pips × Pip Value)
      const lotSize = riskAmount / (stopLossPips * pipValue);
      return Math.max(0.01, Math.min(lotSize, 100)); // Clamp between 0.01 and 100 lots

    default:
      return 0.01; // Default minimum lot size
  }
}

/**
 * Calculate stop loss and take profit prices
 * @param {Object} strategy - Strategy configuration
 * @param {number} entryPrice - Entry price
 * @param {string} signal - 'buy' or 'sell'
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Pre-calculated indicators
 * @param {number} index - Current bar index
 * @param {string} symbol - Trading symbol
 * @returns {Object} - {stopLoss, takeProfit}
 */
export function calculateStopLossTakeProfit(strategy, entryPrice, signal, bars, indicators, index, symbol) {
  const pipSize = getPipSize(symbol);
  let stopLoss = null;
  let takeProfit = null;

  // Calculate Stop Loss
  const { stop_loss_type, stop_loss_value } = strategy;

  switch (stop_loss_type) {
    case 'fixed':
      // Fixed pips
      if (signal === 'buy') {
        stopLoss = entryPrice - (stop_loss_value * pipSize);
      } else {
        stopLoss = entryPrice + (stop_loss_value * pipSize);
      }
      break;

    case 'atr':
      // ATR-based stop loss
      const atrKey = 'atr_14'; // Default to ATR(14)
      const atrValue = indicators[atrKey] ? indicators[atrKey][index] : null;
      if (atrValue) {
        const atrMultiple = stop_loss_value || 2; // Default 2x ATR
        if (signal === 'buy') {
          stopLoss = entryPrice - (atrValue * atrMultiple);
        } else {
          stopLoss = entryPrice + (atrValue * atrMultiple);
        }
      }
      break;

    case 'percentage':
      // Percentage of entry price
      const percentage = stop_loss_value / 100;
      if (signal === 'buy') {
        stopLoss = entryPrice * (1 - percentage);
      } else {
        stopLoss = entryPrice * (1 + percentage);
      }
      break;
  }

  // Calculate Take Profit
  const { take_profit_type, take_profit_value } = strategy;

  switch (take_profit_type) {
    case 'fixed':
      // Fixed pips
      if (signal === 'buy') {
        takeProfit = entryPrice + (take_profit_value * pipSize);
      } else {
        takeProfit = entryPrice - (take_profit_value * pipSize);
      }
      break;

    case 'atr':
      // ATR-based take profit
      const atrKey = 'atr_14';
      const atrValue = indicators[atrKey] ? indicators[atrKey][index] : null;
      if (atrValue) {
        const atrMultiple = take_profit_value || 3; // Default 3x ATR
        if (signal === 'buy') {
          takeProfit = entryPrice + (atrValue * atrMultiple);
        } else {
          takeProfit = entryPrice - (atrValue * atrMultiple);
        }
      }
      break;

    case 'percentage':
      // Percentage of entry price
      const percentage = take_profit_value / 100;
      if (signal === 'buy') {
        takeProfit = entryPrice * (1 + percentage);
      } else {
        takeProfit = entryPrice * (1 - percentage);
      }
      break;

    case 'risk_reward':
      // Risk/reward ratio
      if (stopLoss) {
        const riskPips = Math.abs(entryPrice - stopLoss) / pipSize;
        const rewardPips = riskPips * (take_profit_value || 2); // Default 2:1 R:R
        if (signal === 'buy') {
          takeProfit = entryPrice + (rewardPips * pipSize);
        } else {
          takeProfit = entryPrice - (rewardPips * pipSize);
        }
      }
      break;
  }

  return { stopLoss, takeProfit };
}

/**
 * Get pip size for a symbol
 * @param {string} symbol - Trading symbol
 * @returns {number} - Pip size
 */
function getPipSize(symbol) {
  // JPY pairs have different pip size
  if (symbol.includes('JPY')) {
    return 0.01; // 2 decimal places
  }
  return 0.0001; // 4 decimal places for most pairs
}

// Export all functions
export default {
  generateSignals,
  calculatePositionSize,
  calculateStopLossTakeProfit
};
