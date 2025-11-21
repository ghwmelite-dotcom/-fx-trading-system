/**
 * Response Formatter
 * Converts query results into natural language responses
 */

/**
 * Format query result into natural language
 */
export function formatResponse(queryResult, originalCommand) {
  switch (queryResult.type) {
    case 'query_result':
      return formatQueryResult(queryResult);

    case 'calculation_result':
      return formatCalculationResult(queryResult);

    case 'navigation':
      return formatNavigationResponse(queryResult);

    case 'alerts':
      return formatAlertsResponse(queryResult);

    case 'advice':
      return formatAdviceResponse(queryResult);

    default:
      return {
        text: "I processed your request but couldn't format the response properly.",
        type: 'text'
      };
  }
}

/**
 * Format query result
 */
function formatQueryResult(result) {
  const { data, dateRange, pair, filters } = result;

  // Profit query
  if (data.totalProfit !== undefined) {
    const period = dateRange ? ` ${formatDateRange(dateRange)}` : '';
    const profitText = data.totalProfit >= 0
      ? `gained $${data.totalProfit.toFixed(2)}`
      : `lost $${Math.abs(data.totalProfit).toFixed(2)}`;

    return {
      text: `You ${profitText}${period} across ${data.totalTrades} trades.`,
      type: 'text',
      data: {
        profit: data.totalProfit,
        trades: data.totalTrades
      }
    };
  }

  // Trades list
  if (data.trades) {
    const period = dateRange ? ` ${formatDateRange(dateRange)}` : '';
    const pairText = pair ? ` for ${pair}` : '';

    if (data.count === 0) {
      return {
        text: `No trades found${pairText}${period}.`,
        type: 'text'
      };
    }

    const totalProfit = data.trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const profitText = totalProfit >= 0 ? 'gained' : 'lost';

    return {
      text: `Found ${data.count} trades${pairText}${period}. You ${profitText} $${Math.abs(totalProfit).toFixed(2)} total.`,
      type: 'list',
      data: {
        trades: data.trades.slice(0, 5), // Show top 5
        totalCount: data.count
      }
    };
  }

  // Win rate
  if (data.winRate !== undefined) {
    const period = dateRange ? ` ${formatDateRange(dateRange)}` : '';
    const pairText = pair ? ` on ${pair}` : '';

    return {
      text: `Your win rate${pairText}${period} is ${data.winRate}% (${data.winningTrades} wins out of ${data.totalTrades} trades).`,
      type: 'text',
      data: {
        winRate: data.winRate,
        wins: data.winningTrades,
        losses: data.losingTrades,
        total: data.totalTrades
      }
    };
  }

  // Pair performance
  if (data.pair) {
    return {
      text: `For ${data.pair}: ${data.totalTrades} trades, $${data.totalProfit.toFixed(2)} total profit, ${data.winRate}% win rate.`,
      type: 'text',
      data: data
    };
  }

  // Multiple pairs
  if (data.pairs) {
    const topPair = data.pairs[0];
    const worstPair = data.pairs[data.pairs.length - 1];

    return {
      text: `Your best performing pair is ${topPair.symbol} with $${topPair.totalProfit.toFixed(2)} profit. ${worstPair.symbol} is your worst at $${worstPair.totalProfit.toFixed(2)}.`,
      type: 'list',
      data: {
        pairs: data.pairs
      }
    };
  }

  // Daily stats
  if (data.dailyStats) {
    const totalDays = data.dailyStats.length;
    const profitableDays = data.dailyStats.filter(d => d.profit > 0).length;

    return {
      text: `${profitableDays} out of ${totalDays} days were profitable. Here's the breakdown:`,
      type: 'chart',
      data: {
        dailyStats: data.dailyStats
      }
    };
  }

  return {
    text: "I found the data you requested.",
    type: 'text',
    data
  };
}

/**
 * Format calculation result
 */
