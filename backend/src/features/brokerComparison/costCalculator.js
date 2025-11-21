/**
 * Broker Cost Calculator
 * Calculates trading costs for different brokers based on user's trading profile
 */

/**
 * Calculate total trading costs for a specific broker
 */
export async function calculateBrokerCosts(userId, brokerId, dateRange, env) {
  // Get user's trades for the period
  const trades = await getUserTrades(userId, dateRange, env);

  if (trades.length === 0) {
    return {
      error: 'No trades found for the specified period'
    };
  }

  // Get broker data
  const broker = await env.DB.prepare(`
    SELECT * FROM brokers WHERE id = ?
  `).bind(brokerId).first();

  if (!broker) {
    return {
      error: 'Broker not found'
    };
  }

  // Calculate costs
  const costs = calculateCostsForTrades(trades, broker);

  // Store analysis
  await storeCostAnalysis(userId, brokerId, dateRange, trades, costs, env);

  return {
    broker: {
      id: broker.id,
      name: broker.name
    },
    period: dateRange,
    costs,
    tradesAnalyzed: trades.length
  };
}

/**
 * Calculate costs for user's current broker
 */
export async function calculateCurrentBrokerCosts(userId, dateRange, env) {
  // Get user's primary broker
  const userBroker = await env.DB.prepare(`
    SELECT ub.*, b.name as broker_name, b.eurusd_spread_avg, b.commission_per_lot
    FROM user_brokers ub
    JOIN brokers b ON ub.broker_id = b.id
    WHERE ub.user_id = ? AND ub.is_primary = 1
  `).bind(userId).first();

  if (!userBroker) {
    // Calculate based on actual trade data if no broker linked
    return await calculateActualCostsFromTrades(userId, dateRange, env);
  }

  return await calculateBrokerCosts(userId, userBroker.broker_id, dateRange, env);
}

/**
 * Calculate actual costs from trade data
 */
async function calculateActualCostsFromTrades(userId, dateRange, env) {
  const query = `
    SELECT
      SUM(commission) as total_commission,
      SUM(swap) as total_swap,
      COUNT(*) as total_trades,
      SUM(lots) as total_lots
    FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    AND datetime(close_time) <= datetime(?)
  `;

  const result = await env.DB.prepare(query)
    .bind(userId, dateRange.start, dateRange.end)
    .first();

  // Estimate spread cost (typically 0.0001-0.0002 per pip)
  const estimatedSpreadCost = (result.total_lots || 0) * 1.5 * 10; // $1.5 per lot average

  return {
    broker: null,
    period: dateRange,
    costs: {
      spreadCost: estimatedSpreadCost,
      commissionCost: result.total_commission || 0,
      swapCost: result.total_swap || 0,
      totalCost: estimatedSpreadCost + (result.total_commission || 0) + Math.abs(result.total_swap || 0),
      avgCostPerTrade: (result.total_trades > 0)
        ? ((estimatedSpreadCost + (result.total_commission || 0)) / result.total_trades).toFixed(2)
        : 0,
      avgCostPerLot: (result.total_lots > 0)
        ? ((estimatedSpreadCost + (result.total_commission || 0)) / result.total_lots).toFixed(2)
        : 0
    },
    tradesAnalyzed: result.total_trades || 0,
    isEstimate: true
  };
}

/**
 * Get user's trades for a date range
 */
async function getUserTrades(userId, dateRange, env) {
  const query = `
    SELECT *
    FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    AND datetime(close_time) <= datetime(?)
  `;

  const result = await env.DB.prepare(query)
    .bind(userId, dateRange.start, dateRange.end)
    .all();

  return result.results;
}

/**
 * Calculate costs for a set of trades with a specific broker
 */
