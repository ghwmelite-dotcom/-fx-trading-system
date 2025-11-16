/**
 * MT5 API Emulation Library
 * Emulates MetaTrader 5 trading and indicator functions for backtesting
 */

// MT5 Constants
export const OP_BUY = 0;
export const OP_SELL = 1;
export const MODE_TRADES = 0;
export const MODE_HISTORY = 1;
export const MODE_MAIN = 0;
export const MODE_SIGNAL = 1;
export const MODE_UPPER = 1;
export const MODE_LOWER = 2;

export class MT5API {
  constructor(historicalData, initialBalance = 10000, symbol = 'EURUSD') {
    this.data = historicalData; // Array of OHLCV candles
    this.currentBarIndex = 0;
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.equity = initialBalance;
    this.symbol = symbol;
    this.trades = [];
    this.openOrders = [];
    this.ticketCounter = 1;
    this.selectedOrder = null;

    // Calculate pip value and point
    this.point = symbol.includes('JPY') ? 0.01 : 0.0001;
    this.digits = symbol.includes('JPY') ? 2 : 4;

    // Performance tracking
    this.equityCurve = [];
    this.peak = initialBalance;
    this.maxDrawdown = 0;
  }

  // ==================== MARKET DATA FUNCTIONS ====================

  Symbol() {
    return this.symbol;
  }

  Period() {
    return 60; // H1 by default, can be configured
  }

  Bars() {
    return this.data.length;
  }

  Bid() {
    if (this.currentBarIndex >= this.data.length) {
      return this.data[this.data.length - 1]?.close || 0;
    }
    return this.data[this.currentBarIndex]?.close || 0;
  }

  Ask() {
    const spread = this.getSpread();
    return this.Bid() + spread;
  }

  Point() {
    return this.point;
  }

  Digits() {
    return this.digits;
  }

  getSpread() {
    // Realistic spreads by pair
    const spreads = {
      'EURUSD': 0.0001,  // 1 pip
      'GBPUSD': 0.0002,  // 2 pips
      'USDJPY': 0.01,    // 1 pip
      'AUDUSD': 0.0002,  // 2 pips
      'USDCAD': 0.0002,  // 2 pips
      'NZDUSD': 0.0003,  // 3 pips
      'EURGBP': 0.0002,  // 2 pips
      'EURJPY': 0.02,    // 2 pips
      'GBPJPY': 0.03,    // 3 pips
      'XAUUSD': 0.3,     // 30 cents for gold
      'US30': 2,         // 2 points for Dow Jones
      'US100': 1,        // 1 point for NASDAQ
      'US500': 0.5       // 0.5 points for S&P500
    };

    return spreads[this.symbol] || 0.0002; // Default 2 pips
  }

  // ==================== PRICE ACCESS FUNCTIONS ====================

  iClose(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    return this.data[index]?.close || 0;
  }

  iOpen(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    return this.data[index]?.open || 0;
  }

  iHigh(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    return this.data[index]?.high || 0;
  }

  iLow(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    return this.data[index]?.low || 0;
  }

  iVolume(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    return this.data[index]?.volume || 0;
  }

  iTime(symbol, timeframe, shift) {
    const index = this.currentBarIndex - shift;
    if (index < 0 || index >= this.data.length) return 0;
    const timestamp = this.data[index]?.timestamp;
    return timestamp ? Math.floor(new Date(timestamp).getTime() / 1000) : 0;
  }

  // ==================== INDICATOR FUNCTIONS ====================

  // Moving Average
  iMA(symbol, timeframe, period, maShift, maMethod, appliedPrice, shift) {
    const startIndex = this.currentBarIndex - shift - period + 1;
    if (startIndex < 0) return 0;

    let sum = 0;
    for (let i = 0; i < period; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return 0;

      const price = this.getAppliedPrice(this.data[index], appliedPrice);
      sum += price;
    }

    return sum / period;
  }

