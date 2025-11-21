/**
 * Psychology Score Calculator
 * Calculates trading discipline scores based on user behavior patterns
 */

/**
 * Calculate the overall psychology score (0-100)
 * Higher score = better discipline
 */
export async function calculatePsychologyScore(userId, env) {
  const profile = await getOrCreateProfile(userId, env);

  // Get recent trades for analysis (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trades = await env.DB.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    ORDER BY close_time DESC
  `).bind(userId, thirtyDaysAgo.toISOString()).all();

  if (trades.results.length === 0) {
    return {
      score: 100,
      message: 'No recent trades to analyze'
    };
  }

  // Calculate component scores
  const riskScore = calculateRiskDisciplineScore(trades.results, profile);
  const consistencyScore = calculateConsistencyScore(trades.results);
  const emotionalScore = calculateEmotionalControlScore(trades.results, profile);
  const adherenceScore = await calculateRuleAdherenceScore(userId, trades.results, env);

  // Weighted average
  const overallScore = Math.round(
    riskScore * 0.3 +
    consistencyScore * 0.25 +
    emotionalScore * 0.35 +
    adherenceScore * 0.1
  );

  // Update profile with new scores
  await env.DB.prepare(`
    UPDATE psychology_profiles
    SET current_score = ?,
        risk_discipline_score = ?,
        consistency_score = ?,
        revenge_trading_risk = ?,
        overtrading_risk = ?,
        last_score_update = datetime('now')
    WHERE user_id = ?
  `).bind(
    overallScore,
    riskScore,
    consistencyScore,
    100 - emotionalScore, // Revenge trading risk is inverse of emotional control
    calculateOvertradingRisk(trades.results, profile),
    userId
  ).run();

  // Log the score change event
  await logPsychologyEvent(userId, 'score_change', {
    previous_score: profile.current_score,
    new_score: overallScore,
    components: { riskScore, consistencyScore, emotionalScore, adherenceScore }
  }, overallScore - profile.current_score, env);

  return {
    score: overallScore,
    components: {
      riskDiscipline: riskScore,
      consistency: consistencyScore,
      emotionalControl: emotionalScore,
      ruleAdherence: adherenceScore
    },
    risks: {
      revengeTradingRisk: 100 - emotionalScore,
      overtradingRisk: calculateOvertradingRisk(trades.results, profile)
    }
  };
}

/**
 * Calculate risk discipline score based on position sizing consistency
 */
function calculateRiskDisciplineScore(trades, profile) {
  if (trades.length === 0) return 100;

  // Calculate average position size
  const avgSize = trades.reduce((sum, t) => sum + (t.lots || 0), 0) / trades.length;

  // Check for oversized positions (>2x average)
  const oversizedTrades = trades.filter(t => t.lots > avgSize * 2);
  const oversizedRatio = oversizedTrades.length / trades.length;

  // Check for undersized positions (<0.5x average)
  const undersizedTrades = trades.filter(t => t.lots < avgSize * 0.5 && t.lots > 0);
  const undersizedRatio = undersizedTrades.length / trades.length;

  // Penalty for inconsistent sizing
  const sizeInconsistencyPenalty = (oversizedRatio + undersizedRatio) * 40;

  // Check for increasing position size after losses (martingale)
  let martingalePenalty = 0;
  for (let i = 1; i < trades.length; i++) {
    const prevTrade = trades[i - 1];
    const currentTrade = trades[i];

    if (prevTrade.profit < 0 && currentTrade.lots > prevTrade.lots * 1.5) {
      martingalePenalty += 10;
    }
  }

  const score = Math.max(0, Math.min(100, 100 - sizeInconsistencyPenalty - Math.min(martingalePenalty, 30)));
  return Math.round(score);
}

/**
 * Calculate consistency score based on trading pattern regularity
 */
function calculateConsistencyScore(trades) {
  if (trades.length === 0) return 100;

  // Check trading frequency consistency
  const tradeDates = trades.map(t => new Date(t.close_time).toDateString());
  const uniqueDays = [...new Set(tradeDates)].length;
  const avgTradesPerDay = trades.length / uniqueDays;

  // Penalty for high variation in daily trade count
  const dailyTradeCounts = Object.values(
    trades.reduce((acc, t) => {
      const date = new Date(t.close_time).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  );

  const stdDev = calculateStandardDeviation(dailyTradeCounts);
  const variationPenalty = Math.min(30, (stdDev / avgTradesPerDay) * 20);

  // Check symbol consistency
  const symbols = trades.map(t => t.symbol);
  const uniqueSymbols = [...new Set(symbols)];
  const symbolDiversityPenalty = uniqueSymbols.length > 10 ? 15 : 0; // Too many pairs = lack of focus

  const score = Math.max(0, 100 - variationPenalty - symbolDiversityPenalty);
  return Math.round(score);
}

/**
 * Calculate emotional control score (detects revenge trading)
 */
function calculateEmotionalControlScore(trades, profile) {
  if (trades.length < 3) return 100;

  let revengeTradingPenalty = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 0;

  // Detect revenge trading patterns
  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];

    if (trade.profit < 0) {
      consecutiveLosses++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);

      // Check if next trade was taken too quickly after loss
      if (i < trades.length - 1) {
        const nextTrade = trades[i + 1];
        const timeDiff = new Date(nextTrade.open_time) - new Date(trade.close_time);
        const minutesDiff = timeDiff / (1000 * 60);

        // Trading within 5 minutes after a loss = likely revenge trade
        if (minutesDiff < 5) {
          revengeTradingPenalty += 15;
        }

        // Increased position size after loss = revenge trade
        if (nextTrade.lots > trade.lots * 1.3) {
          revengeTradingPenalty += 10;
        }
      }
    } else {
      consecutiveLosses = 0;
    }
  }

  // Penalty for exceeding tilt threshold
  const tiltPenalty = maxConsecutiveLosses > profile.tilt_threshold ? 20 : 0;

  const score = Math.max(0, 100 - Math.min(revengeTradingPenalty, 50) - tiltPenalty);
  return Math.round(score);
}

/**
 * Calculate rule adherence score
 */
async function calculateRuleAdherenceScore(userId, trades, env) {
  const rules = await env.DB.prepare(`
    SELECT * FROM trading_rules
    WHERE user_id = ? AND is_active = 1
  `).bind(userId).all();

  if (rules.results.length === 0) return 100;

  let totalViolations = 0;
  let totalRules = rules.results.length;

  for (const rule of rules.results) {
    const violations = await checkRuleViolations(rule, trades);
    totalViolations += violations;
  }

  // Each violation reduces score
  const violationPenalty = Math.min(50, totalViolations * 5);
  const score = Math.max(0, 100 - violationPenalty);

  return Math.round(score);
}

/**
 * Check violations for a specific rule
 */
function checkRuleViolations(rule, trades) {
  const ruleValue = JSON.parse(rule.rule_value);
  let violations = 0;

  switch (rule.rule_type) {
    case 'max_trades_per_day':
      const tradeDates = trades.reduce((acc, t) => {
        const date = new Date(t.close_time).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      Object.values(tradeDates).forEach(count => {
        if (count > ruleValue.max_trades) violations++;
      });
      break;

    case 'max_position_size':
      trades.forEach(t => {
        if (t.lots > ruleValue.max_lots) violations++;
      });
      break;

    case 'max_daily_loss':
      const dailyProfits = trades.reduce((acc, t) => {
        const date = new Date(t.close_time).toDateString();
        acc[date] = (acc[date] || 0) + (t.profit || 0);
        return acc;
      }, {});

      Object.values(dailyProfits).forEach(profit => {
        if (profit < -ruleValue.max_loss) violations++;
      });
      break;

    case 'pair_restriction':
      if (ruleValue.allowed_pairs) {
        trades.forEach(t => {
          if (!ruleValue.allowed_pairs.includes(t.symbol)) violations++;
        });
      }
      break;

    case 'trading_hours':
      trades.forEach(t => {
        const openHour = new Date(t.open_time).getHours();
        if (openHour < ruleValue.start_hour || openHour > ruleValue.end_hour) {
          violations++;
        }
      });
      break;
  }

  return violations;
}

/**
 * Calculate overtrading risk
 */
function calculateOvertradingRisk(trades, profile) {
  if (trades.length === 0) return 0;

  const avgTradesPerDay = profile.avg_trades_per_day || 5;
  const currentTradesPerDay = trades.length / 30; // Last 30 days

  // Risk increases if trading significantly more than average
  const ratio = currentTradesPerDay / avgTradesPerDay;

  if (ratio > 2) return 80;
  if (ratio > 1.5) return 60;
  if (ratio > 1.2) return 40;
  if (ratio > 1) return 20;

  return 0;
}

/**
 * Get or create psychology profile for user
 */
async function getOrCreateProfile(userId, env) {
  let profile = await env.DB.prepare(`
    SELECT * FROM psychology_profiles WHERE user_id = ?
  `).bind(userId).first();

  if (!profile) {
    // Create default profile
    await env.DB.prepare(`
      INSERT INTO psychology_profiles (user_id) VALUES (?)
    `).bind(userId).run();

    profile = await env.DB.prepare(`
      SELECT * FROM psychology_profiles WHERE user_id = ?
    `).bind(userId).first();
  }

  return profile;
}

/**
 * Log psychology event
 */
async function logPsychologyEvent(userId, eventType, eventData, impactScore, env) {
  await env.DB.prepare(`
    INSERT INTO psychology_events (user_id, event_type, event_data, impact_score)
    VALUES (?, ?, ?, ?)
  `).bind(userId, eventType, JSON.stringify(eventData), impactScore).run();
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values) {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}
