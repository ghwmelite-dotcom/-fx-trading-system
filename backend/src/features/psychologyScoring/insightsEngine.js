/**
 * Psychology Insights Engine
 * Generates AI-powered insights and coaching suggestions
 */

/**
 * Generate comprehensive insights for user
 */
export async function generateInsights(userId, env) {
  const profile = await env.DB.prepare(`
    SELECT * FROM psychology_profiles WHERE user_id = ?
  `).bind(userId).first();

  if (!profile) {
    throw new Error('Profile not found');
  }

  const insights = [];

  // Get recent trades for analysis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trades = await env.DB.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    AND datetime(close_time) >= datetime(?)
    ORDER BY close_time DESC
  `).bind(userId, thirtyDaysAgo.toISOString()).all();

  if (trades.results.length === 0) {
    return { insights: [] };
  }

  // Generate different types of insights
  const scoreInsight = generateScoreInsight(profile);
  if (scoreInsight) insights.push(scoreInsight);

  const streakInsight = generateStreakInsight(profile);
  if (streakInsight) insights.push(streakInsight);

  const tradingPatternInsight = generateTradingPatternInsight(trades.results, profile);
  if (tradingPatternInsight) insights.push(tradingPatternInsight);

  const performanceInsight = generatePerformanceInsight(trades.results);
  if (performanceInsight) insights.push(performanceInsight);

  const timeOfDayInsight = generateTimeOfDayInsight(trades.results);
  if (timeOfDayInsight) insights.push(timeOfDayInsight);

  const pairPerformanceInsight = generatePairPerformanceInsight(trades.results);
  if (pairPerformanceInsight) insights.push(pairPerformanceInsight);

  // Store insights in database
  for (const insight of insights) {
    await storeInsight(userId, insight, env);
  }

  return { insights };
}

/**
 * Generate insight about overall score
 */
function generateScoreInsight(profile) {
  const score = profile.current_score;
  let insight_type, title, description, actionItems;

  if (score >= 90) {
    insight_type = 'achievement';
    title = '🎯 Exceptional Discipline';
    description = `Your trading discipline score is ${score}/100. You're in the top tier of disciplined traders. Your emotional control and risk management are excellent.`;
    actionItems = [
      'Maintain your trading journal',
      'Document what\'s working in your routine',
      'Consider mentoring other traders'
    ];
  } else if (score >= 75) {
    insight_type = 'pattern';
    title = '✅ Good Discipline';
    description = `Your discipline score is ${score}/100. You're doing well, but there's room for improvement in ${getWeakestComponent(profile)}.`;
    actionItems = [
      `Focus on improving your ${getWeakestComponent(profile)}`,
      'Review your trading rules regularly',
      'Set reminders before trading sessions'
    ];
  } else if (score >= 60) {
    insight_type = 'warning';
    title = '⚠️ Moderate Discipline Issues';
    description = `Your discipline score is ${score}/100. You're showing signs of emotional trading. Main concern: ${getWeakestComponent(profile)}.`;
    actionItems = [
      'Take a 48-hour break from trading',
      'Review all recent trades for patterns',
      'Create stricter trading rules',
      'Consider reducing position sizes by 50%'
    ];
  } else {
    insight_type = 'warning';
    title = '🚨 Critical Discipline Warning';
    description = `Your discipline score is ${score}/100. You're at high risk of significant losses due to emotional trading. Immediate action required.`;
    actionItems = [
      'STOP TRADING for at least 1 week',
      'Review what went wrong in recent trades',
      'Consider switching to demo account',
      'Seek trading psychology coaching'
    ];
  }

  return {
    insight_type,
    title,
    description,
    confidence: 0.95,
    generated_by: 'rule_engine',
    action_items: actionItems
  };
}

/**
 * Generate insight about discipline streak
 */
function generateStreakInsight(profile) {
  const streak = profile.current_discipline_streak;

  if (streak >= 10) {
    return {
      insight_type: 'achievement',
      title: `🔥 ${streak}-Day Discipline Streak!`,
      description: `You've heeded alerts for ${streak} days in a row. This shows strong commitment to disciplined trading.`,
      confidence: 1.0,
      generated_by: 'rule_engine',
      action_items: [
        `Keep going! Your longest streak is ${profile.longest_discipline_streak} days`,
        'Document what strategies are helping you maintain discipline',
        'Celebrate this milestone - but stay focused'
      ]
    };
  } else if (streak === 0 && profile.total_alerts_ignored > profile.total_alerts_heeded) {
    return {
      insight_type: 'warning',
      title: '⚠️ Ignoring Alerts',
      description: `You've ignored ${profile.total_alerts_ignored} alerts vs heeding ${profile.total_alerts_heeded}. Alerts exist to protect your capital.`,
      confidence: 0.9,
      generated_by: 'rule_engine',
      action_items: [
        'Take alerts seriously - they\'re based on proven patterns',
        'When you get an alert, step away for 10 minutes',
        'Review past ignored alerts and their outcomes'
      ]
    };
  }

  return null;
}

