/**
 * Voice Assistant API Routes
 */

import { parseVoiceCommand, getCommandSuggestions } from './nlpParser.js';
import { generateQuery } from './queryGenerator.js';
import { formatResponse, formatErrorResponse } from './responseFormatter.js';
import {
  getOrCreateSession,
  storeContext,
  getContext,
  applyContext,
  isFollowUpQuestion,
  parseFollowUp,
  extractContextUpdates,
  clearSession,
  getConversationHistory,
  buildContextSummary
} from './contextManager.js';

/**
 * Register all voice assistant routes
 */
export function registerVoiceRoutes(routes) {
  // Process voice command
  routes.push({
    method: 'POST',
    pattern: /^\/api\/voice\/command$/,
    handler: async (request, env, userId) => {
      const startTime = Date.now();

      try {
        const body = await request.json();
        const { transcript, language = 'en-US' } = body;

        if (!transcript || transcript.trim().length === 0) {
          return new Response(JSON.stringify({
            error: 'No transcript provided'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check daily command limit
        const settings = await getOrCreateSettings(userId, env);

        if (settings.commands_today >= settings.daily_command_limit) {
          return new Response(JSON.stringify({
            error: 'Daily command limit reached',
            limit: settings.daily_command_limit
          }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Get or create session
        const sessionId = await getOrCreateSession(userId, env);

        // Get existing context
        const context = await getContext(userId, sessionId, env);

        // Parse the voice command
        let parsed = parseVoiceCommand(transcript);

        // Check if it's a follow-up question
        if (isFollowUpQuestion(transcript)) {
          parsed.entities = parseFollowUp(transcript, parsed.entities, context);
        }

        // Apply context to entities
        parsed.entities = applyContext(parsed.entities, context);

        // Generate and execute query
        let result;
        let response;
        let status = 'success';

        try {
          result = await generateQuery(userId, parsed.intent, parsed.entities, env);
          response = formatResponse(result, transcript);
        } catch (error) {
          result = null;
          response = formatErrorResponse(error, transcript);
          status = 'error';
        }

        // Store context updates
        if (result) {
          const updates = extractContextUpdates(parsed.intent, parsed.entities, result);
          for (const update of updates) {
            await storeContext(userId, sessionId, update.type, update.value, env);
          }
        }

        // Log command
        const processingTime = Date.now() - startTime;
        await logCommand(userId, {
          transcript,
          language,
          parsed,
          result,
          response,
          status,
          processingTime,
          sessionId
        }, env);

        // Update daily counter
        await incrementCommandCounter(userId, env);

        return new Response(JSON.stringify({
          success: true,
          response: response.text,
          responseType: response.type,
          data: response.data,
          intent: parsed.intent,
          confidence: parsed.confidence,
          context: buildContextSummary(context),
          processingTime
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to process voice command',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get voice settings
  routes.push({
    method: 'GET',
    pattern: /^\/api\/voice\/settings$/,
    handler: async (request, env, userId) => {
      try {
        const settings = await getOrCreateSettings(userId, env);

        return new Response(JSON.stringify({
          success: true,
          settings
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch settings',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Update voice settings
  routes.push({
    method: 'PUT',
    pattern: /^\/api\/voice\/settings$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        const allowedFields = [
          'is_enabled', 'wake_word', 'language', 'voice_gender',
          'speech_rate', 'store_audio', 'allow_cloud_processing',
          'auto_execute', 'proactive_alerts', 'context_awareness'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
          }
        }

        if (updates.length === 0) {
          return new Response(JSON.stringify({
            error: 'No valid fields to update'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        values.push(userId);

        await env.DB.prepare(`
          UPDATE voice_settings
          SET ${updates.join(', ')}, updated_at = datetime('now')
          WHERE user_id = ?
        `).bind(...values).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Settings updated'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to update settings',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get command history
  routes.push({
    method: 'GET',
    pattern: /^\/api\/voice\/history$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        const history = await env.DB.prepare(`
          SELECT
            id,
            raw_transcript,
            processed_command,
            intent,
            confidence,
            status,
            response_text,
            processing_time_ms,
            created_at
          FROM voice_commands
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `).bind(userId, limit).all();

        return new Response(JSON.stringify({
          success: true,
          history: history.results,
          count: history.results.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch history',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Submit feedback on command
  routes.push({
    method: 'POST',
    pattern: /^\/api\/voice\/feedback$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        const { command_id, was_helpful, accuracy_rating, feedback_text, issue_type } = body;

        if (!command_id) {
          return new Response(JSON.stringify({
            error: 'Missing command_id'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await env.DB.prepare(`
          INSERT INTO voice_feedback (
            command_id,
            user_id,
            was_helpful,
            accuracy_rating,
            feedback_text,
            issue_type
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          command_id,
          userId,
          was_helpful ? 1 : 0,
          accuracy_rating || null,
          feedback_text || null,
          issue_type || null
        ).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Feedback recorded'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to record feedback',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get custom commands
  routes.push({
    method: 'GET',
    pattern: /^\/api\/voice\/custom-commands$/,
    handler: async (request, env, userId) => {
      try {
        const commands = await env.DB.prepare(`
          SELECT * FROM custom_voice_commands
          WHERE user_id = ? AND is_active = 1
          ORDER BY usage_count DESC
        `).bind(userId).all();

        return new Response(JSON.stringify({
          success: true,
          commands: commands.results,
          count: commands.results.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch custom commands',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Create custom command
  routes.push({
    method: 'POST',
    pattern: /^\/api\/voice\/custom-commands$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        const { trigger_phrase, action_type, action_config } = body;

        if (!trigger_phrase || !action_type || !action_config) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: trigger_phrase, action_type, action_config'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(`
          INSERT INTO custom_voice_commands (
            user_id,
            trigger_phrase,
            action_type,
            action_config
          ) VALUES (?, ?, ?, ?)
        `).bind(
          userId,
          trigger_phrase,
          action_type,
          JSON.stringify(action_config)
        ).run();

        return new Response(JSON.stringify({
          success: true,
          commandId: result.meta.last_row_id,
          message: 'Custom command created'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to create custom command',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Delete custom command
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/voice\/custom-commands\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const commandId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM custom_voice_commands
          WHERE id = ? AND user_id = ?
        `).bind(commandId, userId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Custom command deleted'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to delete custom command',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get command suggestions
  routes.push({
    method: 'GET',
    pattern: /^\/api\/voice\/suggestions$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const partial = url.searchParams.get('q') || '';

        const suggestions = getCommandSuggestions(partial);

        return new Response(JSON.stringify({
          success: true,
          suggestions
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch suggestions',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Clear session context
  routes.push({
    method: 'POST',
    pattern: /^\/api\/voice\/clear-context$/,
    handler: async (request, env, userId) => {
      try {
        const sessionId = await getOrCreateSession(userId, env);
        await clearSession(userId, sessionId, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'Context cleared'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to clear context',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });
}

/**
 * Helper: Get or create user settings
 */
async function getOrCreateSettings(userId, env) {
  let settings = await env.DB.prepare(`
    SELECT * FROM voice_settings WHERE user_id = ?
  `).bind(userId).first();

  if (!settings) {
    await env.DB.prepare(`
      INSERT INTO voice_settings (user_id) VALUES (?)
    `).bind(userId).run();

    settings = await env.DB.prepare(`
      SELECT * FROM voice_settings WHERE user_id = ?
    `).bind(userId).first();
  }

  // Reset daily counter if new day
  const today = new Date().toISOString().split('T')[0];
  if (settings.last_reset_date !== today) {
    await env.DB.prepare(`
      UPDATE voice_settings
      SET commands_today = 0, last_reset_date = ?
      WHERE user_id = ?
    `).bind(today, userId).run();

    settings.commands_today = 0;
  }

  return settings;
}

/**
 * Helper: Increment daily command counter
 */
async function incrementCommandCounter(userId, env) {
  await env.DB.prepare(`
    UPDATE voice_settings
    SET commands_today = commands_today + 1,
        total_commands = total_commands + 1
    WHERE user_id = ?
  `).bind(userId).run();
}

/**
 * Helper: Log command to database
 */
async function logCommand(userId, data, env) {
  await env.DB.prepare(`
    INSERT INTO voice_commands (
      user_id,
      raw_transcript,
      language,
      processed_command,
      intent,
      entities,
      confidence,
      status,
      result_data,
      response_text,
      processing_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    data.transcript,
    data.language,
    data.parsed.processedCommand,
    data.parsed.intent,
    JSON.stringify(data.parsed.entities),
    data.parsed.confidence,
    data.status,
    data.result ? JSON.stringify(data.result) : null,
    data.response.text,
    data.processingTime
  ).run();
}
