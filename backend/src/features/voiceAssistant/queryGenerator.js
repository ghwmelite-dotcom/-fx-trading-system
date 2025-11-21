/**
 * Query Generator
 * Converts parsed intents into SQL queries or API actions
 */

/**
 * Generate SQL query or action from intent
 */
export async function generateQuery(userId, intent, entities, env) {
  switch (intent) {
    case 'query_profit':
      return await generateProfitQuery(userId, entities, env);

    case 'query_trades':
      return await generateTradesQuery(userId, entities, env);

    case 'query_win_rate':
      return await generateWinRateQuery(userId, entities, env);

    case 'query_performance':
      return await generatePerformanceQuery(userId, entities, env);

    case 'query_by_pair':
      return await generatePairQuery(userId, entities, env);

    case 'query_by_date':
      return await generateDateQuery(userId, entities, env);

    case 'show_analytics':
      return { type: 'navigation', target: 'analytics' };

    case 'calculate_profit_factor':
      return await calculateProfitFactor(userId, entities, env);

    case 'calculate_sharpe':
      return await calculateSharpe(userId, entities, env);

    case 'calculate_drawdown':
      return await calculateDrawdown(userId, entities, env);

    case 'calculate_roi':
      return await calculateROI(userId, entities, env);

    case 'navigate':
      return { type: 'navigation', target: entities.page || 'dashboard' };

    case 'get_alerts':
      return await getAlerts(userId, env);

    case 'get_advice':
      return await getAdvice(userId, env);

    default:
      throw new Error('Unknown intent');
  }
}

/**
 * Generate profit query
 */
async function generateProfitQuery(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  const query = `
    SELECT
      SUM(profit) as total_profit,
      COUNT(*) as total_trades,
      SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as total_wins_profit,
      SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END) as total_loss_profit
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
  `;

  const result = await env.DB.prepare(query).bind(userId).first();

  return {
    type: 'query_result',
    data: {
      totalProfit: result.total_profit || 0,
      totalTrades: result.total_trades || 0,
      totalWinsProfit: result.total_wins_profit || 0,
      totalLossProfit: result.total_loss_profit || 0
    },
    dateRange: entities.dateRange
  };
}

/**
 * Generate trades query
 */
async function generateTradesQuery(userId, entities, env) {
  let filters = ['user_id = ?'];
  let bindings = [userId];

  if (entities.dateRange) {
    filters.push(`datetime(close_time) >= datetime(?)`);
    filters.push(`datetime(close_time) <= datetime(?)`);
    bindings.push(entities.dateRange.start);
    bindings.push(entities.dateRange.end);
  }

  if (entities.pair) {
    filters.push(`symbol = ?`);
    bindings.push(entities.pair);
  }

  if (entities.tradeType) {
    filters.push(`type = ?`);
    bindings.push(entities.tradeType);
  }

  const query = `
    SELECT *
    FROM trades
    WHERE ${filters.join(' AND ')}
    ORDER BY close_time DESC
    LIMIT 100
  `;

  const result = await env.DB.prepare(query).bind(...bindings).all();

  return {
    type: 'query_result',
    data: {
      trades: result.results,
      count: result.results.length
    },
    filters: entities
  };
}

/**
 * Generate win rate query
 */
async function generateWinRateQuery(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);
  let pairFilter = entities.pair ? `AND symbol = '${entities.pair}'` : '';

  const query = `
    SELECT
      COUNT(*) as total_trades,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as winning_trades,
      SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END) as losing_trades
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    ${pairFilter}
  `;

  const result = await env.DB.prepare(query).bind(userId).first();

  const winRate = result.total_trades > 0
    ? (result.winning_trades / result.total_trades) * 100
    : 0;

  return {
    type: 'query_result',
    data: {
      winRate: winRate.toFixed(2),
      totalTrades: result.total_trades || 0,
      winningTrades: result.winning_trades || 0,
      losingTrades: result.losing_trades || 0
    },
    dateRange: entities.dateRange,
    pair: entities.pair
  };
}

/**
 * Generate performance query (best/worst trades)
 */
async function generatePerformanceQuery(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);
  let sortOrder = 'DESC'; // Default to best

  // Check if looking for worst
  if (entities.metric === 'worst' || entities.metric === 'bottom') {
    sortOrder = 'ASC';
  }

  const query = `
    SELECT *
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    ORDER BY profit ${sortOrder}
    LIMIT 10
  `;

  const result = await env.DB.prepare(query).bind(userId).all();

  return {
    type: 'query_result',
    data: {
      trades: result.results,
      count: result.results.length,
      type: sortOrder === 'DESC' ? 'best' : 'worst'
    },
    dateRange: entities.dateRange
  };
}

/**
 * Generate pair-specific query
 */
async function generatePairQuery(userId, entities, env) {
  const pair = entities.pair;

  if (!pair) {
    // Get all pairs performance
    const query = `
      SELECT
        symbol,
        COUNT(*) as trades_count,
        SUM(profit) as total_profit,
        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
      FROM trades
      WHERE user_id = ?
      GROUP BY symbol
      ORDER BY total_profit DESC
    `;

    const result = await env.DB.prepare(query).bind(userId).all();

    return {
      type: 'query_result',
      data: {
        pairs: result.results.map(p => ({
          symbol: p.symbol,
          tradesCount: p.trades_count,
          totalProfit: p.total_profit,
          winRate: ((p.wins / p.trades_count) * 100).toFixed(2)
        }))
      }
    };
  }

  // Get specific pair stats
  const query = `
    SELECT
      COUNT(*) as total_trades,
      SUM(profit) as total_profit,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as winning_trades,
      AVG(profit) as avg_profit
    FROM trades
    WHERE user_id = ? AND symbol = ?
  `;

  const result = await env.DB.prepare(query).bind(userId, pair).first();

  return {
    type: 'query_result',
    data: {
      pair: pair,
      totalTrades: result.total_trades || 0,
      totalProfit: result.total_profit || 0,
      winRate: result.total_trades > 0
        ? ((result.winning_trades / result.total_trades) * 100).toFixed(2)
        : '0.00',
      avgProfit: result.avg_profit || 0
    }
  };
}

