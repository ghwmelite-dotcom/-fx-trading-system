/**
 * Broker Recommendation Engine
 * Finds the best broker based on user's trading style and preferences
 */

import { calculateAllBrokerCosts, calculateCurrentBrokerCosts } from './costCalculator.js';

/**
 * Get personalized broker recommendation
 */
export async function getPersonalizedRecommendation(userId, preferences, env) {
  // Get user's trading profile
  const tradingProfile = await buildUserTradingProfile(userId, env);

  if (!tradingProfile.hasData) {
    return {
      error: 'Need at least 10 trades to generate personalized recommendation'
    };
  }

  // Get all active brokers
  const brokers = await env.DB.prepare(`
    SELECT * FROM brokers WHERE is_active = 1
  `).all();

  // Score each broker
  const scoredBrokers = brokers.results.map(broker => ({
    broker,
    score: calculateBrokerScore(broker, tradingProfile, preferences)
  }));

  // Sort by score
  scoredBrokers.sort((a, b) => b.score.total - a.score.total);

  // Get top 3 recommendations
  const topBrokers = scoredBrokers.slice(0, 3);

  // Store recommendation session
  await storeRecommendation(userId, preferences, topBrokers, env);

  return {
    recommendation: topBrokers[0],
    alternatives: topBrokers.slice(1),
    tradingProfile,
    reasoning: generateRecommendationReasoning(topBrokers[0], tradingProfile, preferences)
  };
}

/**
 * Build user's trading profile
 */
