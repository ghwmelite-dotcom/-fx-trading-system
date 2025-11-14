// Backtesting Engine - Core Logic
// Simulates trade execution based on historical data and strategy signals

import { calculateIndicators } from './indicators.js';
import { generateSignals, calculatePositionSize, calculateStopLossTakeProfit } from './strategyEngine.js';

// ============================================
// MAIN BACKTEST EXECUTION
// ============================================

/**
 * Run a complete backtest
 * @param {Object} backtest - Backtest configuration from database
 * @param {Object} strategy - Strategy configuration from database
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Object} - {trades: [], metrics: {}}
 */
export async function runBacktest(backtest, strategy, env) {
  const startTime = Date.now();

  try {
    // 1. Load historical data
    console.log('Loading historical data...');
    const bars = await loadHistoricalData(env, backtest);

    if (bars.close.length === 0) {
      throw new Error('No historical data found for the specified date range');
    }

    // 2. Calculate required indicators
    console.log('Calculating indicators...');
    const indicatorConfig = getRequiredIndicators(strategy);
    const indicators = calculateIndicators(bars, indicatorConfig);

    // 3. Generate trading signals
    console.log('Generating signals...');
    const signals = generateSignals(strategy, bars, indicators);

    if (signals.length === 0) {
      console.log('No trading signals generated');
      return { trades: [], metrics: null };
    }

    // 4. Simulate trade execution
    console.log(`Simulating ${signals.length} signals...`);
    const trades = await simulateTrades(backtest, strategy, bars, indicators, signals);

    // 5. Calculate performance metrics
    console.log('Calculating performance metrics...');
    const metrics = calculatePerformanceMetrics(trades, backtest.initial_capital, bars);

    // 6. Calculate execution time
    const executionTime = Date.now() - startTime;
    metrics.execution_time_ms = executionTime;
    metrics.bars_processed = bars.close.length;

    return { trades, metrics };
  } catch (error) {
    console.error('Backtest execution error:', error);
    throw error;
  }
}

// ============================================
// DATA LOADING
// ============================================

/**
 * Load historical data from database
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} backtest - Backtest configuration
 * @returns {Object} - OHLCV data {open: [], high: [], low: [], close: [], volume: [], timestamp: []}
 */
async function loadHistoricalData(env, backtest) {
  const { user_id, symbol, timeframe, start_date, end_date } = backtest;

  const result = await env.DB.prepare(`
    SELECT timestamp, open, high, low, close, volume, spread
    FROM historical_data
    WHERE user_id = ? AND symbol = ? AND timeframe = ?
      AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `).bind(user_id, symbol, timeframe, start_date, end_date).all();

  // Transform rows into OHLCV arrays
  const bars = {
    timestamp: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: [],
    spread: []
  };

  for (const row of result.results || []) {
    bars.timestamp.push(row.timestamp);
    bars.open.push(row.open);
    bars.high.push(row.high);
    bars.low.push(row.low);
    bars.close.push(row.close);
    bars.volume.push(row.volume || 0);
    bars.spread.push(row.spread || 0);
  }

  return bars;
}

// ============================================
// INDICATOR CONFIGURATION
// ============================================

/**
 * Determine which indicators need to be calculated based on strategy
 * @param {Object} strategy - Strategy configuration
 * @returns {Object} - Indicator configuration
 */
function getRequiredIndicators(strategy) {
  const config = {};

  // Parse strategy configuration based on type
  if (strategy.strategy_type === 'indicator') {
    const indicatorConfig = JSON.parse(strategy.indicator_config || '{}');

    switch (indicatorConfig.type) {
      case 'ma_crossover':
        const maType = indicatorConfig.ma_type || 'sma';
        config[maType] = [indicatorConfig.fast_period || 10, indicatorConfig.slow_period || 20];
        break;

      case 'rsi_extremes':
        config.rsi = [indicatorConfig.period || 14];
        break;

      case 'macd_crossover':
        config.macd = {
          fast: indicatorConfig.fast_period || 12,
          slow: indicatorConfig.slow_period || 26,
          signal: indicatorConfig.signal_period || 9
        };
        break;

      case 'bollinger_bounce':
        config.bollingerBands = {
          period: indicatorConfig.period || 20,
          stdDev: indicatorConfig.std_dev || 2
        };
        break;

      case 'stochastic_crossover':
        config.stochastic = {
          period: indicatorConfig.period || 14,
          kSmooth: indicatorConfig.k_smooth || 3,
          dPeriod: indicatorConfig.d_period || 3
        };
        break;
    }
  } else if (strategy.strategy_type === 'rules') {
    // Parse rules to find referenced indicators
    const entryRules = JSON.parse(strategy.entry_conditions || '[]');
    const exitRules = JSON.parse(strategy.exit_conditions || '[]');

    for (const rule of [...entryRules, ...exitRules]) {
      extractIndicatorFromRule(rule, config);
    }
  }

  // Always calculate ATR if using ATR-based stops
  if (strategy.stop_loss_type === 'atr' || strategy.take_profit_type === 'atr') {
    config.atr = config.atr || [];
    if (!config.atr.includes(14)) {
      config.atr.push(14);
    }
  }

  return config;
}

