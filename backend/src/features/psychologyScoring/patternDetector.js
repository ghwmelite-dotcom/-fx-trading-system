/**
 * Trading Pattern Detector
 * Detects harmful trading patterns: revenge trading, overtrading, tilt, etc.
 */

/**
 * Detect all harmful patterns in recent trades
 */
export async function detectHarmfulPatterns(userId, env) {
  // Get recent trades (last 7 days for real-time detection)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trades = await env.DB.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    ORDER BY close_time DESC
  `).bind(userId, sevenDaysAgo.toISOString()).all();

  const profile = await env.DB.prepare(`
    SELECT * FROM psychology_profiles WHERE user_id = ?
  `).bind(userId).first();

  if (!trades.results.length) {
    return { patterns: [] };
  }

  const patterns = [];

  // Detect revenge trading
  const revengeTradingPattern = detectRevengeTradingPattern(trades.results, profile);
  if (revengeTradingPattern) patterns.push(revengeTradingPattern);

  // Detect overtrading
  const overtradingPattern = detectOvertradingPattern(trades.results, profile);
  if (overtradingPattern) patterns.push(overtradingPattern);

  // Detect tilt (consecutive losses)
  const tiltPattern = detectTiltPattern(trades.results, profile);
  if (tiltPattern) patterns.push(tiltPattern);

  // Detect oversized positions
  const oversizedPattern = detectOversizedPositionsPattern(trades.results, profile);
  if (oversizedPattern) patterns.push(oversizedPattern);

  // Detect trading outside hours
  const outsideHoursPattern = await detectOutsideHoursPattern(userId, trades.results, env);
  if (outsideHoursPattern) patterns.push(outsideHoursPattern);

  // Detect martingale behavior
  const martingalePattern = detectMartingalePattern(trades.results);
  if (martingalePattern) patterns.push(martingalePattern);

  return { patterns };
}

/**
 * Detect revenge trading (rapid trades after losses)
 */
function detectRevengeTradingPattern(trades, profile) {
  const revengeTradeInstances = [];

  for (let i = 0; i < trades.length - 1; i++) {
    const trade = trades[i];
    const nextTrade = trades[i + 1];

    if (trade.profit < 0) {
      const timeDiff = new Date(nextTrade.open_time) - new Date(trade.close_time);
      const minutesDiff = timeDiff / (1000 * 60);

      // Revenge trade indicators:
      // 1. Trade taken within 5 minutes of a loss
      // 2. Increased position size
      // 3. Same pair (trying to "get back" at the market)
      if (minutesDiff < 5) {
        const isIncreasedSize = nextTrade.lots > trade.lots * 1.2;
        const isSamePair = nextTrade.symbol === trade.symbol;

        revengeTradeInstances.push({
          lossTradeId: trade.id,
          revengeTradeId: nextTrade.id,
          minutesAfter: Math.round(minutesDiff),
          increasedSize: isIncreasedSize,
          samePair: isSamePair,
          severity: isIncreasedSize && isSamePair ? 'high' : 'medium'
        });
      }
    }
  }

  if (revengeTradeInstances.length > 0) {
    return {
      type: 'revenge_trading',
      severity: revengeTradeInstances.length > 3 ? 'critical' : 'high',
      description: `Detected ${revengeTradeInstances.length} potential revenge trading instance(s) in the last 7 days`,
      instances: revengeTradeInstances,
      recommendation: 'Take a 30-minute break after any loss. Close the platform and step away.'
    };
  }

  return null;
}

/**
 * Detect overtrading (too many trades)
 */
function detectOvertradingPattern(trades, profile) {
  const avgTradesPerDay = profile?.avg_trades_per_day || 5;
  const daysInData = 7;
  const currentRate = trades.length / daysInData;

  // Overtrading if current rate is >50% above average
  if (currentRate > avgTradesPerDay * 1.5) {
    return {
      type: 'overtrading',
      severity: currentRate > avgTradesPerDay * 2 ? 'high' : 'medium',
      description: `You're trading ${currentRate.toFixed(1)} times per day vs your average of ${avgTradesPerDay.toFixed(1)}`,
      data: {
        currentRate: currentRate.toFixed(1),
        averageRate: avgTradesPerDay.toFixed(1),
        percentageIncrease: (((currentRate / avgTradesPerDay) - 1) * 100).toFixed(0)
      },
      recommendation: 'Quality over quantity. Reduce your trade frequency and focus on high-probability setups only.'
    };
  }

  return null;
}

/**
 * Detect tilt (consecutive losses triggering emotional trading)
 */
function detectTiltPattern(trades, profile) {
  const tiltThreshold = profile?.tilt_threshold || 3;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 0;
  let lossStreak = [];

  for (const trade of trades) {
    if (trade.profit < 0) {
      consecutiveLosses++;
      lossStreak.push(trade.id);
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
    } else {
      consecutiveLosses = 0;
      lossStreak = [];
    }
  }

  if (maxConsecutiveLosses >= tiltThreshold) {
    return {
      type: 'tilt_detected',
      severity: maxConsecutiveLosses > tiltThreshold + 2 ? 'critical' : 'high',
      description: `You've hit ${maxConsecutiveLosses} consecutive losses (your threshold is ${tiltThreshold})`,
      data: {
        consecutiveLosses: maxConsecutiveLosses,
        threshold: tiltThreshold,
        affectedTradeIds: lossStreak
      },
      recommendation: `STOP TRADING. Take a ${profile?.cooldown_period || 120} minute break. Come back with a clear mind.`
    };
  }

  return null;
}