async function buildUserTradingProfile(userId, env) {
  // Get trades from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const tradesResult = await env.DB.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    ORDER BY close_time DESC
  `).bind(userId, ninetyDaysAgo.toISOString()).all();

  const trades = tradesResult.results;

  if (trades.length < 10) {
    return { hasData: false };
  }

  // Analyze trading patterns
  const pairFrequency = {};
  let totalVolume = 0;
  let overnightTrades = 0;
  let scalpTrades = 0;
  let dayTrades = 0;
  let swingTrades = 0;

  trades.forEach(trade => {
    // Pair frequency
    pairFrequency[trade.symbol] = (pairFrequency[trade.symbol] || 0) + 1;

    // Volume
    totalVolume += trade.lots || 0;

    // Hold time analysis
    if (trade.open_time && trade.close_time) {
      const holdTimeHours = (new Date(trade.close_time) - new Date(trade.open_time)) / (1000 * 60 * 60);

      if (holdTimeHours < 1) scalpTrades++;
      else if (holdTimeHours < 24) dayTrades++;
      else {
        swingTrades++;
        overnightTrades++;
      }
    }
  });

  // Determine trading style
  const totalTrades = trades.length;
  let tradingStyle = 'day_trader';

  if (scalpTrades / totalTrades > 0.5) tradingStyle = 'scalper';
  else if (swingTrades / totalTrades > 0.3) tradingStyle = 'swing_trader';

  // Get most traded pairs
  const sortedPairs = Object.entries(pairFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate daily average trades
  const uniqueDays = [...new Set(trades.map(t =>
    new Date(t.close_time).toDateString()
  ))].length;

  return {
    hasData: true,
    totalTrades,
    avgTradesPerDay: totalTrades / uniqueDays,
    avgLotSize: totalVolume / totalTrades,
    monthlyVolume: (totalVolume / 3).toFixed(2), // Average over 3 months
    tradingStyle,
    preferredPairs: sortedPairs.map(([pair]) => pair),
    overnightPercentage: ((overnightTrades / totalTrades) * 100).toFixed(1),
    scalpingPercentage: ((scalpTrades / totalTrades) * 100).toFixed(1)
  };
}

/**
 * Calculate broker score based on criteria
 */
function calculateBrokerScore(broker, tradingProfile, preferences) {
  const weights = {
    cost: 0.35,
    execution: 0.20,
    regulation: 0.15,
    features: 0.15,
    support: 0.10,
    userRating: 0.05
  };

  // Cost score (lower is better)
  let costScore = 100;
  const avgSpread = broker.eurusd_spread_avg || 2;

  if (tradingProfile.tradingStyle === 'scalper') {
    // Scalpers care a lot about spread
    costScore = Math.max(0, 100 - (avgSpread * 30));
  } else {
    costScore = Math.max(0, 100 - (avgSpread * 20));
  }

  // Adjust for commission
  if (broker.commission_per_lot > 0) {
    costScore -= broker.commission_per_lot * 5;
  }

  // Execution score
  let executionScore = 50;
  if (broker.avg_execution_speed_ms) {
    if (broker.avg_execution_speed_ms < 50) executionScore = 100;
    else if (broker.avg_execution_speed_ms < 100) executionScore = 80;
    else if (broker.avg_execution_speed_ms < 200) executionScore = 60;
    else executionScore = 40;
  }

  if (broker.slippage_rating) {
    executionScore = (executionScore + broker.slippage_rating * 20) / 2;
  }

  // Regulation score
  let regulationScore = 0;
  if (broker.is_regulated) {
    regulationScore = 60;

    if (broker.regulators) {
      try {
        const regulators = JSON.parse(broker.regulators);
        const tier1 = ['FCA', 'ASIC', 'NFA', 'CFTC'];
        const tier2 = ['CySEC', 'BaFin', 'AMF'];

        regulators.forEach(reg => {
          if (tier1.includes(reg)) regulationScore += 15;
          else if (tier2.includes(reg)) regulationScore += 10;
          else regulationScore += 5;
        });
      } catch {}
    }
  }
  regulationScore = Math.min(100, regulationScore);

  // Features score
  let featuresScore = 0;
  if (broker.has_mobile_app) featuresScore += 15;
  if (broker.has_demo_account) featuresScore += 10;
  if (broker.has_negative_balance_protection) featuresScore += 25;
  if (broker.has_segregated_accounts) featuresScore += 20;

  // Check platform availability
  if (broker.platforms) {
    try {
      const platforms = JSON.parse(broker.platforms);
      if (platforms.includes('MT5')) featuresScore += 20;
      if (platforms.includes('MT4')) featuresScore += 10;
    } catch {}
  }

  // Swap-free for overnight traders
  if (tradingProfile.overnightPercentage > 30 && broker.swap_free_available) {
    featuresScore += 20;
  }

  featuresScore = Math.min(100, featuresScore);

  // Support score
  let supportScore = broker.support_rating ? broker.support_rating * 20 : 50;

  // User rating score
  let userRatingScore = broker.user_rating_avg ? broker.user_rating_avg * 20 : 50;

  // Apply preference weights if provided
  if (preferences) {
    if (preferences.prioritizeCost) weights.cost = 0.50;
    if (preferences.prioritizeExecution) weights.execution = 0.35;
    if (preferences.prioritizeRegulation) weights.regulation = 0.30;
  }

  // Calculate total score
  const total =
    costScore * weights.cost +
    executionScore * weights.execution +
    regulationScore * weights.regulation +
    featuresScore * weights.features +
    supportScore * weights.support +
    userRatingScore * weights.userRating;

  return {
    total: parseFloat(total.toFixed(1)),
    breakdown: {
      cost: parseFloat(costScore.toFixed(1)),
      execution: parseFloat(executionScore.toFixed(1)),
      regulation: parseFloat(regulationScore.toFixed(1)),
      features: parseFloat(featuresScore.toFixed(1)),
      support: parseFloat(supportScore.toFixed(1)),
      userRating: parseFloat(userRatingScore.toFixed(1))
    }
  };
}

/**
 * Generate recommendation reasoning
 */
function generateRecommendationReasoning(recommendation, tradingProfile, preferences) {
  const reasons = [];
  const broker = recommendation.broker;
  const score = recommendation.score;

  // Top reason based on trading style
  if (tradingProfile.tradingStyle === 'scalper') {
    if (broker.eurusd_spread_avg < 1.0) {
      reasons.push(`Ultra-tight spreads (${broker.eurusd_spread_avg} pips on EUR/USD) - ideal for scalping`);
    }
    if (broker.avg_execution_speed_ms < 100) {
      reasons.push('Fast execution speeds for quick entries/exits');
    }
  } else if (tradingProfile.tradingStyle === 'swing_trader') {
    if (broker.swap_free_available) {
      reasons.push('Swap-free accounts available for overnight positions');
    }
  }

  // Regulation
  if (score.breakdown.regulation >= 80) {
    reasons.push('Top-tier regulation for security and fund protection');
  }

  // Cost efficiency
  if (score.breakdown.cost >= 80) {
    reasons.push(`Low trading costs based on your ${tradingProfile.avgTradesPerDay.toFixed(1)} trades/day average`);
  }

  // Preferred pairs
  if (tradingProfile.preferredPairs[0] === 'EURUSD' && broker.eurusd_spread_avg) {
    reasons.push(`Competitive EUR/USD spread (${broker.eurusd_spread_avg} pips) for your most traded pair`);
  }

  // Features
  if (score.breakdown.features >= 80) {
    reasons.push('Comprehensive platform features and trading tools');
  }

  return {
    summary: reasons[0] || 'Best overall match for your trading profile',
    reasons: reasons.slice(0, 5)
  };
}

/**
 * Store recommendation in database
 */
async function storeRecommendation(userId, preferences, recommendations, env) {
  const brokerIds = recommendations.map(r => r.broker.id);

  await env.DB.prepare(`
    INSERT INTO broker_comparisons (
      user_id,
      broker_ids,
      criteria_weights,
      recommended_broker_id,
      comparison_result
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    userId,
    JSON.stringify(brokerIds),
    JSON.stringify(preferences || {}),
    recommendations[0]?.broker.id || null,
    JSON.stringify(recommendations.map(r => ({
      brokerId: r.broker.id,
      brokerName: r.broker.name,
      score: r.score
    })))
  ).run();
}

