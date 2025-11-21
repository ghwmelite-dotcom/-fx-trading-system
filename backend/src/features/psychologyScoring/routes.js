/**
 * Psychology Scoring API Routes
 */

import { calculatePsychologyScore } from './scoreCalculator.js';
import { detectHarmfulPatterns, analyzeTradeForPatterns } from './patternDetector.js';
import {
  generateAlertsFromPatterns,
  getActiveAlerts,
  markAlertAsViewed,
  respondToAlert,
  dismissAllAlerts,
  getAlertStatistics,
  createCustomAlert
} from './alertGenerator.js';
import {
  generateInsights,
  getInsights,
  markInsightAsRead,
  provideFeedback
} from './insightsEngine.js';

/**
 * Register all psychology scoring routes
 */
export function registerPsychologyRoutes(routes) {
  // Get user's psychology profile
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/profile$/,
    handler: async (request, env, userId) => {
      try {
        // Get or create profile
        let profile = await env.DB.prepare(`
          SELECT * FROM psychology_profiles WHERE user_id = ?
        `).bind(userId).first();

        if (!profile) {
          await env.DB.prepare(`
            INSERT INTO psychology_profiles (user_id) VALUES (?)
          `).bind(userId).run();

          profile = await env.DB.prepare(`
            SELECT * FROM psychology_profiles WHERE user_id = ?
          `).bind(userId).first();
        }

        // Get recent score calculation
        const scoreResult = await calculatePsychologyScore(userId, env);

        return new Response(JSON.stringify({
          success: true,
          profile: {
            score: profile.current_score,
            lastUpdate: profile.last_score_update,
            components: scoreResult.components,
            risks: scoreResult.risks,
            streak: profile.current_discipline_streak,
            longestStreak: profile.longest_discipline_streak
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch psychology profile',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get active alerts
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/alerts$/,
    handler: async (request, env, userId) => {
      try {
        const alerts = await getActiveAlerts(userId, env);

        return new Response(JSON.stringify({
          success: true,
          alerts,
          count: alerts.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch alerts',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Mark alert as viewed
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/alerts\/(\d+)\/view$/,
    handler: async (request, env, userId, matches) => {
      try {
        const alertId = parseInt(matches[1]);
        await markAlertAsViewed(alertId, userId, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'Alert marked as viewed'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to update alert',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Respond to alert (acknowledge/dismiss/heed)
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/alerts\/(\d+)\/respond$/,
    handler: async (request, env, userId, matches) => {
      try {
        const alertId = parseInt(matches[1]);
        const body = await request.json();

        if (!body.response || !['acknowledged', 'dismissed', 'heeded'].includes(body.response)) {
          return new Response(JSON.stringify({
            error: 'Invalid response type. Must be: acknowledged, dismissed, or heeded'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await respondToAlert(alertId, userId, body.response, body.note, env);

        return new Response(JSON.stringify({
          success: true,
          message: `Alert ${body.response}`,
          streakUpdated: body.response === 'heeded'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to respond to alert',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Dismiss all alerts
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/alerts\/dismiss-all$/,
    handler: async (request, env, userId) => {
      try {
        await dismissAllAlerts(userId, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'All alerts dismissed'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to dismiss alerts',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get alert statistics
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/alerts\/statistics$/,
    handler: async (request, env, userId) => {
      try {
        const stats = await getAlertStatistics(userId, env);

        return new Response(JSON.stringify({
          success: true,
          statistics: stats
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch statistics',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get AI insights
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/insights$/,
    handler: async (request, env, userId) => {
      try {
        const insights = await getInsights(userId, env);

        return new Response(JSON.stringify({
          success: true,
          insights,
          count: insights.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch insights',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Generate new insights
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/insights\/generate$/,
    handler: async (request, env, userId) => {
      try {
        const result = await generateInsights(userId, env);

        return new Response(JSON.stringify({
          success: true,
          insights: result.insights,
          count: result.insights.length,
          message: 'Insights generated successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to generate insights',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Mark insight as read
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/insights\/(\d+)\/read$/,
    handler: async (request, env, userId, matches) => {
      try {
        const insightId = parseInt(matches[1]);
        await markInsightAsRead(insightId, userId, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'Insight marked as read'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to update insight',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Provide feedback on insight
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/insights\/(\d+)\/feedback$/,
    handler: async (request, env, userId, matches) => {
      try {
        const insightId = parseInt(matches[1]);
        const body = await request.json();

        await provideFeedback(
          insightId,
          userId,
          body.isUseful,
          body.notes,
          env
        );

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

  // Detect patterns (manual trigger)
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/detect-patterns$/,
    handler: async (request, env, userId) => {
      try {
        const result = await detectHarmfulPatterns(userId, env);

        // Generate alerts from patterns
        const alerts = await generateAlertsFromPatterns(userId, result.patterns, env);

        return new Response(JSON.stringify({
          success: true,
          patterns: result.patterns,
          alertsGenerated: alerts.length,
          message: result.patterns.length > 0
            ? `Detected ${result.patterns.length} pattern(s)`
            : 'No harmful patterns detected'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to detect patterns',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get score history
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/score-history$/,
    handler: async (request, env, userId) => {
      try {
        const events = await env.DB.prepare(`
          SELECT * FROM psychology_events
          WHERE user_id = ?
          AND event_type = 'score_change'
          ORDER BY created_at DESC
          LIMIT 30
        `).bind(userId).all();

        const history = events.results.map(e => {
          const data = JSON.parse(e.event_data);
          return {
            date: e.created_at,
            score: data.new_score,
            change: e.impact_score,
            components: data.components
          };
        });

        return new Response(JSON.stringify({
          success: true,
          history
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch score history',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Create/Update trading rule
  routes.push({
    method: 'POST',
    pattern: /^\/api\/psychology\/rules$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        const { rule_name, rule_type, rule_value, enforcement_level } = body;

        if (!rule_name || !rule_type || !rule_value) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: rule_name, rule_type, rule_value'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await env.DB.prepare(`
          INSERT INTO trading_rules (
            user_id,
            rule_name,
            rule_type,
            rule_value,
            enforcement_level
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          userId,
          rule_name,
          rule_type,
          JSON.stringify(rule_value),
          enforcement_level || 'warning'
        ).run();

        return new Response(JSON.stringify({
          success: true,
          ruleId: result.meta.last_row_id,
          message: 'Trading rule created'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to create rule',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get trading rules
  routes.push({
    method: 'GET',
    pattern: /^\/api\/psychology\/rules$/,
    handler: async (request, env, userId) => {
      try {
        const rules = await env.DB.prepare(`
          SELECT * FROM trading_rules
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify({
          success: true,
          rules: rules.results
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch rules',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Delete trading rule
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/psychology\/rules\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const ruleId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM trading_rules
          WHERE id = ? AND user_id = ?
        `).bind(ruleId, userId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Trading rule deleted'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to delete rule',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });
}