/**
 * Generate insight about trading patterns
 */
function generateTradingPatternInsight(trades, profile) {
  // Analyze win rate by day of week
  const dayPerformance = {};

  trades.forEach(t => {
    const day = new Date(t.close_time).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayPerformance[day]) {
      dayPerformance[day] = { wins: 0, losses: 0, profit: 0 };
    }

    if (t.profit > 0) {
      dayPerformance[day].wins++;
    } else {
      dayPerformance[day].losses++;
    }
    dayPerformance[day].profit += t.profit;
  });

  // Find best and worst days
  let bestDay = { day: null, winRate: 0, profit: 0 };
  let worstDay = { day: null, winRate: 100, profit: 0 };

  Object.entries(dayPerformance).forEach(([day, stats]) => {
    const total = stats.wins + stats.losses;
    const winRate = (stats.wins / total) * 100;

    if (total >= 3) { // Only consider days with at least 3 trades
      if (winRate > bestDay.winRate) {
        bestDay = { day, winRate, profit: stats.profit };
      }
      if (winRate < worstDay.winRate) {
        worstDay = { day, winRate, profit: stats.profit };
      }
    }
  });

  if (bestDay.day && worstDay.day && bestDay.day !== worstDay.day) {
    return {
      insight_type: 'pattern',
      title: '📊 Day-of-Week Pattern Detected',
      description: `Your best trading day is ${bestDay.day} (${bestDay.winRate.toFixed(0)}% win rate), while ${worstDay.day} is your worst (${worstDay.winRate.toFixed(0)}% win rate).`,
      confidence: 0.75,
      generated_by: 'rule_engine',
      supporting_data: {
        bestDay: bestDay.day,
        bestDayWinRate: bestDay.winRate.toFixed(1),
        worstDay: worstDay.day,
        worstDayWinRate: worstDay.winRate.toFixed(1)
      },
      action_items: [
        `Focus your trading on ${bestDay.day}s`,
        `Avoid or reduce trading on ${worstDay.day}s`,
        'Analyze what\'s different about your mindset on different days'
      ]
    };
  }

  return null;
}

/**
 * Generate performance insight
 */
function generatePerformanceInsight(trades) {
  const winningTrades = trades.filter(t => t.profit > 0);
  const losingTrades = trades.filter(t => t.profit < 0);

  if (trades.length < 10) return null;

  const avgWin = winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length;
  const avgLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length);

  const riskRewardRatio = avgWin / avgLoss;
  const winRate = (winningTrades.length / trades.length) * 100;

  if (winRate < 40 && riskRewardRatio > 2) {
    return {
      insight_type: 'suggestion',
      title: '📈 Good Risk/Reward Despite Low Win Rate',
      description: `Your win rate is ${winRate.toFixed(0)}%, but your average win ($${avgWin.toFixed(2)}) is ${riskRewardRatio.toFixed(1)}x your average loss ($${avgLoss.toFixed(2)}). This is actually a profitable trading style.`,
      confidence: 0.85,
      generated_by: 'rule_engine',
      action_items: [
        'Don\'t worry about low win rate - your R:R is excellent',
        'Keep your winners running',
        'Cut losses quickly as you\'re doing'
      ]
    };
  } else if (winRate > 60 && riskRewardRatio < 1) {
    return {
      insight_type: 'warning',
      title: '⚠️ High Win Rate but Poor Risk/Reward',
      description: `You win ${winRate.toFixed(0)}% of trades, but your average win ($${avgWin.toFixed(2)}) is smaller than your average loss ($${avgLoss.toFixed(2)}). One big loss can wipe out many wins.`,
      confidence: 0.9,
      generated_by: 'rule_engine',
      action_items: [
        'Let your winners run longer',
        'Cut losing trades earlier',
        'Aim for at least 1:1.5 risk/reward ratio'
      ]
    };
  }

  return null;
}

/**
 * Generate time-of-day insight
 */