/**
 * Extract indicator requirements from a rule
 * @param {Object} rule - Rule object
 * @param {Object} config - Indicator configuration to populate
 */
function extractIndicatorFromRule(rule, config) {
  const { field, value } = rule;

  // Check if field or value references an indicator
  [field, value].forEach(ref => {
    if (typeof ref !== 'string') return;

    // Match patterns like "sma_20", "ema_50", "rsi_14", etc.
    const match = ref.match(/^(sma|ema|wma|rsi|atr)_(\d+)$/i);
    if (match) {
      const [, indicator, period] = match;
      const indicatorKey = indicator.toLowerCase();

      if (!config[indicatorKey]) {
        config[indicatorKey] = [];
      }
      if (!config[indicatorKey].includes(parseInt(period))) {
        config[indicatorKey].push(parseInt(period));
      }
    }

    // Check for complex indicators
    if (ref.includes('macd')) {
      config.macd = config.macd || {};
    }
    if (ref.includes('bb_')) {
      config.bollingerBands = config.bollingerBands || {};
    }
    if (ref.includes('stoch_')) {
      config.stochastic = config.stochastic || {};
    }
  });
}

// ============================================
// TRADE SIMULATION
// ============================================

/**
 * Simulate trade execution based on signals
 * @param {Object} backtest - Backtest configuration
 * @param {Object} strategy - Strategy configuration
 * @param {Object} bars - OHLCV data
 * @param {Object} indicators - Calculated indicators
 * @param {Array} signals - Trading signals
 * @returns {Array} - Array of executed trades
 */
async function simulateTrades(backtest, strategy, bars, indicators, signals) {
  const trades = [];
  let currentPosition = null;
  let accountBalance = backtest.initial_capital;
  let tradeNumber = 0;

  // Sort signals by index
  signals.sort((a, b) => a.index - b.index);

  for (const signal of signals) {
    const index = signal.index;

    // Check if we're in a position
    if (currentPosition) {
      // Check for exit conditions on each bar from entry to signal
      for (let i = currentPosition.entryIndex + 1; i <= index; i++) {
        const exitResult = checkExitConditions(currentPosition, bars, i, backtest);

        if (exitResult) {
          // Close position
          const closedTrade = closePosition(
            currentPosition,
            exitResult.price,
            exitResult.reason,
            bars.timestamp[i],
            i,
            accountBalance,
            backtest
          );

          trades.push(closedTrade);
          accountBalance = closedTrade.balance_after;
          currentPosition = null;
          tradeNumber++;
          break;
        }
      }
    }

    // Process new signal
    if (!currentPosition && (signal.signal === 'buy' || signal.signal === 'sell')) {
      // Open new position
      const entryPrice = simulateEntry(signal.price, bars.spread[index], backtest);

      // Calculate stop loss and take profit
      const { stopLoss, takeProfit } = calculateStopLossTakeProfit(
        strategy,
        entryPrice,
        signal.signal,
        bars,
        indicators,
        index,
        backtest.symbol
      );

      // Calculate position size
      const lotSize = calculatePositionSize(
        strategy,
        accountBalance,
        entryPrice,
        stopLoss,
        backtest.symbol
      );

      currentPosition = {
        tradeNumber: tradeNumber + 1,
        signal: signal.signal,
        entryPrice: entryPrice,
        entryTime: bars.timestamp[index],
        entryIndex: index,
        entryReason: signal.reason,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        lotSize: lotSize,
        balanceBefore: accountBalance,
        equityBefore: accountBalance,
        maxProfit: 0,
        maxLoss: 0
      };
    } else if (currentPosition && signal.signal === 'close') {
      // Close position due to strategy signal
      const exitPrice = simulateExit(signal.price, bars.spread[index], backtest, currentPosition.signal);

      const closedTrade = closePosition(
        currentPosition,
        exitPrice,
        signal.reason || 'Strategy exit signal',
        bars.timestamp[index],
        index,
        accountBalance,
        backtest
      );

      trades.push(closedTrade);
      accountBalance = closedTrade.balance_after;
      currentPosition = null;
      tradeNumber++;
    }
  }

  // Close any remaining open position at the end
  if (currentPosition) {
    const lastIndex = bars.close.length - 1;
    const exitPrice = simulateExit(bars.close[lastIndex], bars.spread[lastIndex], backtest, currentPosition.signal);

    const closedTrade = closePosition(
      currentPosition,
      exitPrice,
      'End of backtest period',
      bars.timestamp[lastIndex],
      lastIndex,
      accountBalance,
      backtest
    );

    trades.push(closedTrade);
  }

  return trades;
}