/**
 * Compare specific brokers
 */
export async function compareBrokers(userId, brokerIds, env) {
  const brokers = await env.DB.prepare(`
    SELECT * FROM brokers WHERE id IN (${brokerIds.join(',')})
  `).all();

  if (brokers.results.length === 0) {
    return { error: 'No brokers found' };
  }

  const comparison = brokers.results.map(broker => ({
    broker: {
      id: broker.id,
      name: broker.name,
      country: broker.country,
      foundedYear: broker.founded_year
    },
    regulation: {
      isRegulated: broker.is_regulated,
      regulators: broker.regulators ? JSON.parse(broker.regulators) : []
    },
    costs: {
      minDeposit: broker.min_deposit,
      eurusdSpread: broker.eurusd_spread_avg,
      commissionPerLot: broker.commission_per_lot,
      commissionType: broker.commission_type
    },
    execution: {
      type: broker.execution_type,
      avgSpeed: broker.avg_execution_speed_ms,
      slippageRating: broker.slippage_rating
    },
    features: {
      platforms: broker.platforms ? JSON.parse(broker.platforms) : [],
      hasMobileApp: broker.has_mobile_app,
      hasNegativeBalanceProtection: broker.has_negative_balance_protection,
      swapFree: broker.swap_free_available
    },
    ratings: {
      overall: broker.overall_rating,
      userRating: broker.user_rating_avg,
      reviewsCount: broker.user_reviews_count
    }
  }));

  // Store comparison
  await env.DB.prepare(`
    INSERT INTO broker_comparisons (user_id, broker_ids, comparison_result)
    VALUES (?, ?, ?)
  `).bind(
    userId,
    JSON.stringify(brokerIds),
    JSON.stringify(comparison)
  ).run();

  return {
    comparison,
    differences: highlightDifferences(comparison)
  };
}

/**
 * Highlight key differences between brokers
 */
function highlightDifferences(comparison) {
  if (comparison.length < 2) return [];

  const differences = [];

  // Compare spreads
  const spreads = comparison.map(c => c.costs.eurusdSpread).filter(s => s);
  if (spreads.length > 1) {
    const min = Math.min(...spreads);
    const max = Math.max(...spreads);
    if (max - min > 0.5) {
      const bestBroker = comparison.find(c => c.costs.eurusdSpread === min);
      differences.push({
        category: 'Spreads',
        description: `${bestBroker.broker.name} has the lowest spread (${min} pips vs ${max} pips)`
      });
    }
  }

  // Compare regulation
  const regulated = comparison.filter(c => c.regulation.isRegulated);
  if (regulated.length !== comparison.length) {
    differences.push({
      category: 'Regulation',
      description: `${regulated.map(c => c.broker.name).join(', ')} ${regulated.length === 1 ? 'is' : 'are'} regulated`
    });
  }

  // Compare min deposit
  const deposits = comparison.map(c => c.costs.minDeposit).filter(d => d !== null);
  if (deposits.length > 1) {
    const min = Math.min(...deposits);
    const bestBroker = comparison.find(c => c.costs.minDeposit === min);
    differences.push({
      category: 'Minimum Deposit',
      description: `${bestBroker.broker.name} has the lowest minimum deposit ($${min})`
    });
  }

  return differences;
}

/**
 * Get savings opportunity alert
 */
export async function checkSavingsOpportunity(userId, env) {
  // Get current broker costs
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dateRange = {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };

  const currentCosts = await calculateCurrentBrokerCosts(userId, dateRange, env);
  const allCosts = await calculateAllBrokerCosts(userId, dateRange, env);

  if (currentCosts.error || allCosts.error || allCosts.results.length === 0) {
    return null;
  }

  const cheapestBroker = allCosts.results[0];
  const currentTotal = currentCosts.costs.totalCost;
  const cheapestTotal = cheapestBroker.costs.totalCost;

  const savings = currentTotal - cheapestTotal;
  const savingsPercent = (savings / currentTotal) * 100;

  if (savings > 10 && savingsPercent > 10) {
    return {
      hasOpportunity: true,
      currentBroker: currentCosts.broker?.name || 'Your broker',
      cheaperBroker: cheapestBroker.broker.name,
      monthlySavings: parseFloat(savings.toFixed(2)),
      yearlySavings: parseFloat((savings * 12).toFixed(2)),
      savingsPercent: parseFloat(savingsPercent.toFixed(1))
    };
  }

  return { hasOpportunity: false };
}