/**
 * Detect oversized positions (risk management violation)
 */
function detectOversizedPositionsPattern(trades, profile) {
  const avgPositionSize = profile?.avg_position_size ||
    (trades.reduce((sum, t) => sum + (t.lots || 0), 0) / trades.length);

  const oversizedTrades = trades.filter(t => t.lots > avgPositionSize * 2).slice(0, 5);

  if (oversizedTrades.length > 0) {
    return {
      type: 'oversized_positions',
      severity: oversizedTrades.length > 3 ? 'high' : 'medium',
      description: `${oversizedTrades.length} trade(s) with position sizes >2x your average`,
      data: {
        averageSize: avgPositionSize.toFixed(2),
        oversizedTrades: oversizedTrades.map(t => ({
          id: t.id,
          symbol: t.symbol,
          lots: t.lots,
          multiplier: (t.lots / avgPositionSize).toFixed(1)
        }))
      },
      recommendation: 'Stick to your risk management rules. Oversized positions can wipe out your account.'
    };
  }

  return null;
}

/**
 * Detect trading outside defined hours
 */
async function detectOutsideHoursPattern(userId, trades, env) {
  const rules = await env.DB.prepare(`
    SELECT * FROM trading_rules
    WHERE user_id = ? AND rule_type = 'trading_hours' AND is_active = 1
  `).bind(userId).all();

  if (rules.results.length === 0) return null;

  const rule = rules.results[0];
  const ruleValue = JSON.parse(rule.rule_value);

  const outsideHoursTrades = trades.filter(t => {
    const hour = new Date(t.open_time).getHours();
    return hour < ruleValue.start_hour || hour > ruleValue.end_hour;
  }).slice(0, 5);

  if (outsideHoursTrades.length > 0) {
    return {
      type: 'outside_trading_hours',
      severity: 'medium',
      description: `${outsideHoursTrades.length} trade(s) opened outside your defined trading hours`,
      data: {
        definedHours: `${ruleValue.start_hour}:00 - ${ruleValue.end_hour}:00`,
        violations: outsideHoursTrades.map(t => ({
          id: t.id,
          symbol: t.symbol,
          time: new Date(t.open_time).toLocaleTimeString()
        }))
      },
      recommendation: 'Stick to your trading schedule. Late-night/early-morning trades are often impulsive.'
    };
  }

  return null;
}

/**
 * Detect martingale behavior (doubling position size after losses)
 */
function detectMartingalePattern(trades) {
  const martingaleInstances = [];

  for (let i = 0; i < trades.length - 1; i++) {
    const trade = trades[i];
    const nextTrade = trades[i + 1];

    // Martingale: Loss followed by ~2x position size
    if (trade.profit < 0 && nextTrade.lots >= trade.lots * 1.8) {
      martingaleInstances.push({
        lossTradeId: trade.id,
        doubledTradeId: nextTrade.id,
        previousSize: trade.lots,
        newSize: nextTrade.lots,
        multiplier: (nextTrade.lots / trade.lots).toFixed(1)
      });
    }
  }

  if (martingaleInstances.length > 0) {
    return {
      type: 'martingale_behavior',
      severity: 'critical',
      description: `Detected ${martingaleInstances.length} martingale instance(s) - doubling position after loss`,
      instances: martingaleInstances,
      recommendation: 'DANGER: Martingale strategy leads to account blowouts. Never double down after a loss.'
    };
  }

  return null;
}

/**
 * Analyze a single trade for patterns (used for real-time alerts)
 */
export async function analyzeTradeForPatterns(userId, trade, env) {
  // Get the user's last trade before this one
  const previousTrade = await env.DB.prepare(`
    SELECT * FROM trades
    WHERE user_id = ? AND id < ?
    ORDER BY close_time DESC
    LIMIT 1
  `).bind(userId, trade.id).first();

  if (!previousTrade) return { patterns: [] };

  const profile = await env.DB.prepare(`
    SELECT * FROM psychology_profiles WHERE user_id = ?
  `).bind(userId).first();

  const patterns = [];

  // Check for revenge trading
  if (previousTrade.profit < 0) {
    const timeDiff = new Date(trade.open_time) - new Date(previousTrade.close_time);
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 5) {
      patterns.push({
        type: 'revenge_trading',
        severity: 'high',
        description: 'Possible revenge trade detected - opened within 5 minutes of a loss'
      });
    }

    // Check for martingale
    if (trade.lots >= previousTrade.lots * 1.8) {
      patterns.push({
        type: 'martingale_behavior',
        severity: 'critical',
        description: 'Martingale detected - doubled position size after loss'
      });
    }
  }

  // Check for oversized position
  if (profile && trade.lots > profile.avg_position_size * 2) {
    patterns.push({
      type: 'oversized_position',
      severity: 'high',
      description: `Position size ${(trade.lots / profile.avg_position_size).toFixed(1)}x your average`
    });
  }

  return { patterns };
}