/**
 * Check if position should be exited (stop loss, take profit, trailing stop)
 * @param {Object} position - Current open position
 * @param {Object} bars - OHLCV data
 * @param {number} index - Current bar index
 * @param {Object} backtest - Backtest configuration
 * @returns {Object|null} - {price, reason} or null
 */
function checkExitConditions(position, bars, index, backtest) {
  const currentBar = {
    high: bars.high[index],
    low: bars.low[index],
    close: bars.close[index]
  };

  // Track max favorable/adverse excursion
  const currentPL = calculateUnrealizedPL(position, currentBar.close, backtest.symbol);
  position.maxProfit = Math.max(position.maxProfit, currentPL);
  position.maxLoss = Math.min(position.maxLoss, currentPL);

  if (position.signal === 'buy') {
    // Check stop loss
    if (position.stopLoss && currentBar.low <= position.stopLoss) {
      return { price: position.stopLoss, reason: 'Stop loss hit' };
    }

    // Check take profit
    if (position.takeProfit && currentBar.high >= position.takeProfit) {
      return { price: position.takeProfit, reason: 'Take profit hit' };
    }
  } else { // sell position
    // Check stop loss
    if (position.stopLoss && currentBar.high >= position.stopLoss) {
      return { price: position.stopLoss, reason: 'Stop loss hit' };
    }

    // Check take profit
    if (position.takeProfit && currentBar.low <= position.takeProfit) {
      return { price: position.takeProfit, reason: 'Take profit hit' };
    }
  }

  return null;
}

/**
 * Calculate unrealized P&L
 * @param {Object} position - Open position
 * @param {number} currentPrice - Current price
 * @param {string} symbol - Trading symbol
 * @returns {number} - Unrealized P&L in account currency
 */
function calculateUnrealizedPL(position, currentPrice, symbol) {
  const pipSize = getPipSize(symbol);
  const pipValue = 10; // $10 per pip for standard lot (simplified)

  let pips;
  if (position.signal === 'buy') {
    pips = (currentPrice - position.entryPrice) / pipSize;
  } else {
    pips = (position.entryPrice - currentPrice) / pipSize;
  }

  return pips * pipValue * position.lotSize;
}

/**
 * Simulate realistic entry price with slippage
 * @param {number} signalPrice - Price from strategy signal
 * @param {number} spread - Current spread in pips
 * @param {Object} backtest - Backtest configuration
 * @returns {number} - Actual entry price
 */
function simulateEntry(signalPrice, spread, backtest) {
  let price = signalPrice;

  // Add spread
  if (backtest.spread_pips) {
    const pipSize = getPipSize(backtest.symbol);
    price += backtest.spread_pips * pipSize;
  } else if (spread) {
    price += spread;
  }

  // Add slippage
  if (backtest.slippage_pips && backtest.use_realistic_fills) {
    const pipSize = getPipSize(backtest.symbol);
    price += backtest.slippage_pips * pipSize;
  }

  return price;
}

/**
 * Simulate realistic exit price with slippage
 * @param {number} signalPrice - Price from exit signal
 * @param {number} spread - Current spread in pips
 * @param {Object} backtest - Backtest configuration
 * @param {string} positionType - 'buy' or 'sell'
 * @returns {number} - Actual exit price
 */
