/**
 * Natural Language Parser
 * Converts voice commands to structured intents
 */

/**
 * Parse voice command and extract intent + entities
 */
export function parseVoiceCommand(transcript) {
  const cleaned = cleanTranscript(transcript);

  // Detect intent
  const intent = detectIntent(cleaned);

  // Extract entities based on intent
  const entities = extractEntities(cleaned, intent);

  // Calculate confidence
  const confidence = calculateConfidence(cleaned, intent, entities);

  return {
    intent,
    entities,
    confidence,
    processedCommand: cleaned
  };
}

/**
 * Clean and normalize transcript
 */
function cleanTranscript(transcript) {
  return transcript
    .toLowerCase()
    .trim()
    .replace(/[?!.]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Detect intent from command
 */
function detectIntent(command) {
  // Query intents
  if (matchesPattern(command, [
    'show', 'display', 'what', 'how many', 'tell me', 'get', 'find', 'list'
  ])) {
    if (matchesPattern(command, ['profit', 'loss', 'pnl', 'balance', 'gain'])) {
      return 'query_profit';
    }
    if (matchesPattern(command, ['trade', 'trades', 'position', 'positions'])) {
      return 'query_trades';
    }
    if (matchesPattern(command, ['win rate', 'winning', 'success rate', 'accuracy'])) {
      return 'query_win_rate';
    }
    if (matchesPattern(command, ['best', 'worst', 'top', 'bottom', 'most profitable', 'least profitable'])) {
      return 'query_performance';
    }
    if (matchesPattern(command, ['pair', 'symbol', 'currency'])) {
      return 'query_by_pair';
    }
    if (matchesPattern(command, ['today', 'yesterday', 'week', 'month', 'year'])) {
      return 'query_by_date';
    }
    if (matchesPattern(command, ['analytics', 'analysis', 'statistics', 'stats', 'metrics'])) {
      return 'show_analytics';
    }
    return 'query_general';
  }

  // Calculation intents
  if (matchesPattern(command, ['calculate', 'compute', 'what is', 'whats'])) {
    if (matchesPattern(command, ['profit factor', 'pf'])) {
      return 'calculate_profit_factor';
    }
    if (matchesPattern(command, ['sharpe', 'sharpe ratio'])) {
      return 'calculate_sharpe';
    }
    if (matchesPattern(command, ['drawdown', 'dd'])) {
      return 'calculate_drawdown';
    }
    if (matchesPattern(command, ['roi', 'return'])) {
      return 'calculate_roi';
    }
    return 'calculate_general';
  }

  // Action intents
  if (matchesPattern(command, ['open', 'navigate', 'go to', 'switch to', 'show me'])) {
    return 'navigate';
  }

  if (matchesPattern(command, ['alert', 'notify', 'remind', 'warning'])) {
    return 'get_alerts';
  }

  if (matchesPattern(command, ['advice', 'suggest', 'recommend', 'should i', 'help me'])) {
    return 'get_advice';
  }

  // Default
  return 'unknown';
}

/**
 * Extract entities from command
 */
function extractEntities(command, intent) {
  const entities = {
    dateRange: extractDateRange(command),
    pair: extractPair(command),
    number: extractNumber(command),
    tradeType: extractTradeType(command),
    metric: extractMetric(command),
    page: extractPage(command)
  };

  // Remove null values
  return Object.fromEntries(
    Object.entries(entities).filter(([_, v]) => v !== null)
  );
}

/**
 * Extract date range from command
 */
function extractDateRange(command) {
  const today = new Date();

  if (command.includes('today')) {
    return {
      start: today.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: 'today'
    };
  }

  if (command.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: yesterday.toISOString().split('T')[0],
      end: yesterday.toISOString().split('T')[0],
      label: 'yesterday'
    };
  }

  if (command.includes('this week') || command.includes('week')) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return {
      start: weekStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: 'this_week'
    };
  }

  if (command.includes('last week')) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      label: 'last_week'
    };
  }

  if (command.includes('this month') || command.includes('month')) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: monthStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: 'this_month'
    };
  }

  if (command.includes('last month')) {
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: lastMonthStart.toISOString().split('T')[0],
      end: lastMonthEnd.toISOString().split('T')[0],
      label: 'last_month'
    };
  }

  if (command.includes('this year') || command.includes('year')) {
    const yearStart = new Date(today.getFullYear(), 0, 1);
    return {
      start: yearStart.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: 'this_year'
    };
  }

  // Check for "last X days"
  const daysMatch = command.match(/last (\d+) days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      label: `last_${days}_days`
    };
  }

  return null;
}