  // Relative Strength Index
  iRSI(symbol, timeframe, period, appliedPrice, shift) {
    const startIndex = this.currentBarIndex - shift - period;
    if (startIndex < 0) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return 50;

      const currentPrice = this.getAppliedPrice(this.data[index], appliedPrice);
      const prevPrice = this.getAppliedPrice(this.data[index - 1], appliedPrice);
      const change = currentPrice - prevPrice;

      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // MACD
  iMACD(symbol, timeframe, fastEMA, slowEMA, signalEMA, appliedPrice, mode, shift) {
    const fast = this.calculateEMA(fastEMA, appliedPrice, shift);
    const slow = this.calculateEMA(slowEMA, appliedPrice, shift);
    const macdLine = fast - slow;

    if (mode === 0) return macdLine; // Main line
    if (mode === 1) return macdLine * 0.9; // Signal line (simplified)
    return macdLine * 0.1; // Histogram

    }

  // Bollinger Bands
  iBands(symbol, timeframe, period, deviation, bandsShift, appliedPrice, mode, shift) {
    const sma = this.iMA(symbol, timeframe, period, 0, 0, appliedPrice, shift);
    const startIndex = this.currentBarIndex - shift - period + 1;

    if (startIndex < 0) return sma;

    // Calculate standard deviation
    let sumSquares = 0;
    for (let i = 0; i < period; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return sma;

      const price = this.getAppliedPrice(this.data[index], appliedPrice);
      const diff = price - sma;
      sumSquares += diff * diff;
    }

    const stdDev = Math.sqrt(sumSquares / period);

    if (mode === 1) return sma + (deviation * stdDev); // Upper band
    if (mode === 2) return sma - (deviation * stdDev); // Lower band
    return sma; // Middle band
  }

  // Average True Range
  iATR(symbol, timeframe, period, shift) {
    const startIndex = this.currentBarIndex - shift - period;
    if (startIndex < 0) return 0;

    let sumTR = 0;

    for (let i = 1; i <= period; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return 0;

      const high = this.data[index].high;
      const low = this.data[index].low;
      const prevClose = this.data[index - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      sumTR += tr;
    }

    return sumTR / period;
  }

  // Stochastic Oscillator
  iStochastic(symbol, timeframe, kPeriod, dPeriod, slowing, method, priceField, mode, shift) {
    const startIndex = this.currentBarIndex - shift - kPeriod + 1;
    if (startIndex < 0) return 50;

    let lowestLow = Infinity;
    let highestHigh = -Infinity;

    for (let i = 0; i < kPeriod; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return 50;

      lowestLow = Math.min(lowestLow, this.data[index].low);
      highestHigh = Math.max(highestHigh, this.data[index].high);
    }

    const currentClose = this.data[this.currentBarIndex - shift].close;

    if (highestHigh === lowestLow) return 50;

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    if (mode === 0) return k; // %K
    return k * 0.9; // %D (simplified)
  }

  // CCI - Commodity Channel Index
  iCCI(symbol, timeframe, period, appliedPrice, shift) {
    const startIndex = this.currentBarIndex - shift - period + 1;
    if (startIndex < 0) return 0;

    const typicalPrices = [];
    let sum = 0;

    for (let i = 0; i < period; i++) {
      const index = startIndex + i;
      if (index >= this.data.length) return 0;

      const tp = (this.data[index].high + this.data[index].low + this.data[index].close) / 3;
      typicalPrices.push(tp);
      sum += tp;
    }

    const sma = sum / period;

    let meanDeviation = 0;
    for (const tp of typicalPrices) {
      meanDeviation += Math.abs(tp - sma);
    }
    meanDeviation /= period;

    if (meanDeviation === 0) return 0;

    const currentTP = typicalPrices[typicalPrices.length - 1];
    return (currentTP - sma) / (0.015 * meanDeviation);
  }

  // Momentum
  iMomentum(symbol, timeframe, period, appliedPrice, shift) {
    const currentIndex = this.currentBarIndex - shift;
    const pastIndex = currentIndex - period;

    if (pastIndex < 0 || currentIndex >= this.data.length) return 0;

    const currentPrice = this.getAppliedPrice(this.data[currentIndex], appliedPrice);
    const pastPrice = this.getAppliedPrice(this.data[pastIndex], appliedPrice);

    return (currentPrice / pastPrice) * 100;
  }

  // Helper: Calculate EMA
  calculateEMA(period, appliedPrice, shift) {
    const startIndex = Math.max(0, this.currentBarIndex - shift - period * 2);
    const endIndex = this.currentBarIndex - shift;

    if (startIndex >= this.data.length) return 0;

    const multiplier = 2 / (period + 1);
    let ema = this.getAppliedPrice(this.data[startIndex], appliedPrice);

    for (let i = startIndex + 1; i <= endIndex && i < this.data.length; i++) {
      const price = this.getAppliedPrice(this.data[i], appliedPrice);
      ema = (price - ema) * multiplier + ema;
    }

    return ema;
  }

  // Helper: Get price based on applied price constant
  getAppliedPrice(candle, appliedPrice) {
    if (!candle) return 0;

    switch (appliedPrice) {
      case 0: return candle.close;
      case 1: return candle.open;
      case 2: return candle.high;
      case 3: return candle.low;
      case 4: return (candle.high + candle.low) / 2; // Median
      case 5: return (candle.high + candle.low + candle.close) / 3; // Typical
      case 6: return (candle.high + candle.low + 2 * candle.close) / 4; // Weighted
      default: return candle.close;
    }
  }

  // ==================== TRADING FUNCTIONS ====================

  OrderSend(symbol, cmd, volume, price, slippage, stoploss, takeprofit, comment = '', magic = 0, expiration = 0, arrowColor = 0) {
    const ticket = this.ticketCounter++;

    // Calculate commission
    const commission = -volume * 7; // $7 per lot round trip

    const order = {
      ticket,
      symbol,
      type: cmd, // OP_BUY = 0, OP_SELL = 1
      volume,
      openPrice: price,
      openTime: this.data[this.currentBarIndex]?.timestamp || new Date().toISOString(),
      stoploss,
      takeprofit,
      comment,
      magic,
      profit: 0,
      commission,
      swap: 0,
      closePrice: null,
      closeTime: null
    };

    this.openOrders.push(order);
    this.balance += commission; // Deduct commission immediately

    return ticket;
  }

  OrderClose(ticket, lots, price, slippage = 0, arrowColor = 0) {
    const orderIndex = this.openOrders.findIndex(o => o.ticket === ticket);
    if (orderIndex === -1) return false;

    const order = this.openOrders[orderIndex];

    // Calculate profit
    const profit = this.calculateProfit(order, price);

    order.closePrice = price;
    order.closeTime = this.data[this.currentBarIndex]?.timestamp || new Date().toISOString();
    order.profit = profit;

    this.balance += profit;
    this.equity = this.balance;

    // Move to history
    this.trades.push(order);
    this.openOrders.splice(orderIndex, 1);

    // Update equity curve
    this.updateEquityCurve();

    return true;
  }

  OrderModify(ticket, price, stoploss, takeprofit, expiration, arrowColor = 0) {
    const order = this.openOrders.find(o => o.ticket === ticket);
    if (!order) return false;

    order.stoploss = stoploss;
    order.takeprofit = takeprofit;

    return true;
  }

  OrderDelete(ticket, arrowColor = 0) {
    const orderIndex = this.openOrders.findIndex(o => o.ticket === ticket);
    if (orderIndex === -1) return false;

    this.openOrders.splice(orderIndex, 1);
    return true;
  }

  OrdersTotal() {
    return this.openOrders.length;
  }

  OrderSelect(index, selectBy = 0, pool = MODE_TRADES) {
    if (pool === MODE_TRADES) {
      if (index < 0 || index >= this.openOrders.length) return false;
      this.selectedOrder = this.openOrders[index];
    } else {
      if (index < 0 || index >= this.trades.length) return false;
      this.selectedOrder = this.trades[index];
    }

    return true;
  }

  OrderTicket() {
    return this.selectedOrder?.ticket || 0;
  }

  OrderType() {
    return this.selectedOrder?.type || 0;
  }

  OrderLots() {
    return this.selectedOrder?.volume || 0;
  }

  OrderOpenPrice() {
    return this.selectedOrder?.openPrice || 0;
  }

  OrderClosePrice() {
    return this.selectedOrder?.closePrice || 0;
  }

  OrderStopLoss() {
    return this.selectedOrder?.stoploss || 0;
  }

  OrderTakeProfit() {
    return this.selectedOrder?.takeprofit || 0;
  }

  OrderProfit() {
    if (!this.selectedOrder) return 0;

    if (this.selectedOrder.closePrice) {
      return this.selectedOrder.profit;
    }

    // Calculate floating profit for open orders
    const currentPrice = this.selectedOrder.type === 0 ? this.Bid() : this.Ask();
    return this.calculateProfit(this.selectedOrder, currentPrice);
  }

  OrderSymbol() {
    return this.selectedOrder?.symbol || '';
  }

  OrderMagicNumber() {
    return this.selectedOrder?.magic || 0;
  }

  OrderComment() {
    return this.selectedOrder?.comment || '';
  }

  // ==================== ACCOUNT FUNCTIONS ====================

  AccountBalance() {
    return this.balance;
  }

  AccountEquity() {
    // Calculate equity including floating profit/loss
    let floatingPL = 0;

    for (const order of this.openOrders) {
      const currentPrice = order.type === 0 ? this.Bid() : this.Ask();
      floatingPL += this.calculateProfit(order, currentPrice);
    }

    return this.balance + floatingPL;
  }

  AccountProfit() {
    return this.AccountEquity() - this.initialBalance;
  }

  AccountFreeMargin() {
    // Simplified - return equity minus used margin
    const usedMargin = this.openOrders.reduce((sum, order) => {
      return sum + (order.volume * 100000 / 100); // Assuming 1:100 leverage
    }, 0);

    return this.AccountEquity() - usedMargin;
  }

  // ==================== UTILITY FUNCTIONS ====================

  StringFormat(format, ...args) {
    let result = format;
    for (let i = 0; i < args.length; i++) {
      result = result.replace(new RegExp(`%${i + 1}`, 'g'), args[i]);
    }
    return result;
  }

  // ==================== INTERNAL HELPER FUNCTIONS ====================

  calculateProfit(order, closePrice) {
    const priceDiff = order.type === 0
      ? (closePrice - order.openPrice)  // Buy
      : (order.openPrice - closePrice); // Sell

    // Calculate pip value
    const contractSize = 100000; // Standard lot
    let profit = priceDiff * order.volume * contractSize;

    // For JPY pairs, adjust calculation
    if (this.symbol.includes('JPY')) {
      profit = priceDiff * order.volume * contractSize;
    }

    return profit;
  }

  updateEquityCurve() {
    const equity = this.AccountEquity();

    this.equityCurve.push({
      timestamp: this.data[this.currentBarIndex]?.timestamp,
      balance: this.balance,
      equity: equity
    });

    // Update drawdown
    if (equity > this.peak) {
      this.peak = equity;
    }

    const drawdown = ((this.peak - equity) / this.peak) * 100;
    if (drawdown > this.maxDrawdown) {
      this.maxDrawdown = drawdown;
    }
  }

  // Check and execute stop loss / take profit
  checkPendingOrders() {
    for (let i = this.openOrders.length - 1; i >= 0; i--) {
      const order = this.openOrders[i];
      const currentPrice = order.type === 0 ? this.Bid() : this.Ask();

      // Check stop loss
      if (order.stoploss > 0) {
        if ((order.type === 0 && currentPrice <= order.stoploss) ||
            (order.type === 1 && currentPrice >= order.stoploss)) {
          this.OrderClose(order.ticket, order.volume, currentPrice);
          continue;
        }
      }

      // Check take profit
      if (order.takeprofit > 0) {
        if ((order.type === 0 && currentPrice >= order.takeprofit) ||
            (order.type === 1 && currentPrice <= order.takeprofit)) {
          this.OrderClose(order.ticket, order.volume, currentPrice);
        }
      }
    }
  }

  // Get backtest results
  getResults() {
    return {
      initialBalance: this.initialBalance,
      finalBalance: this.balance,
      finalEquity: this.AccountEquity(),
      totalTrades: this.trades.length,
      openOrders: this.openOrders.length,
      maxDrawdown: this.maxDrawdown,
      equityCurve: this.equityCurve,
      trades: this.trades
    };
  }
}