function simulateExit(signalPrice, spread, backtest, positionType) {
  let price = signalPrice;

  // Apply slippage (negative for exits)
  if (backtest.slippage_pips && backtest.use_realistic_fills) {
    const pipSize = getPipSize(backtest.symbol);
    const slippageCost = backtest.slippage_pips * pipSize;

    if (positionType === 'buy') {
      price -= slippageCost; // Selling at lower price
    } else {
      price += slippageCost; // Buying back at higher price
    }
  }

  return price;
}

/**
 * Close a position and calculate final metrics
 * @param {Object} position - Open position
 * @param {number} exitPrice - Exit price
 * @param {string} exitReason - Reason for exit
 * @param {string} exitTime - Exit timestamp
 * @param {number} exitIndex - Exit bar index
 * @param {number} accountBalance - Current account balance
 * @param {Object} backtest - Backtest configuration
 * @returns {Object} - Closed trade object
 */
function closePosition(position, exitPrice, exitReason, exitTime, exitIndex, accountBalance, backtest) {
  const pipSize = getPipSize(backtest.symbol);
  const pipValue = 10; // $10 per pip for standard lot (simplified)

  // Calculate P&L in pips
  let pips;
  if (position.signal === 'buy') {
    pips = (exitPrice - position.entryPrice) / pipSize;
  } else {
    pips = (position.entryPrice - exitPrice) / pipSize;
  }

  // Calculate P&L in account currency
  const profitLoss = pips * pipValue * position.lotSize;

  // Calculate commission
  const commission = backtest.commission_per_lot * position.lotSize;

  // Calculate slippage cost (already factored into entry/exit prices, but track separately)
  const slippageCost = backtest.slippage_pips
    ? (backtest.slippage_pips * pipValue * position.lotSize * 2) // Entry + Exit
    : 0;

  // Net profit
  const netProfit = profitLoss - commission;

  // Update account balance
  const balanceAfter = accountBalance + netProfit;

  // Calculate trade duration
  const durationBars = exitIndex - position.entryIndex;
  const entryDate = new Date(position.entryTime);
  const exitDate = new Date(exitTime);
  const durationMinutes = Math.floor((exitDate - entryDate) / (1000 * 60));

  // Calculate R:R ratio
  let riskRewardRatio = null;
  if (position.stopLoss) {
    const riskPips = Math.abs(position.entryPrice - position.stopLoss) / pipSize;
    const rewardPips = Math.abs(pips);
    riskRewardRatio = riskPips > 0 ? rewardPips / riskPips : null;
  }

  return {
    trade_number: position.tradeNumber,
    symbol: backtest.symbol,
    entry_time: position.entryTime,
    entry_price: position.entryPrice,
    entry_signal: position.signal,
    entry_reason: position.entryReason,
    exit_time: exitTime,
    exit_price: exitPrice,
    exit_reason: exitReason,
    lot_size: position.lotSize,
    stop_loss_price: position.stopLoss,
    take_profit_price: position.takeProfit,
    risk_reward_ratio: riskRewardRatio,
    profit_loss: profitLoss,
    profit_loss_pips: pips,
    profit_loss_percent: (netProfit / accountBalance) * 100,
    commission: commission,
    slippage: slippageCost,
    net_profit: netProfit,
    duration_bars: durationBars,
    duration_minutes: durationMinutes,
    balance_before: position.balanceBefore,
    balance_after: balanceAfter,
    equity_before: position.equityBefore,
    equity_after: balanceAfter,
    mae: position.maxLoss, // Maximum Adverse Excursion
    mfe: position.maxProfit, // Maximum Favorable Excursion
    is_winning_trade: netProfit > 0 ? 1 : 0
  };
}

// ============================================
// PERFORMANCE METRICS CALCULATION
// ============================================

/**
 * Calculate comprehensive performance metrics
 * @param {Array} trades - Array of closed trades
 * @param {number} initialCapital - Starting balance
 * @param {Object} bars - OHLCV data (for date range calculations)
 * @returns {Object} - Performance metrics
 */