/**
 * Generate date-based query
 */
async function generateDateQuery(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  const query = `
    SELECT
      DATE(close_time) as trade_date,
      COUNT(*) as trades_count,
      SUM(profit) as daily_profit,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    GROUP BY DATE(close_time)
    ORDER BY trade_date DESC
  `;

  const result = await env.DB.prepare(query).bind(userId).all();

  return {
    type: 'query_result',
    data: {
      dailyStats: result.results.map(d => ({
        date: d.trade_date,
        tradesCount: d.trades_count,
        profit: d.daily_profit,
        winRate: ((d.wins / d.trades_count) * 100).toFixed(2)
      }))
    },
    dateRange: entities.dateRange
  };
}

/**
 * Calculate profit factor
 */
async function calculateProfitFactor(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  const query = `
    SELECT
      SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as gross_profit,
      ABS(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END)) as gross_loss
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
  `;

  const result = await env.DB.prepare(query).bind(userId).first();

  const profitFactor = result.gross_loss > 0
    ? (result.gross_profit / result.gross_loss)
    : 0;

  return {
    type: 'calculation_result',
    metric: 'profit_factor',
    data: {
      profitFactor: profitFactor.toFixed(2),
      grossProfit: result.gross_profit || 0,
      grossLoss: result.gross_loss || 0
    },
    dateRange: entities.dateRange
  };
}

/**
 * Calculate Sharpe ratio
 */
async function calculateSharpe(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  const query = `
    SELECT profit
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    ORDER BY close_time
  `;

  const result = await env.DB.prepare(query).bind(userId).all();
  const returns = result.results.map(t => t.profit);

  if (returns.length === 0) {
    return {
      type: 'calculation_result',
      metric: 'sharpe_ratio',
      data: { sharpeRatio: 0 },
      error: 'No trades found'
    };
  }

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

  return {
    type: 'calculation_result',
    metric: 'sharpe_ratio',
    data: {
      sharpeRatio: sharpeRatio.toFixed(2),
      avgReturn: avgReturn.toFixed(2),
      stdDev: stdDev.toFixed(2)
    },
    dateRange: entities.dateRange
  };
}

/**
 * Calculate maximum drawdown
 */
async function calculateDrawdown(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  const query = `
    SELECT profit, close_time
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    ORDER BY close_time
  `;

  const result = await env.DB.prepare(query).bind(userId).all();

  let runningBalance = 0;
  let peak = 0;
  let maxDrawdown = 0;

  result.results.forEach(trade => {
    runningBalance += trade.profit;
    peak = Math.max(peak, runningBalance);
    const drawdown = peak - runningBalance;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  return {
    type: 'calculation_result',
    metric: 'drawdown',
    data: {
      maxDrawdown: maxDrawdown.toFixed(2),
      maxDrawdownPercent: maxDrawdownPercent.toFixed(2),
      peak: peak.toFixed(2)
    },
    dateRange: entities.dateRange
  };
}

/**
 * Calculate ROI
 */
async function calculateROI(userId, entities, env) {
  let dateFilter = buildDateFilter(entities.dateRange);

  // Get initial balance (first trade balance - profit)
  const firstTrade = await env.DB.prepare(`
    SELECT balance, profit
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
    ORDER BY close_time ASC
    LIMIT 1
  `).bind(userId).first();

  // Get total profit
  const profitResult = await env.DB.prepare(`
    SELECT SUM(profit) as total_profit
    FROM trades
    WHERE user_id = ?
    ${dateFilter}
  `).bind(userId).first();

  const initialBalance = firstTrade ? (firstTrade.balance - firstTrade.profit) : 0;
  const totalProfit = profitResult.total_profit || 0;
  const roi = initialBalance > 0 ? (totalProfit / initialBalance) * 100 : 0;

  return {
    type: 'calculation_result',
    metric: 'roi',
    data: {
      roi: roi.toFixed(2),
      initialBalance: initialBalance.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      finalBalance: (initialBalance + totalProfit).toFixed(2)
    },
    dateRange: entities.dateRange
  };
}

/**
 * Get alerts
 */
async function getAlerts(userId, env) {
  const alerts = await env.DB.prepare(`
    SELECT * FROM psychology_alerts
    WHERE user_id = ?
    AND status IN ('pending', 'viewed')
    AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(userId).all();

  return {
    type: 'alerts',
    data: {
      alerts: alerts.results,
      count: alerts.results.length
    }
  };
}

/**
 * Get AI advice
 */
async function getAdvice(userId, env) {
  const insights = await env.DB.prepare(`
    SELECT * FROM psychology_insights
    WHERE user_id = ?
    AND datetime(expires_at) > datetime('now')
    AND is_read = 0
    ORDER BY confidence DESC
    LIMIT 3
  `).bind(userId).all();

  return {
    type: 'advice',
    data: {
      insights: insights.results,
      count: insights.results.length
    }
  };
}

/**
 * Build date filter SQL
 */
function buildDateFilter(dateRange) {
  if (!dateRange) return '';

  return `
    AND datetime(close_time) >= datetime('${dateRange.start}')
    AND datetime(close_time) <= datetime('${dateRange.end}')
  `;
}