function formatCalculationResult(result) {
  const { metric, data, dateRange } = result;
  const period = dateRange ? ` ${formatDateRange(dateRange)}` : '';

  switch (metric) {
    case 'profit_factor':
      let pfInterpretation = '';
      const pf = parseFloat(data.profitFactor);

      if (pf > 2) pfInterpretation = ' - Excellent!';
      else if (pf > 1.5) pfInterpretation = ' - Good';
      else if (pf > 1) pfInterpretation = ' - Profitable';
      else if (pf === 1) pfInterpretation = ' - Break even';
      else pfInterpretation = ' - Losing';

      return {
        text: `Your profit factor${period} is ${data.profitFactor}${pfInterpretation}. Gross profit: $${data.grossProfit.toFixed(2)}, Gross loss: $${data.grossLoss.toFixed(2)}.`,
        type: 'metric',
        data
      };

    case 'sharpe_ratio':
      let srInterpretation = '';
      const sr = parseFloat(data.sharpeRatio);

      if (sr > 2) srInterpretation = ' - Outstanding risk-adjusted returns';
      else if (sr > 1) srInterpretation = ' - Good risk-adjusted returns';
      else if (sr > 0) srInterpretation = ' - Positive but below market average';
      else srInterpretation = ' - Poor risk-adjusted returns';

      return {
        text: `Your Sharpe ratio${period} is ${data.sharpeRatio}${srInterpretation}.`,
        type: 'metric',
        data
      };

    case 'drawdown':
      return {
        text: `Your maximum drawdown${period} is $${data.maxDrawdown} (${data.maxDrawdownPercent}% from peak of $${data.peak}).`,
        type: 'metric',
        data
      };

    case 'roi':
      const roiValue = parseFloat(data.roi);
      const roiText = roiValue >= 0 ? `gained ${roiValue}%` : `lost ${Math.abs(roiValue)}%`;

      return {
        text: `Your ROI${period} is ${data.roi}%. You started with $${data.initialBalance} and ${roiText}, ending at $${data.finalBalance}.`,
        type: 'metric',
        data
      };

    default:
      return {
        text: `Calculated ${metric}: ${JSON.stringify(data)}`,
        type: 'text',
        data
      };
  }
}

/**
 * Format navigation response
 */
function formatNavigationResponse(result) {
  const pageNames = {
    dashboard: 'Dashboard',
    trades: 'Trades',
    analytics: 'Analytics',
    journal: 'Trading Journal',
    settings: 'Settings',
    backtest: 'Backtest'
  };

  const pageName = pageNames[result.target] || result.target;

  return {
    text: `Opening ${pageName}...`,
    type: 'navigation',
    data: {
      target: result.target
    }
  };
}

/**
 * Format alerts response
 */
function formatAlertsResponse(result) {
  const { alerts, count } = result.data;

  if (count === 0) {
    return {
      text: "You have no active alerts. Great discipline!",
      type: 'text'
    };
  }

  const highSeverity = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  let response = `You have ${count} active alert${count > 1 ? 's' : ''}`;

  if (highSeverity > 0) {
    response += `, including ${highSeverity} high-priority alert${highSeverity > 1 ? 's' : ''}`;
  }

  response += '. ';

  // Add first alert details
  if (alerts[0]) {
    response += `Most recent: ${alerts[0].title}`;
  }

  return {
    text: response,
    type: 'alerts',
    data: {
      alerts: alerts,
      count: count
    }
  };
}

/**
 * Format advice response
 */
function formatAdviceResponse(result) {
  const { insights, count } = result.data;

  if (count === 0) {
    return {
      text: "I don't have any new insights for you right now. Keep trading and I'll analyze your patterns!",
      type: 'text'
    };
  }

  const topInsight = insights[0];
  let response = '';

  if (count === 1) {
    response = `I have one insight for you: ${topInsight.title}. ${topInsight.description}`;
  } else {
    response = `I have ${count} insights. Top one: ${topInsight.title}. ${topInsight.description}`;
  }

  return {
    text: response,
    type: 'insights',
    data: {
      insights: insights,
      count: count
    }
  };
}

/**
 * Format date range into readable text
 */
function formatDateRange(dateRange) {
  if (!dateRange) return '';

  switch (dateRange.label) {
    case 'today':
      return 'today';
    case 'yesterday':
      return 'yesterday';
    case 'this_week':
      return 'this week';
    case 'last_week':
      return 'last week';
    case 'this_month':
      return 'this month';
    case 'last_month':
      return 'last month';
    case 'this_year':
      return 'this year';
    default:
      if (dateRange.label?.startsWith('last_')) {
        return dateRange.label.replace('_', ' ');
      }
      return `from ${dateRange.start} to ${dateRange.end}`;
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(error, originalCommand) {
  const errorMessages = {
    'Unknown intent': "I didn't quite understand that. Try asking about your profit, trades, or win rate.",
    'No trades found': "I couldn't find any trades matching your request. Try a different date range or currency pair.",
    'Insufficient data': "I need more trades to calculate that metric accurately."
  };

  const message = errorMessages[error.message] || "Sorry, I encountered an error processing your request.";

  return {
    text: message,
    type: 'error',
    error: error.message
  };
}

/**
 * Format loading/processing message
 */
export function formatProcessingMessage(intent) {
  const messages = {
    query_profit: "Calculating your profit...",
    query_trades: "Looking up your trades...",
    query_win_rate: "Computing your win rate...",
    calculate_profit_factor: "Calculating profit factor...",
    calculate_sharpe: "Computing Sharpe ratio...",
    calculate_drawdown: "Analyzing drawdown...",
    default: "Processing your request..."
  };

  return messages[intent] || messages.default;
}