function calculatePerformanceMetrics(trades, initialCapital, bars) {
  if (trades.length === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      net_profit: 0,
      total_return: 0
    };
  }

  // Basic counts
  const winningTrades = trades.filter(t => t.is_winning_trade === 1);
  const losingTrades = trades.filter(t => t.is_winning_trade === 0 && t.net_profit < 0);
  const breakEvenTrades = trades.filter(t => t.net_profit === 0);

  const totalTrades = trades.length;
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;

  // Win/Loss rates
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;

  // Profit metrics
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.net_profit, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.net_profit, 0));
  const netProfit = trades.reduce((sum, t) => sum + t.net_profit, 0);
  const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0);
  const totalSlippage = trades.reduce((sum, t) => sum + t.slippage, 0);

  // Returns
  const finalBalance = initialCapital + netProfit;
  const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;

  // Calculate annualized return
  const firstDate = new Date(bars.timestamp[0]);
  const lastDate = new Date(bars.timestamp[bars.timestamp.length - 1]);
  const daysInBacktest = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  const yearsInBacktest = daysInBacktest / 365;
  const annualReturn = yearsInBacktest > 0
    ? (Math.pow((finalBalance / initialCapital), (1 / yearsInBacktest)) - 1) * 100
    : totalReturn;

  // Profit factor
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);

  // Expectancy
  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;
  const expectancyPercent = totalTrades > 0
    ? (expectancy / initialCapital) * 100
    : 0;

  // Average trade metrics
  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  const avgTrade = totalTrades > 0 ? netProfit / totalTrades : 0;
  const avgTradeDuration = totalTrades > 0
    ? trades.reduce((sum, t) => sum + t.duration_minutes, 0) / totalTrades
    : 0;

  // Best/Worst trades
  const sortedByProfit = [...trades].sort((a, b) => b.net_profit - a.net_profit);
  const largestWin = sortedByProfit[0]?.net_profit || 0;
  const largestLoss = sortedByProfit[sortedByProfit.length - 1]?.net_profit || 0;
  const largestWinPips = sortedByProfit[0]?.profit_loss_pips || 0;
  const largestLossPips = sortedByProfit[sortedByProfit.length - 1]?.profit_loss_pips || 0;

  // Consecutive wins/losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const trade of trades) {
    if (trade.is_winning_trade) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
    } else if (trade.net_profit < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
    }
  }

  // Drawdown analysis
  const equityCurve = [{ balance: initialCapital, equity: initialCapital, date: bars.timestamp[0] }];
  let runningBalance = initialCapital;

  for (const trade of trades) {
    runningBalance = trade.balance_after;
    equityCurve.push({
      balance: runningBalance,
      equity: runningBalance,
      date: trade.exit_time
    });
  }

  const { maxDrawdown, maxDrawdownPercent, avgDrawdown, drawdownPeriods } = calculateDrawdown(equityCurve);

  // Risk-adjusted returns
  const returns = trades.map(t => (t.net_profit / t.balance_before) * 100);
  const sharpeRatio = calculateSharpeRatio(returns);
  const sortinoRatio = calculateSortinoRatio(returns);
  const calmarRatio = maxDrawdownPercent !== 0 ? annualReturn / Math.abs(maxDrawdownPercent) : 0;

  // Recovery factor
  const recoveryFactor = maxDrawdown !== 0 ? netProfit / Math.abs(maxDrawdown) : 0;

  // R-Multiple analysis
  const avgRMultiple = trades
    .filter(t => t.risk_reward_ratio !== null)
    .reduce((sum, t, i, arr) => sum + (t.net_profit > 0 ? t.risk_reward_ratio : -1) / arr.length, 0);

  // Time-based metrics
  const tradingDays = Math.ceil(daysInBacktest);
  const avgTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
  const avgTradesPerWeek = avgTradesPerDay * 7;
  const avgTradesPerMonth = avgTradesPerDay * 30;

  // Monthly returns
  const monthlyReturns = calculateMonthlyReturns(trades, initialCapital);

  // Final account state
  const maxBalance = Math.max(...equityCurve.map(e => e.balance));
  const minBalance = Math.min(...equityCurve.map(e => e.balance));

  return {
    total_trades: totalTrades,
    winning_trades: winCount,
    losing_trades: lossCount,
    break_even_trades: breakEvenTrades.length,
    win_rate: winRate,
    loss_rate: lossRate,
    gross_profit: grossProfit,
    gross_loss: grossLoss,
    net_profit: netProfit,
    total_commission: totalCommission,
    total_slippage: totalSlippage,
    total_return: totalReturn,
    annual_return: annualReturn,
    monthly_return_avg: monthlyReturns.length > 0
      ? monthlyReturns.reduce((sum, m) => sum + m.return, 0) / monthlyReturns.length
      : 0,
    profit_factor: profitFactor,
    expectancy: expectancy,
    expectancy_percent: expectancyPercent,
    avg_trade_profit: avgTrade,
    avg_trade_loss: avgLoss,
    avg_win: avgWin,
    avg_loss: avgLoss,
    avg_trade_duration_minutes: avgTradeDuration,
    largest_win: largestWin,
    largest_loss: largestLoss,
    largest_win_pips: largestWinPips,
    largest_loss_pips: largestLossPips,
    max_consecutive_wins: maxConsecutiveWins,
    max_consecutive_losses: maxConsecutiveLosses,
    max_drawdown: maxDrawdown,
    max_drawdown_percent: maxDrawdownPercent,
    avg_drawdown: avgDrawdown,
    sharpe_ratio: sharpeRatio,
    sortino_ratio: sortinoRatio,
    calmar_ratio: calmarRatio,
    recovery_factor: recoveryFactor,
    avg_r_multiple: avgRMultiple,
    trading_days: tradingDays,
    avg_trades_per_day: avgTradesPerDay,
    avg_trades_per_week: avgTradesPerWeek,
    avg_trades_per_month: avgTradesPerMonth,
    final_balance: finalBalance,
    final_equity: finalBalance,
    max_balance: maxBalance,
    min_balance: minBalance,
    equity_curve: JSON.stringify(equityCurve),
    monthly_returns: JSON.stringify(monthlyReturns),
    drawdown_periods: JSON.stringify(drawdownPeriods)
  };
}

