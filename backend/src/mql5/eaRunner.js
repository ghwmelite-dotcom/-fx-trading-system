/**
 * EA Runner - Executes transpiled EAs on historical data
 * Manages the backtest lifecycle and generates comprehensive results
 */

import { MT5API } from './mt5api.js';

export class EARunner {
  constructor(eaCode, historicalData, parameters = {}, config = {}) {
    this.eaCode = eaCode;
    this.historicalData = historicalData;
    this.parameters = parameters;
    this.config = {
      initialBalance: config.initialBalance || 10000,
      symbol: config.symbol || 'EURUSD',
      timeframe: config.timeframe || 'H1',
      spread: config.spread || null, // Use default if null
      commission: config.commission || 7, // Per lot
      ...config
    };

    this.mt5 = null;
    this.ea = null;
    this.errors = [];
    this.logs = [];
  }

  async run() {
    try {
      // Initialize MT5 API
      this.mt5 = new MT5API(
        this.historicalData,
        this.config.initialBalance,
        this.config.symbol
      );

      // Dynamically instantiate EA class
      const EAClass = this.loadEAClass(this.eaCode);
      this.ea = new EAClass(this.parameters, this.mt5);

      // Call OnInit() if it exists
      if (typeof this.ea.OnInit === 'function') {
        const initResult = this.ea.OnInit();
        if (initResult !== 0 && initResult !== undefined) {
          throw new Error(`EA initialization failed with code: ${initResult}`);
        }
        this.log('EA initialized successfully');
      }

      // Run through all candles
      const totalBars = this.historicalData.length;
      let processedBars = 0;

      for (let i = 0; i < totalBars; i++) {
        this.mt5.currentBarIndex = i;

        // Check and execute pending orders (SL/TP)
        this.mt5.checkPendingOrders();

        // Call OnTick() if it exists
        if (typeof this.ea.OnTick === 'function') {
          try {
            await this.ea.OnTick();
          } catch (error) {
            this.logError(`OnTick error at bar ${i}: ${error.message}`);
          }
        }

        // Update floating profit/loss
        this.updateOpenPositions();

        processedBars++;

        // Progress reporting every 100 bars
        if (processedBars % 100 === 0) {
          this.log(`Processed ${processedBars}/${totalBars} bars (${((processedBars / totalBars) * 100).toFixed(1)}%)`);
        }
      }

      // Call OnDeinit() if it exists
      if (typeof this.ea.OnDeinit === 'function') {
        this.ea.OnDeinit();
        this.log('EA deinitialized');
      }

      // Close any remaining open positions at market price
      this.closeAllPositions();

      // Generate comprehensive results
      const results = this.generateResults();

      return {
        success: true,
        results,
        logs: this.logs,
        errors: this.errors
      };

    } catch (error) {
      this.logError(`Critical error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs: this.logs,
        errors: this.errors
      };
    }
  }

  loadEAClass(eaCode) {
    try {
      // Create a function from the EA code
      // The EA code should export a default class
      const moduleWrapper = new Function('exports', eaCode + '\nreturn exports.default || EA;');
      const exports = {};
      const EAClass = moduleWrapper(exports);

      if (!EAClass) {
        throw new Error('EA code must export a default class');
      }

      return EAClass;

    } catch (error) {
      throw new Error(`Failed to load EA class: ${error.message}`);
    }
  }

  updateOpenPositions() {
    for (const order of this.mt5.openOrders) {
      const currentPrice = order.type === 0 ? this.mt5.Bid() : this.mt5.Ask();
      order.profit = this.mt5.calculateProfit(order, currentPrice);
    }

    const openProfit = this.mt5.openOrders.reduce((sum, o) => sum + o.profit, 0);
    this.mt5.equity = this.mt5.balance + openProfit;
  }

  closeAllPositions() {
    const openCount = this.mt5.openOrders.length;

    if (openCount > 0) {
      this.log(`Closing ${openCount} remaining open position(s)`);
    }

    while (this.mt5.openOrders.length > 0) {
      const order = this.mt5.openOrders[0];
      const closePrice = order.type === 0 ? this.mt5.Bid() : this.mt5.Ask();
      this.mt5.OrderClose(order.ticket, order.volume, closePrice, 0, 0);
    }
  }

  generateResults() {
    const trades = this.mt5.trades;
    const totalTrades = trades.length;

    if (totalTrades === 0) {
      return this.generateEmptyResults();
    }

    // Separate winning and losing trades
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    const totalCommission = trades.reduce((sum, t) => sum + Math.abs(t.commission), 0);

    const netProfit = grossProfit - grossLoss;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    const winRate = (winningTrades.length / totalTrades) * 100;

    // Average trade metrics
    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const avgTrade = netProfit / totalTrades;

    // Largest win/loss
    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.profit))
      : 0;
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.profit))
      : 0;

    // Calculate consecutive wins/losses
    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutive(trades);

    // Calculate drawdown
    const { maxDrawdown, maxDrawdownPercent, drawdownDuration } = this.calculateDrawdown(trades);

    // Calculate return metrics
    const totalReturn = ((this.mt5.balance - this.config.initialBalance) / this.config.initialBalance) * 100;

    // Calculate Sharpe and Sortino ratios
    const { sharpeRatio, sortinoRatio } = this.calculateRiskMetrics(trades);

    // Calculate expectancy
    const winProbability = winRate / 100;
    const lossProbability = 1 - winProbability;
    const expectancy = (winProbability * avgWin) - (lossProbability * avgLoss);

    // Trading period
    const firstTradeTime = trades[0].openTime;
    const lastTradeTime = trades[trades.length - 1].closeTime || trades[trades.length - 1].openTime;
    const tradingDays = this.calculateTradingDays(firstTradeTime, lastTradeTime);

    // Long vs Short statistics
    const longTrades = trades.filter(t => t.type === 0);
    const shortTrades = trades.filter(t => t.type === 1);

    const longStats = this.calculateTradeTypeStats(longTrades, 'Long');
    const shortStats = this.calculateTradeTypeStats(shortTrades, 'Short');

    return {
      // Overall performance
      initialBalance: this.config.initialBalance,
      finalBalance: this.mt5.balance,
      netProfit: parseFloat(netProfit.toFixed(2)),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),

      // Trade statistics
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(2)),

      // Profit/Loss
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossLoss: parseFloat(grossLoss.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),

      // Average metrics
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      avgTrade: parseFloat(avgTrade.toFixed(2)),

      // Largest trades
      largestWin: parseFloat(largestWin.toFixed(2)),
      largestLoss: parseFloat(largestLoss.toFixed(2)),

      // Consecutive
      maxConsecutiveWins,
      maxConsecutiveLosses,

      // Drawdown
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
      drawdownDuration,

      // Risk metrics
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
      expectancy: parseFloat(expectancy.toFixed(2)),

      // Trading period
      firstTrade: firstTradeTime,
      lastTrade: lastTradeTime,
      tradingDays,
      tradesPerDay: parseFloat((totalTrades / tradingDays).toFixed(2)),

      // Long/Short breakdown
      longStats,
      shortStats,

      // Equity curve
      equityCurve: this.mt5.equityCurve,

      // Trade list (limited to prevent huge responses)
      trades: trades.slice(0, 1000).map(t => ({
        ticket: t.ticket,
        type: t.type === 0 ? 'BUY' : 'SELL',
        symbol: t.symbol,
        volume: t.volume,
        openTime: t.openTime,
        openPrice: parseFloat(t.openPrice.toFixed(5)),
        closeTime: t.closeTime,
        closePrice: parseFloat((t.closePrice || 0).toFixed(5)),
        profit: parseFloat(t.profit.toFixed(2)),
        commission: parseFloat(t.commission.toFixed(2)),
        stoploss: t.stoploss,
        takeprofit: t.takeprofit,
        comment: t.comment
      })),
      totalTradesInList: trades.length,
      tradesShown: Math.min(trades.length, 1000)
    };
  }

  generateEmptyResults() {
    return {
      initialBalance: this.config.initialBalance,
      finalBalance: this.mt5.balance,
      netProfit: 0,
      totalReturn: 0,
      profitFactor: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      totalCommission: 0,
      avgWin: 0,
      avgLoss: 0,
      avgTrade: 0,
      largestWin: 0,
      largestLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      drawdownDuration: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      expectancy: 0,
      firstTrade: null,
      lastTrade: null,
      tradingDays: 0,
      tradesPerDay: 0,
      longStats: { trades: 0, wins: 0, losses: 0, winRate: 0, profit: 0 },
      shortStats: { trades: 0, wins: 0, losses: 0, winRate: 0, profit: 0 },
      equityCurve: [],
      trades: [],
      totalTradesInList: 0,
      tradesShown: 0
    };
  }

  calculateConsecutive(trades) {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    for (const trade of trades) {
      if (trade.profit > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      }
    }

    return { maxConsecutiveWins, maxConsecutiveLosses };
  }

  calculateDrawdown(trades) {
    let peak = this.config.initialBalance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let drawdownStart = null;
    let maxDrawdownDuration = 0;
    let balance = this.config.initialBalance;

    for (const trade of trades) {
      balance += trade.profit + trade.commission;

      if (balance > peak) {
        peak = balance;
        drawdownStart = null;
      } else {
        const drawdown = peak - balance;
        const drawdownPercent = (drawdown / peak) * 100;

        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownPercent = drawdownPercent;

          if (!drawdownStart) {
            drawdownStart = new Date(trade.openTime);
          }

          const drawdownEnd = new Date(trade.closeTime || trade.openTime);
          const duration = Math.floor((drawdownEnd - drawdownStart) / (1000 * 60 * 60 * 24));
          maxDrawdownDuration = Math.max(maxDrawdownDuration, duration);
        }
      }
    }

    return {
      maxDrawdown,
      maxDrawdownPercent,
      drawdownDuration: maxDrawdownDuration
    };
  }

  calculateRiskMetrics(trades) {
    if (trades.length < 2) {
      return { sharpeRatio: 0, sortinoRatio: 0 };
    }

    const returns = trades.map(t => (t.profit + t.commission) / this.config.initialBalance);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Sharpe Ratio (assuming 0% risk-free rate)
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Sortino Ratio (downside deviation only)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation > 0 ? avgReturn / downsideDeviation : 0;

    return { sharpeRatio, sortinoRatio };
  }

  calculateTradingDays(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  }

  calculateTradeTypeStats(trades, type) {
    if (trades.length === 0) {
      return {
        type,
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        profit: 0
      };
    }

    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

    return {
      type,
      trades: trades.length,
      wins,
      losses,
      winRate: parseFloat(((wins / trades.length) * 100).toFixed(2)),
      profit: parseFloat(totalProfit.toFixed(2))
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
  }

  logError(message) {
    const timestamp = new Date().toISOString();
    this.errors.push(`[${timestamp}] ERROR: ${message}`);
    this.logs.push(`[${timestamp}] ERROR: ${message}`);
  }
}