function generateTimeOfDayInsight(trades) {
  const sessions = {
    asian: { wins: 0, losses: 0, name: 'Asian session (00:00-08:00)' },
    european: { wins: 0, losses: 0, name: 'European session (08:00-16:00)' },
    american: { wins: 0, losses: 0, name: 'American session (16:00-24:00)' }
  };

  trades.forEach(t => {
    const hour = new Date(t.open_time).getHours();
    const isWin = t.profit > 0;

    if (hour >= 0 && hour < 8) {
      sessions.asian[isWin ? 'wins' : 'losses']++;
    } else if (hour >= 8 && hour < 16) {
      sessions.european[isWin ? 'wins' : 'losses']++;
    } else {
      sessions.american[isWin ? 'wins' : 'losses']++;
    }
  });

  // Find best session
  let bestSession = null;
  let bestWinRate = 0;

  Object.entries(sessions).forEach(([key, data]) => {
    const total = data.wins + data.losses;
    if (total >= 5) {
      const winRate = (data.wins / total) * 100;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestSession = data.name;
      }
    }
  });

  if (bestSession && bestWinRate > 60) {
    return {
      insight_type: 'pattern',
      title: '🕐 Optimal Trading Time Identified',
      description: `You have a ${bestWinRate.toFixed(0)}% win rate during the ${bestSession}. Consider focusing your trading during these hours.`,
      confidence: 0.7,
      generated_by: 'rule_engine',
      action_items: [
        `Schedule your main trading during ${bestSession}`,
        'Avoid sessions where you perform poorly',
        'Track if this pattern continues'
      ]
    };
  }

  return null;
}

/**
 * Generate pair performance insight
 */
function generatePairPerformanceInsight(trades) {
  const pairStats = {};

  trades.forEach(t => {
    if (!pairStats[t.symbol]) {
      pairStats[t.symbol] = { wins: 0, losses: 0, profit: 0, count: 0 };
    }
    pairStats[t.symbol].count++;
    pairStats[t.symbol].profit += t.profit;
    if (t.profit > 0) {
      pairStats[t.symbol].wins++;
    } else {
      pairStats[t.symbol].losses++;
    }
  });

  // Find pairs with significant data
  const significantPairs = Object.entries(pairStats)
    .filter(([_, stats]) => stats.count >= 5)
    .map(([pair, stats]) => ({
      pair,
      winRate: (stats.wins / stats.count) * 100,
      profit: stats.profit,
      count: stats.count
    }))
    .sort((a, b) => b.profit - a.profit);

  if (significantPairs.length < 2) return null;

  const best = significantPairs[0];
  const worst = significantPairs[significantPairs.length - 1];

  if (best.profit > 0 && worst.profit < 0) {
    return {
      insight_type: 'suggestion',
      title: '💱 Pair Performance Analysis',
      description: `${best.pair} is your most profitable pair (+$${best.profit.toFixed(2)}, ${best.winRate.toFixed(0)}% win rate), while ${worst.pair} is costing you (-$${Math.abs(worst.profit).toFixed(2)}).`,
      confidence: 0.8,
      generated_by: 'rule_engine',
      action_items: [
        `Focus more on ${best.pair}`,
        `Avoid or reduce ${worst.pair} trades`,
        'Analyze what makes your strategy work better on certain pairs'
      ]
    };
  }

  return null;
}

/**
 * Store insight in database
 */
async function storeInsight(userId, insight, env) {
  // Check if similar insight already exists
  const existing = await env.DB.prepare(`
    SELECT * FROM psychology_insights
    WHERE user_id = ?
    AND insight_type = ?
    AND title = ?
    AND datetime(created_at) >= datetime('now', '-7 days')
  `).bind(userId, insight.insight_type, insight.title).first();

  if (existing) return; // Don't duplicate recent insights

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Insights valid for 7 days

  await env.DB.prepare(`
    INSERT INTO psychology_insights (
      user_id,
      insight_type,
      title,
      description,
      confidence,
      generated_by,
      supporting_data,
      action_items,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    insight.insight_type,
    insight.title,
    insight.description,
    insight.confidence,
    insight.generated_by,
    JSON.stringify(insight.supporting_data || {}),
    JSON.stringify(insight.action_items || []),
    expiresAt.toISOString()
  ).run();
}

/**
 * Get weakest component from profile
 */
function getWeakestComponent(profile) {
  const components = {
    'risk discipline': profile.risk_discipline_score,
    'consistency': profile.consistency_score,
    'emotional control': 100 - profile.revenge_trading_risk
  };

  return Object.entries(components)
    .sort((a, b) => a[1] - b[1])[0][0];
}

/**
 * Get all insights for user
 */
export async function getInsights(userId, env) {
  const insights = await env.DB.prepare(`
    SELECT * FROM psychology_insights
    WHERE user_id = ?
    AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
  `).bind(userId).all();

  return insights.results;
}

/**
 * Mark insight as read
 */
export async function markInsightAsRead(insightId, userId, env) {
  await env.DB.prepare(`
    UPDATE psychology_insights
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).bind(insightId, userId).run();

  return { success: true };
}

/**
 * Provide feedback on insight
 */
export async function provideFeedback(insightId, userId, isUseful, notes, env) {
  await env.DB.prepare(`
    UPDATE psychology_insights
    SET is_useful = ?,
        user_notes = ?
    WHERE id = ? AND user_id = ?
  `).bind(isUseful ? 1 : 0, notes || '', insightId, userId).run();

  return { success: true };
}