/**
 * Calculate drawdown metrics
 */
function calculateDrawdown(equityCurve) {
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let peak = equityCurve[0].balance;
  let peakDate = equityCurve[0].date;
  let drawdowns = [];
  let currentDrawdownStart = null;

  for (const point of equityCurve) {
    if (point.balance > peak) {
      // New peak
      if (currentDrawdownStart) {
        // End current drawdown
        drawdowns.push(currentDrawdownStart);
        currentDrawdownStart = null;
      }
      peak = point.balance;
      peakDate = point.date;
    } else {
      // In drawdown
      const drawdown = peak - point.balance;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }

      if (!currentDrawdownStart) {
        currentDrawdownStart = {
          start: peakDate,
          end: point.date,
          depth: drawdown,
          depthPercent: drawdownPercent
        };
      } else {
        currentDrawdownStart.end = point.date;
        currentDrawdownStart.depth = Math.max(currentDrawdownStart.depth, drawdown);
        currentDrawdownStart.depthPercent = Math.max(currentDrawdownStart.depthPercent, drawdownPercent);
      }
    }
  }

  const avgDrawdown = drawdowns.length > 0
    ? drawdowns.reduce((sum, d) => sum + d.depth, 0) / drawdowns.length
    : 0;

  return {
    maxDrawdown,
    maxDrawdownPercent,
    avgDrawdown,
    drawdownPeriods: drawdowns
  };
}

/**
 * Calculate Sharpe Ratio
 * (Average Return - Risk Free Rate) / Standard Deviation of Returns
 * Assuming 0% risk-free rate for simplicity
 */
function calculateSharpeRatio(returns) {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev !== 0 ? avgReturn / stdDev : 0;
}

/**
 * Calculate Sortino Ratio
 * (Average Return - Risk Free Rate) / Downside Deviation
 */
function calculateSortinoRatio(returns) {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < 0);

  if (negativeReturns.length === 0) return 999; // No downside

  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
  const downsideDev = Math.sqrt(downsideVariance);

  return downsideDev !== 0 ? avgReturn / downsideDev : 0;
}

/**
 * Calculate monthly returns
 */
function calculateMonthlyReturns(trades, initialCapital) {
  const monthlyData = {};

  let runningBalance = initialCapital;

  for (const trade of trades) {
    const date = new Date(trade.exit_time);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        startBalance: runningBalance,
        endBalance: runningBalance,
        profit: 0,
        trades: 0
      };
    }

    monthlyData[monthKey].endBalance = trade.balance_after;
    monthlyData[monthKey].profit += trade.net_profit;
    monthlyData[monthKey].trades++;
    runningBalance = trade.balance_after;
  }

  return Object.values(monthlyData).map(month => ({
    month: month.month,
    return: ((month.endBalance - month.startBalance) / month.startBalance) * 100,
    trades: month.trades,
    profit: month.profit
  }));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pip size for a symbol
 * @param {string} symbol - Trading symbol
 * @returns {number} - Pip size
 */
function getPipSize(symbol) {
  if (symbol.includes('JPY')) {
    return 0.01;
  }
  return 0.0001;
}

// Export main function
export default {
  runBacktest
};