/**
 * Extract currency pair from command
 */
function extractPair(command) {
  const commonPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF',
    'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD',
    'XAUUSD', 'BTCUSD', 'ETHUSD'
  ];

  // Remove spaces for matching (e.g., "EUR USD" -> "EURUSD")
  const normalized = command.replace(/\s+/g, '').toUpperCase();

  for (const pair of commonPairs) {
    if (normalized.includes(pair)) {
      return pair;
    }
  }

  // Try to match "euro dollar" -> EURUSD
  const pairMappings = {
    'euro dollar': 'EURUSD',
    'pound dollar': 'GBPUSD',
    'dollar yen': 'USDJPY',
    'aussie dollar': 'AUDUSD',
    'dollar cad': 'USDCAD',
    'gold': 'XAUUSD',
    'bitcoin': 'BTCUSD'
  };

  for (const [phrase, pair] of Object.entries(pairMappings)) {
    if (command.includes(phrase)) {
      return pair;
    }
  }

  return null;
}

/**
 * Extract number from command
 */
function extractNumber(command) {
  const match = command.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Extract trade type (buy/sell, long/short)
 */
function extractTradeType(command) {
  if (command.includes('buy') || command.includes('long')) {
    return 'buy';
  }
  if (command.includes('sell') || command.includes('short')) {
    return 'sell';
  }
  return null;
}

/**
 * Extract metric type
 */
function extractMetric(command) {
  const metrics = {
    'profit factor': 'profit_factor',
    'win rate': 'win_rate',
    'sharpe ratio': 'sharpe',
    'drawdown': 'drawdown',
    'roi': 'roi',
    'return': 'roi',
    'average win': 'avg_win',
    'average loss': 'avg_loss'
  };

  for (const [phrase, metric] of Object.entries(metrics)) {
    if (command.includes(phrase)) {
      return metric;
    }
  }

  return null;
}

/**
 * Extract page/section to navigate to
 */
function extractPage(command) {
  const pages = {
    'dashboard': 'dashboard',
    'trades': 'trades',
    'analytics': 'analytics',
    'journal': 'journal',
    'settings': 'settings',
    'backtest': 'backtest'
  };

  for (const [keyword, page] of Object.entries(pages)) {
    if (command.includes(keyword)) {
      return page;
    }
  }

  return null;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(command, intent, entities) {
  let confidence = 0.5; // Base confidence

  // Higher confidence if intent is clear
  if (intent !== 'unknown') {
    confidence += 0.2;
  }

  // Higher confidence if we extracted entities
  const entityCount = Object.keys(entities).length;
  confidence += Math.min(entityCount * 0.1, 0.3);

  return Math.min(confidence, 1.0);
}

/**
 * Helper to check if command matches patterns
 */
function matchesPattern(command, keywords) {
  return keywords.some(keyword => command.includes(keyword));
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(partialCommand) {
  const suggestions = [
    "Show me today's profit",
    "What's my win rate this month?",
    "Show trades for EURUSD",
    "Calculate my profit factor",
    "What are my best trades?",
    "Show me last week's performance",
    "How many trades did I take today?",
    "What's my total profit this year?",
    "Show my worst losing streak",
    "Navigate to analytics"
  ];

  if (!partialCommand || partialCommand.length < 2) {
    return suggestions.slice(0, 5);
  }

  const cleaned = cleanTranscript(partialCommand);

  return suggestions
    .filter(s => cleanTranscript(s).includes(cleaned))
    .slice(0, 5);
}
