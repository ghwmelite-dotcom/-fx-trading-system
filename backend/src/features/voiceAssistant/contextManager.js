/**
 * Context Manager
 * Manages conversation context for multi-turn voice interactions
 */

/**
 * Get or create session for user
 */
export async function getOrCreateSession(userId, env) {
  // Check for existing active session (within last 30 minutes)
  const existingSession = await env.DB.prepare(`
    SELECT session_id
    FROM voice_context
    WHERE user_id = ?
    AND datetime(created_at) >= datetime('now', '-30 minutes')
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId).first();

  if (existingSession) {
    return existingSession.session_id;
  }

  // Create new session
  const sessionId = generateSessionId();
  return sessionId;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store context from current command
 */
export async function storeContext(userId, sessionId, contextType, contextValue, env) {
  // Set expiration (5 minutes for most context, 30 minutes for sessions)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (contextType === 'session' ? 30 : 5));

  await env.DB.prepare(`
    INSERT INTO voice_context (user_id, session_id, context_type, context_value, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    userId,
    sessionId,
    contextType,
    JSON.stringify(contextValue),
    expiresAt.toISOString()
  ).run();
}

/**
 * Retrieve context for current session
 */
export async function getContext(userId, sessionId, env) {
  const contexts = await env.DB.prepare(`
    SELECT context_type, context_value
    FROM voice_context
    WHERE user_id = ?
    AND session_id = ?
    AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
  `).bind(userId, sessionId).all();

  const result = {};

  for (const ctx of contexts.results) {
    try {
      result[ctx.context_type] = JSON.parse(ctx.context_value);
    } catch {
      result[ctx.context_type] = ctx.context_value;
    }
  }

  return result;
}

/**
 * Apply context to parsed entities
 */
export function applyContext(entities, context) {
  const applied = { ...entities };

  // Apply date range context if not specified
  if (!applied.dateRange && context.date_range) {
    applied.dateRange = context.date_range;
    applied.contextApplied = applied.contextApplied || [];
    applied.contextApplied.push('date_range');
  }

  // Apply pair context if not specified
  if (!applied.pair && context.pair_focus) {
    applied.pair = context.pair_focus;
    applied.contextApplied = applied.contextApplied || [];
    applied.contextApplied.push('pair');
  }

  // Apply previous query type for follow-up
  if (context.last_query_type) {
    applied.previousQueryType = context.last_query_type;
  }

  return applied;
}

/**
 * Detect if command is a follow-up question
 */
export function isFollowUpQuestion(command) {
  const followUpIndicators = [
    'and what about',
    'what about',
    'how about',
    'and for',
    'also show',
    'same for',
    'compare to',
    'vs',
    'versus',
    'than',
    'now show',
    'this time',
    'instead'
  ];

  const normalizedCommand = command.toLowerCase();

  return followUpIndicators.some(indicator =>
    normalizedCommand.includes(indicator)
  );
}

/**
 * Parse follow-up command and modify entities accordingly
 */
export function parseFollowUp(command, entities, context) {
  const normalizedCommand = command.toLowerCase();

  // Handle "what about EURUSD?"
  if (normalizedCommand.includes('what about') ||
      normalizedCommand.includes('how about') ||
      normalizedCommand.includes('same for')) {

    // Keep the same intent, just change the target
    return {
      ...entities,
      isFollowUp: true,
      followUpType: 'same_query_different_target'
    };
  }

  // Handle "compare to last week"
  if (normalizedCommand.includes('compare') ||
      normalizedCommand.includes('vs') ||
      normalizedCommand.includes('versus')) {

    return {
      ...entities,
      isFollowUp: true,
      followUpType: 'comparison',
      compareWith: context
    };
  }

  return entities;
}

/**
 * Extract context updates from query result
 */
export function extractContextUpdates(intent, entities, result) {
  const updates = [];

  // Store date range context
  if (entities.dateRange) {
    updates.push({
      type: 'date_range',
      value: entities.dateRange
    });
  }

  // Store pair context
  if (entities.pair) {
    updates.push({
      type: 'pair_focus',
      value: entities.pair
    });
  }

  // Store last query type
  updates.push({
    type: 'last_query_type',
    value: intent
  });

  // Store last result for potential follow-up
  updates.push({
    type: 'last_result',
    value: {
      intent,
      data: result.data ? Object.keys(result.data) : []
    }
  });

  return updates;
}

/**
 * Clear session context
 */
export async function clearSession(userId, sessionId, env) {
  await env.DB.prepare(`
    DELETE FROM voice_context
    WHERE user_id = ? AND session_id = ?
  `).bind(userId, sessionId).run();

  return { success: true };
}

/**
 * Clean up expired contexts
 */
export async function cleanupExpiredContexts(env) {
  await env.DB.prepare(`
    DELETE FROM voice_context
    WHERE datetime(expires_at) < datetime('now')
  `).run();

  return { success: true };
}

/**
 * Get conversation history for session
 */
export async function getConversationHistory(userId, sessionId, limit, env) {
  const history = await env.DB.prepare(`
    SELECT
      raw_transcript,
      processed_command,
      intent,
      response_text,
      created_at
    FROM voice_commands
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, limit || 10).all();

  return history.results;
}

/**
 * Build context summary for display
 */
export function buildContextSummary(context) {
  const parts = [];

  if (context.date_range) {
    parts.push(`Period: ${context.date_range.label || 'custom'}`);
  }

  if (context.pair_focus) {
    parts.push(`Pair: ${context.pair_focus}`);
  }

  if (context.last_query_type) {
    parts.push(`Last query: ${context.last_query_type.replace('_', ' ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No active context';
}