function calculateCostsForTrades(trades, broker) {
  let totalSpreadCost = 0;
  let totalCommissionCost = 0;
  let totalSwapCost = 0;

  const pairSpreads = getPairSpreads(broker);

  for (const trade of trades) {
    // Calculate spread cost
    const spreadPips = pairSpreads[trade.symbol] || broker.eurusd_spread_avg || 1.5;
    const spreadCost = calculateSpreadCostForTrade(trade, spreadPips);
    totalSpreadCost += spreadCost;

    // Calculate commission
    if (broker.commission_type === 'commission' || broker.commission_type === 'both') {
      const commissionPerLot = broker.commission_per_lot || 0;
      totalCommissionCost += trade.lots * commissionPerLot * 2; // Round-trip
    }

    // Calculate swap (if trade held overnight)
    if (trade.swap && trade.swap !== 0) {
      // Use actual swap from trade
      totalSwapCost += Math.abs(trade.swap);
    } else {
      // Estimate swap for overnight positions
      const holdTime = getHoldTimeInDays(trade);
      if (holdTime >= 1) {
        const swapRate = trade.type === 'buy'
          ? (broker.typical_swap_long || -0.5)
          : (broker.typical_swap_short || -0.5);
        totalSwapCost += Math.abs(swapRate * trade.lots * holdTime);
      }
    }
  }

  const totalCost = totalSpreadCost + totalCommissionCost + totalSwapCost;
  const totalLots = trades.reduce((sum, t) => sum + (t.lots || 0), 0);

  return {
    spreadCost: parseFloat(totalSpreadCost.toFixed(2)),
    commissionCost: parseFloat(totalCommissionCost.toFixed(2)),
    swapCost: parseFloat(totalSwapCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    avgCostPerTrade: trades.length > 0
      ? parseFloat((totalCost / trades.length).toFixed(2))
      : 0,
    avgCostPerLot: totalLots > 0
      ? parseFloat((totalCost / totalLots).toFixed(2))
      : 0
  };
}

/**
 * Get pair spreads for broker
 */
function getPairSpreads(broker) {
  return {
    'EURUSD': broker.eurusd_spread_avg || 1.2,
    'GBPUSD': broker.gbpusd_spread_avg || 1.5,
    'USDJPY': broker.usdjpy_spread_avg || 1.3,
    'AUDUSD': broker.audusd_spread_avg || 1.4,
    'USDCAD': broker.usdcad_spread_avg || 1.6
  };
}

/**
 * Calculate spread cost for a single trade
 */
function calculateSpreadCostForTrade(trade, spreadPips) {
  // Pip value calculation (simplified)
  // For most pairs: pip value = lot size * 0.0001 / exchange rate * 100000
  // For JPY pairs: pip value = lot size * 0.01 / exchange rate * 100000

  const isJPYPair = trade.symbol && trade.symbol.includes('JPY');
  const pipValue = isJPYPair ? 9.5 : 10; // Approximate pip value per lot

  return trade.lots * spreadPips * pipValue;
}

/**
 * Get hold time in days
 */
function getHoldTimeInDays(trade) {
  if (!trade.open_time || !trade.close_time) return 0;

  const openTime = new Date(trade.open_time);
  const closeTime = new Date(trade.close_time);
  const diffMs = closeTime - openTime;

  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Store cost analysis in database
 */
async function storeCostAnalysis(userId, brokerId, dateRange, trades, costs, env) {
  // Build trading profile
  const tradingProfile = buildTradingProfile(trades);

  await env.DB.prepare(`
    INSERT INTO broker_cost_analysis (
      user_id,
      broker_id,
      period_start,
      period_end,
      analysis_type,
      trading_profile,
      spread_cost,
      commission_cost,
      swap_cost,
      total_cost,
      avg_cost_per_trade,
      avg_cost_per_lot
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    brokerId,
    dateRange.start,
    dateRange.end,
    'historical',
    JSON.stringify(tradingProfile),
    costs.spreadCost,
    costs.commissionCost,
    costs.swapCost,
    costs.totalCost,
    costs.avgCostPerTrade,
    costs.avgCostPerLot
  ).run();
}

/**
 * Build trading profile from trades
 */
function buildTradingProfile(trades) {
  if (trades.length === 0) {
    return {};
  }

  // Calculate daily trade frequency
  const uniqueDays = [...new Set(trades.map(t =>
    new Date(t.close_time).toDateString()
  ))].length;

  const avgTradesPerDay = trades.length / uniqueDays;

  // Calculate average lot size
  const avgLotSize = trades.reduce((sum, t) => sum + (t.lots || 0), 0) / trades.length;

  // Get preferred pairs
  const pairCounts = trades.reduce((acc, t) => {
    acc[t.symbol] = (acc[t.symbol] || 0) + 1;
    return acc;
  }, {});

  const preferredPairs = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair]) => pair);

  // Calculate average hold time
  const holdTimes = trades
    .map(t => getHoldTimeInDays(t))
    .filter(h => h > 0);

  const avgHoldTime = holdTimes.length > 0
    ? holdTimes.reduce((sum, h) => sum + h, 0) / holdTimes.length
    : 0;

  return {
    avgTradesPerDay: parseFloat(avgTradesPerDay.toFixed(2)),
    avgLotSize: parseFloat(avgLotSize.toFixed(2)),
    preferredPairs,
    avgHoldTimeHours: parseFloat((avgHoldTime * 24).toFixed(1)),
    totalTrades: trades.length
  };
}

/**
 * Calculate potential savings by switching brokers
 */
export async function calculatePotentialSavings(userId, currentBrokerId, targetBrokerId, dateRange, env) {
  const currentCosts = await calculateBrokerCosts(userId, currentBrokerId, dateRange, env);
  const targetCosts = await calculateBrokerCosts(userId, targetBrokerId, dateRange, env);

  if (currentCosts.error || targetCosts.error) {
    return {
      error: currentCosts.error || targetCosts.error
    };
  }

  const savings = currentCosts.costs.totalCost - targetCosts.costs.totalCost;
  const savingsPercentage = currentCosts.costs.totalCost > 0
    ? (savings / currentCosts.costs.totalCost) * 100
    : 0;

  // Store comparison
  await env.DB.prepare(`
    UPDATE broker_cost_analysis
    SET compared_to_broker_id = ?,
        potential_savings = ?,
        savings_percentage = ?
    WHERE user_id = ? AND broker_id = ?
    AND period_start = ? AND period_end = ?
  `).bind(
    targetBrokerId,
    savings,
    savingsPercentage,
    userId,
    currentBrokerId,
    dateRange.start,
    dateRange.end
  ).run();

  return {
    currentBroker: currentCosts,
    targetBroker: targetCosts,
    savings: parseFloat(savings.toFixed(2)),
    savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
    recommendation: savings > 0
      ? `You could save $${savings.toFixed(2)} (${savingsPercentage.toFixed(1)}%) by switching`
      : `Your current broker is already the cheaper option`
  };
}

/**
 * Calculate costs for all brokers for comparison
 */
export async function calculateAllBrokerCosts(userId, dateRange, env) {
  const brokers = await env.DB.prepare(`
    SELECT * FROM brokers WHERE is_active = 1
  `).all();

  const trades = await getUserTrades(userId, dateRange, env);

  if (trades.length === 0) {
    return {
      error: 'No trades found for the specified period',
      brokers: []
    };
  }

  const results = [];

  for (const broker of brokers.results) {
    const costs = calculateCostsForTrades(trades, broker);

    results.push({
      broker: {
        id: broker.id,
        name: broker.name,
        isRegulated: broker.is_regulated,
        overallRating: broker.overall_rating
      },
      costs
    });
  }

  // Sort by total cost
  results.sort((a, b) => a.costs.totalCost - b.costs.totalCost);

  return {
    results,
    tradesAnalyzed: trades.length,
    period: dateRange
  };
}
