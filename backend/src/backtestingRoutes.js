// Backtesting System API Routes
// All routes require authentication and follow existing security patterns

import { runBacktest } from './backtestEngine.js';
import {
  fetchFromSources,
  validateData,
  fillGaps,
  mergeDataSources,
  getRateLimitStatus
} from './dataSourceService.js';

/**
 * Register all backtesting routes
 * @param {Array} routes - Routes array to populate
 * @param {Function} requireAuth - Auth middleware
 * @param {Function} jsonResponse - JSON response helper
 */
export function registerBacktestingRoutes(routes, requireAuth, jsonResponse) {

  // ============================================
  // HISTORICAL DATA ENDPOINTS
  // ============================================

  // POST /api/backtest/data/upload - Upload CSV data
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/data\/upload$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const formData = await request.formData();
        const file = formData.get('file');
        const symbol = formData.get('symbol');
        const timeframe = formData.get('timeframe');

        if (!file || !symbol || !timeframe) {
          return jsonResponse({ error: 'File, symbol, and timeframe are required' }, 400);
        }

        // Read CSV file
        const csvText = await file.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Parse header
        const header = lines[0].toLowerCase().split(',');
        const requiredColumns = ['timestamp', 'open', 'high', 'low', 'close'];
        const hasRequired = requiredColumns.every(col => header.includes(col));

        if (!hasRequired) {
          return jsonResponse({
            error: 'CSV must contain: timestamp, open, high, low, close columns'
          }, 400);
        }

        // Create upload record
        const uploadResult = await env.DB.prepare(`
          INSERT INTO data_uploads (user_id, symbol, timeframe, data_source, status, total_bars)
          VALUES (?, ?, ?, 'csv', 'processing', ?)
        `).bind(authResult.user.id, symbol, timeframe, lines.length - 1).run();

        const uploadId = uploadResult.meta.last_row_id;

        // Parse and insert data
        let insertedCount = 0;
        let errors = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length < requiredColumns.length) continue;

          try {
            const row = {};
            header.forEach((col, idx) => {
              row[col.trim()] = values[idx].trim();
            });

            await env.DB.prepare(`
              INSERT OR IGNORE INTO historical_data
              (user_id, symbol, timeframe, timestamp, open, high, low, close, volume, spread, data_source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv')
            `).bind(
              authResult.user.id,
              symbol,
              timeframe,
              row.timestamp || row.date || row.time,
              parseFloat(row.open),
              parseFloat(row.high),
              parseFloat(row.low),
              parseFloat(row.close),
              parseFloat(row.volume || 0),
              parseFloat(row.spread || 0)
            ).run();

            insertedCount++;
          } catch (error) {
            errors.push(`Line ${i}: ${error.message}`);
          }
        }

        // Update upload status
        await env.DB.prepare(`
          UPDATE data_uploads
          SET status = ?,
              completed_at = CURRENT_TIMESTAMP,
              error_message = ?,
              start_date = (SELECT MIN(timestamp) FROM historical_data WHERE user_id = ? AND symbol = ? AND timeframe = ?),
              end_date = (SELECT MAX(timestamp) FROM historical_data WHERE user_id = ? AND symbol = ? AND timeframe = ?)
          WHERE id = ?
        `).bind(
          errors.length > 0 ? 'completed_with_errors' : 'completed',
          errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
          authResult.user.id, symbol, timeframe,
          authResult.user.id, symbol, timeframe,
          uploadId
        ).run();

        return jsonResponse({
          success: true,
          upload_id: uploadId,
          inserted: insertedCount,
          errors: errors.length,
          error_messages: errors.slice(0, 10)
        });
      } catch (error) {
        console.error('Data upload error:', error);
        return jsonResponse({ error: 'Data upload failed', details: error.message }, 500);
      }
    }
  });

  // GET /api/backtest/data - Get available historical data
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/data$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT
            symbol,
            timeframe,
            MIN(timestamp) as start_date,
            MAX(timestamp) as end_date,
            COUNT(*) as total_bars,
            data_source
          FROM historical_data
          WHERE user_id = ?
          GROUP BY symbol, timeframe, data_source
          ORDER BY symbol, timeframe
        `).bind(authResult.user.id).all();

        return jsonResponse({ data: result.results || [] });
      } catch (error) {
        console.error('Data fetch error:', error);
        return jsonResponse({ error: 'Failed to fetch data', details: error.message }, 500);
      }
    }
  });

  // DELETE /api/backtest/data/:symbol/:timeframe - Delete historical data
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/data\/([^\/]+)\/([^\/]+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const symbol = decodeURIComponent(matches[1]);
        const timeframe = decodeURIComponent(matches[2]);

        await env.DB.prepare(`
          DELETE FROM historical_data
          WHERE user_id = ? AND symbol = ? AND timeframe = ?
        `).bind(authResult.user.id, symbol, timeframe).run();

        return jsonResponse({ success: true, message: 'Data deleted successfully' });
      } catch (error) {
        console.error('Data delete error:', error);
        return jsonResponse({ error: 'Failed to delete data', details: error.message }, 500);
      }
    }
  });

  // POST /api/backtest/data/fetch - Fetch data from external APIs
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/data\/fetch$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const body = await request.json();

        // Validate required fields
        if (!body.symbol || !body.timeframe || !body.startDate || !body.endDate) {
          return jsonResponse({
            error: 'symbol, timeframe, startDate, and endDate are required'
          }, 400);
        }

        if (!body.sources || !Array.isArray(body.sources) || body.sources.length === 0) {
          return jsonResponse({
            error: 'At least one data source must be specified'
          }, 400);
        }

        // Create fetch job
        const jobResult = await env.DB.prepare(`
          INSERT INTO data_fetch_jobs (
            user_id, symbol, timeframe, start_date, end_date,
            sources, merge_strategy, fill_gaps, validate_data,
            api_keys, status, current_step
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', 'Fetching data from sources')
        `).bind(
          authResult.user.id,
          body.symbol.toUpperCase(),
          body.timeframe.toUpperCase(),
          body.startDate,
          body.endDate,
          JSON.stringify(body.sources),
          body.mergeStrategy || 'prefer-newest',
          body.fillGaps !== undefined ? body.fillGaps : 1,
          body.validateData !== undefined ? body.validateData : 1,
          body.apiKeys ? JSON.stringify(body.apiKeys) : null
        ).run();

        const jobId = jobResult.meta.last_row_id;

        // Load stored API keys from database for the user
        const storedKeys = await env.DB.prepare(`
          SELECT provider, api_key
          FROM api_keys
          WHERE user_id = ?
        `).bind(authResult.user.id).all();

        // Merge stored keys with any keys provided in request (request keys take precedence)
        const apiKeys = { ...(body.apiKeys || {}) };
        for (const key of storedKeys.results || []) {
          if (!apiKeys[key.provider]) {
            apiKeys[key.provider] = key.api_key;
          }
        }

        // Fetch data from sources
        let fetchResult;
        try {
          fetchResult = await fetchFromSources(
            body.sources,
            body.symbol,
            body.timeframe,
            body.startDate,
            body.endDate,
            apiKeys
          );
        } catch (error) {
          // Update job with error
          await env.DB.prepare(`
            UPDATE data_fetch_jobs
            SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(error.message, jobId).run();

          // Log API usage
          await env.DB.prepare(`
            INSERT INTO api_usage (user_id, provider, symbol, timeframe, status, error_message)
            VALUES (?, ?, ?, ?, 'error', ?)
          `).bind(authResult.user.id, body.sources[0], body.symbol, body.timeframe, error.message).run();

          return jsonResponse({ error: error.message }, 500);
        }

        let data = fetchResult.data;
        let gapsFilled = 0;
        let validationResult = null;

        // Fill gaps if requested
        if (body.fillGaps) {
          const fillResult = fillGaps(data, body.timeframe);
          data = fillResult.data;
          gapsFilled = fillResult.gapsFilled;

          await env.DB.prepare(`
            UPDATE data_fetch_jobs
            SET current_step = ?, gaps_filled = ?
            WHERE id = ?
          `).bind(`Filled ${gapsFilled} gaps`, gapsFilled, jobId).run();
        }

        // Validate data if requested
        if (body.validateData) {
          validationResult = validateData(data);

          await env.DB.prepare(`
            UPDATE data_fetch_jobs
            SET current_step = ?, validation_issues = ?
            WHERE id = ?
          `).bind(
            `Validated data: ${validationResult.valid}/${validationResult.total} valid`,
            validationResult.invalid,
            jobId
          ).run();
        }

        // Create or update dataset record
        const datasetName = body.datasetName || `${body.symbol} ${body.timeframe} - ${new Date().toLocaleDateString()}`;

        const datasetResult = await env.DB.prepare(`
          INSERT INTO datasets (
            user_id, name, symbol, timeframe, data_source,
            fetch_config, total_candles, start_date, end_date,
            gaps_filled, validation_issues
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          authResult.user.id,
          datasetName,
          body.symbol.toUpperCase(),
          body.timeframe.toUpperCase(),
          fetchResult.source,
          JSON.stringify({
            sources: body.sources,
            apiKeys: body.apiKeys ? Object.keys(body.apiKeys) : [],
            mergeStrategy: body.mergeStrategy,
            fillGaps: body.fillGaps,
            validateData: body.validateData
          }),
          data.length,
          data[0].timestamp,
          data[data.length - 1].timestamp,
          gapsFilled,
          validationResult?.invalid || 0
        ).run();

        const datasetId = datasetResult.meta.last_row_id;

        // Insert candles into historical_data table
        await env.DB.prepare(`
          UPDATE data_fetch_jobs
          SET current_step = 'Inserting candles into database'
          WHERE id = ?
        `).bind(jobId).run();

        let inserted = 0;
        for (const candle of data) {
          try {
            await env.DB.prepare(`
              INSERT OR IGNORE INTO historical_data (
                user_id, symbol, timeframe, timestamp,
                open, high, low, close, volume,
                data_source, fetch_source, is_gap_filled
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'api', ?, ?)
            `).bind(
              authResult.user.id,
              body.symbol.toUpperCase(),
              body.timeframe.toUpperCase(),
              candle.timestamp,
              candle.open,
              candle.high,
              candle.low,
              candle.close,
              candle.volume || 0,
              candle.source || fetchResult.source,
              candle.filled ? 1 : 0
            ).run();
            inserted++;
          } catch (error) {
            console.error('Error inserting candle:', error);
          }
        }

        // Update job as completed
        await env.DB.prepare(`
          UPDATE data_fetch_jobs
          SET status = 'completed',
              dataset_id = ?,
              candles_fetched = ?,
              gaps_filled = ?,
              validation_issues = ?,
              primary_source = ?,
              sources_used = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          datasetId,
          inserted,
          gapsFilled,
          validationResult?.invalid || 0,
          fetchResult.source,
          JSON.stringify([fetchResult.source]),
          jobId
        ).run();

        // Log successful API usage
        await env.DB.prepare(`
          INSERT INTO api_usage (
            user_id, provider, symbol, timeframe,
            status, candles_fetched, requested_at
          ) VALUES (?, ?, ?, ?, 'success', ?, CURRENT_TIMESTAMP)
        `).bind(
          authResult.user.id,
          fetchResult.source,
          body.symbol,
          body.timeframe,
          inserted
        ).run();

        // Create data quality report
        if (validationResult) {
          await env.DB.prepare(`
            INSERT INTO data_quality_reports (
              dataset_id, user_id, total_candles, valid_candles, invalid_candles,
              gap_filled_candles, ohlc_errors, coverage_percent, issues
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            datasetId,
            authResult.user.id,
            validationResult.total,
            validationResult.valid,
            validationResult.invalid,
            gapsFilled,
            validationResult.invalid,
            (validationResult.valid / validationResult.total * 100).toFixed(2),
            JSON.stringify(validationResult.issues.slice(0, 100)) // Limit to first 100 issues
          ).run();
        }

        return jsonResponse({
          success: true,
          jobId,
          datasetId,
          source: fetchResult.source,
          candles: inserted,
          dateRange: {
            start: data[0].timestamp,
            end: data[data.length - 1].timestamp
          },
          gapsFilled,
          validationIssues: validationResult?.invalid || 0,
          message: `Successfully fetched ${inserted} candles from ${fetchResult.source}`
        });
      } catch (error) {
        console.error('Data fetch error:', error);
        return jsonResponse({
          error: 'Data fetch failed',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/data/sources/status - Check data source availability
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/data\/sources\/status$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const status = getRateLimitStatus();

        // Get user's API keys
        const apiKeys = await env.DB.prepare(`
          SELECT provider, tier, is_active, daily_limit, last_used
          FROM api_keys
          WHERE user_id = ? AND is_active = 1
        `).bind(authResult.user.id).all();

        // Enhance status with user's API key info
        for (const key of apiKeys.results || []) {
          const provider = key.provider;
          if (status[provider]) {
            status[provider].hasApiKey = true;
            status[provider].tier = key.tier;
            status[provider].dailyLimit = key.daily_limit || status[provider].dailyLimit;
          }
        }

        return jsonResponse(status);
      } catch (error) {
        console.error('Status check error:', error);
        return jsonResponse({
          error: 'Failed to check source status',
          details: error.message
        }, 500);
      }
    }
  });

  // POST /api/backtest/data/schedule-update - Schedule automatic data updates
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/data\/schedule-update$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const body = await request.json();

        if (!body.datasetId || !body.frequency) {
          return jsonResponse({
            error: 'datasetId and frequency are required'
          }, 400);
        }

        // Verify dataset ownership
        const dataset = await env.DB.prepare(`
          SELECT id, symbol, timeframe, fetch_config
          FROM datasets
          WHERE id = ? AND user_id = ?
        `).bind(body.datasetId, authResult.user.id).first();

        if (!dataset) {
          return jsonResponse({ error: 'Dataset not found' }, 404);
        }

        // Calculate next run time
        const now = new Date();
        const time = body.time || '00:00';
        const [hours, minutes] = time.split(':');
        const nextRun = new Date(now);
        nextRun.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        // Create or update scheduled update
        const result = await env.DB.prepare(`
          INSERT INTO scheduled_updates (
            dataset_id, user_id, frequency, time_utc,
            fetch_config, is_active, next_run
          ) VALUES (?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT(dataset_id) DO UPDATE SET
            frequency = excluded.frequency,
            time_utc = excluded.time_utc,
            is_active = 1,
            next_run = excluded.next_run,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          body.datasetId,
          authResult.user.id,
          body.frequency,
          time,
          dataset.fetch_config,
          nextRun.toISOString()
        ).run();

        // Update dataset
        await env.DB.prepare(`
          UPDATE datasets
          SET auto_update = 1,
              update_frequency = ?,
              update_time = ?,
              next_update = ?
          WHERE id = ?
        `).bind(body.frequency, time, nextRun.toISOString(), body.datasetId).run();

        return jsonResponse({
          success: true,
          message: `Scheduled ${body.frequency} updates at ${time} UTC`,
          nextUpdate: nextRun.toISOString()
        });
      } catch (error) {
        console.error('Schedule update error:', error);
        return jsonResponse({
          error: 'Failed to schedule update',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/data/datasets - Get user's datasets
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/data\/datasets$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT * FROM dataset_overview
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(authResult.user.id).all();

        return jsonResponse({ datasets: result.results || [] });
      } catch (error) {
        console.error('Datasets fetch error:', error);
        return jsonResponse({
          error: 'Failed to fetch datasets',
          details: error.message
        }, 500);
      }
    }
  });

  // DELETE /api/backtest/data/datasets/:id - Delete dataset
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/data\/datasets\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const datasetId = parseInt(matches[1]);

        // Verify ownership
        const dataset = await env.DB.prepare(`
          SELECT id, symbol, timeframe FROM datasets
          WHERE id = ? AND user_id = ?
        `).bind(datasetId, authResult.user.id).first();

        if (!dataset) {
          return jsonResponse({ error: 'Dataset not found' }, 404);
        }

        // Delete dataset (will cascade to related tables)
        await env.DB.prepare(`
          DELETE FROM datasets WHERE id = ?
        `).bind(datasetId).run();

        // Also delete associated historical_data
        await env.DB.prepare(`
          DELETE FROM historical_data
          WHERE user_id = ? AND symbol = ? AND timeframe = ?
        `).bind(authResult.user.id, dataset.symbol, dataset.timeframe).run();

        return jsonResponse({
          success: true,
          message: 'Dataset deleted successfully'
        });
      } catch (error) {
        console.error('Dataset delete error:', error);
        return jsonResponse({
          error: 'Failed to delete dataset',
          details: error.message
        }, 500);
      }
    }
  });

  // POST /api/backtest/api-keys - Save API key
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/api-keys$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const body = await request.json();

        if (!body.provider || !body.apiKey) {
          return jsonResponse({
            error: 'provider and apiKey are required'
          }, 400);
        }

        // TODO: In production, encrypt the API key before storing
        const result = await env.DB.prepare(`
          INSERT INTO api_keys (
            user_id, provider, api_key, key_name, tier, is_active
          ) VALUES (?, ?, ?, ?, ?, 1)
          ON CONFLICT(user_id, provider, key_name) DO UPDATE SET
            api_key = excluded.api_key,
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          authResult.user.id,
          body.provider.toLowerCase(),
          body.apiKey, // Should be encrypted in production
          body.keyName || 'Default',
          body.tier || 'free'
        ).run();

        return jsonResponse({
          success: true,
          message: `${body.provider} API key saved successfully`
        });
      } catch (error) {
        console.error('API key save error:', error);
        return jsonResponse({
          error: 'Failed to save API key',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/api-keys - Get user's API keys
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/api-keys$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT
            id, provider, key_name, tier, is_active,
            last_used, created_at,
            SUBSTR(api_key, 1, 8) || '...' as api_key_preview
          FROM api_keys
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(authResult.user.id).all();

        return jsonResponse({ apiKeys: result.results || [] });
      } catch (error) {
        console.error('API keys fetch error:', error);
        return jsonResponse({
          error: 'Failed to fetch API keys',
          details: error.message
        }, 500);
      }
    }
  });

  // DELETE /api/backtest/api-keys/:id - Delete API key
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/api-keys\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const keyId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM api_keys
          WHERE id = ? AND user_id = ?
        `).bind(keyId, authResult.user.id).run();

        return jsonResponse({
          success: true,
          message: 'API key deleted successfully'
        });
      } catch (error) {
        console.error('API key delete error:', error);
        return jsonResponse({
          error: 'Failed to delete API key',
          details: error.message
        }, 500);
      }
    }
  });

  // ============================================
  // STRATEGY ENDPOINTS
  // ============================================

  // POST /api/backtest/strategies - Create strategy
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/strategies$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.strategy_type) {
          return jsonResponse({ error: 'Name and strategy_type are required' }, 400);
        }

        // Validate strategy type
        if (!['indicator', 'rules', 'custom'].includes(body.strategy_type)) {
          return jsonResponse({ error: 'Invalid strategy_type' }, 400);
        }

        const result = await env.DB.prepare(`
          INSERT INTO strategies (
            user_id, name, description, strategy_type,
            indicator_config, rules_config, custom_code,
            entry_conditions, exit_conditions,
            stop_loss_type, stop_loss_value,
            take_profit_type, take_profit_value,
            trailing_stop_enabled, trailing_stop_distance,
            position_size_type, position_size_value, max_risk_per_trade,
            tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          authResult.user.id,
          body.name,
          body.description || null,
          body.strategy_type,
          body.indicator_config ? JSON.stringify(body.indicator_config) : null,
          body.rules_config ? JSON.stringify(body.rules_config) : null,
          body.custom_code || null,
          body.entry_conditions ? JSON.stringify(body.entry_conditions) : null,
          body.exit_conditions ? JSON.stringify(body.exit_conditions) : null,
          body.stop_loss_type || 'fixed',
          body.stop_loss_value || null,
          body.take_profit_type || 'fixed',
          body.take_profit_value || null,
          body.trailing_stop_enabled || 0,
          body.trailing_stop_distance || null,
          body.position_size_type || 'fixed',
          body.position_size_value || 0.01,
          body.max_risk_per_trade || 1.0,
          body.tags ? JSON.stringify(body.tags) : null
        ).run();

        return jsonResponse({
          success: true,
          id: result.meta.last_row_id
        }, 201);
      } catch (error) {
        console.error('Strategy creation error:', error);
        return jsonResponse({ error: 'Failed to create strategy', details: error.message }, 500);
      }
    }
  });

  // GET /api/backtest/strategies - List strategies
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/strategies$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT * FROM strategies
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(authResult.user.id).all();

        // Parse JSON fields
        const strategies = (result.results || []).map(s => ({
          ...s,
          indicator_config: s.indicator_config ? JSON.parse(s.indicator_config) : null,
          rules_config: s.rules_config ? JSON.parse(s.rules_config) : null,
          entry_conditions: s.entry_conditions ? JSON.parse(s.entry_conditions) : null,
          exit_conditions: s.exit_conditions ? JSON.parse(s.exit_conditions) : null,
          tags: s.tags ? JSON.parse(s.tags) : null
        }));

        return jsonResponse({ strategies });
      } catch (error) {
        console.error('Strategy fetch error:', error);
        return jsonResponse({ error: 'Failed to fetch strategies', details: error.message }, 500);
      }
    }
  });

  // GET /api/backtest/strategies/:id - Get single strategy
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/strategies\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const strategyId = parseInt(matches[1]);

        const result = await env.DB.prepare(`
          SELECT * FROM strategies
          WHERE id = ? AND user_id = ?
        `).bind(strategyId, authResult.user.id).first();

        if (!result) {
          return jsonResponse({ error: 'Strategy not found' }, 404);
        }

        // Parse JSON fields
        const strategy = {
          ...result,
          indicator_config: result.indicator_config ? JSON.parse(result.indicator_config) : null,
          rules_config: result.rules_config ? JSON.parse(result.rules_config) : null,
          entry_conditions: result.entry_conditions ? JSON.parse(result.entry_conditions) : null,
          exit_conditions: result.exit_conditions ? JSON.parse(result.exit_conditions) : null,
          tags: result.tags ? JSON.parse(result.tags) : null
        };

        return jsonResponse({ strategy });
      } catch (error) {
        console.error('Strategy fetch error:', error);
        return jsonResponse({ error: 'Failed to fetch strategy', details: error.message }, 500);
      }
    }
  });

  // PUT /api/backtest/strategies/:id - Update strategy
  routes.push({
    method: 'PUT',
    pattern: /^\/api\/backtest\/strategies\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const strategyId = parseInt(matches[1]);
        const body = await request.json();

        // Verify ownership
        const existing = await env.DB.prepare(`
          SELECT id FROM strategies WHERE id = ? AND user_id = ?
        `).bind(strategyId, authResult.user.id).first();

        if (!existing) {
          return jsonResponse({ error: 'Strategy not found' }, 404);
        }

        await env.DB.prepare(`
          UPDATE strategies
          SET name = ?,
              description = ?,
              indicator_config = ?,
              rules_config = ?,
              custom_code = ?,
              entry_conditions = ?,
              exit_conditions = ?,
              stop_loss_type = ?,
              stop_loss_value = ?,
              take_profit_type = ?,
              take_profit_value = ?,
              position_size_type = ?,
              position_size_value = ?,
              max_risk_per_trade = ?,
              tags = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          body.name,
          body.description || null,
          body.indicator_config ? JSON.stringify(body.indicator_config) : null,
          body.rules_config ? JSON.stringify(body.rules_config) : null,
          body.custom_code || null,
          body.entry_conditions ? JSON.stringify(body.entry_conditions) : null,
          body.exit_conditions ? JSON.stringify(body.exit_conditions) : null,
          body.stop_loss_type || 'fixed',
          body.stop_loss_value || null,
          body.take_profit_type || 'fixed',
          body.take_profit_value || null,
          body.position_size_type || 'fixed',
          body.position_size_value || 0.01,
          body.max_risk_per_trade || 1.0,
          body.tags ? JSON.stringify(body.tags) : null,
          strategyId
        ).run();

        return jsonResponse({ success: true, message: 'Strategy updated successfully' });
      } catch (error) {
        console.error('Strategy update error:', error);
        return jsonResponse({ error: 'Failed to update strategy', details: error.message }, 500);
      }
    }
  });

  // DELETE /api/backtest/strategies/:id - Delete strategy
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/strategies\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const strategyId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM strategies
          WHERE id = ? AND user_id = ?
        `).bind(strategyId, authResult.user.id).run();

        return jsonResponse({ success: true, message: 'Strategy deleted successfully' });
      } catch (error) {
        console.error('Strategy delete error:', error);
        return jsonResponse({ error: 'Failed to delete strategy', details: error.message }, 500);
      }
    }
  });

  // ============================================
  // BACKTEST EXECUTION ENDPOINTS
  // ============================================

  // POST /api/backtest/run - Run a backtest
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/run$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const body = await request.json();

        // Validate required fields
        if (!body.strategy_id || !body.symbol || !body.timeframe || !body.start_date || !body.end_date) {
          return jsonResponse({
            error: 'strategy_id, symbol, timeframe, start_date, and end_date are required'
          }, 400);
        }

        // Verify strategy ownership
        const strategy = await env.DB.prepare(`
          SELECT * FROM strategies WHERE id = ? AND user_id = ?
        `).bind(body.strategy_id, authResult.user.id).first();

        if (!strategy) {
          return jsonResponse({ error: 'Strategy not found' }, 404);
        }

        // Create backtest record
        const backtestResult = await env.DB.prepare(`
          INSERT INTO backtests (
            user_id, strategy_id, name, description,
            symbol, timeframe, start_date, end_date,
            initial_capital, account_currency, leverage,
            commission_per_lot, spread_pips, slippage_pips, use_realistic_fills,
            status, started_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', CURRENT_TIMESTAMP)
        `).bind(
          authResult.user.id,
          body.strategy_id,
          body.name || `Backtest ${new Date().toISOString()}`,
          body.description || null,
          body.symbol,
          body.timeframe,
          body.start_date,
          body.end_date,
          body.initial_capital || 10000,
          body.account_currency || 'USD',
          body.leverage || 100,
          body.commission_per_lot || 7.0,
          body.spread_pips || null,
          body.slippage_pips || 0.5,
          body.use_realistic_fills !== undefined ? body.use_realistic_fills : 1
        ).run();

        const backtestId = backtestResult.meta.last_row_id;

        // Run backtest
        const backtest = {
          id: backtestId,
          user_id: authResult.user.id,
          strategy_id: body.strategy_id,
          symbol: body.symbol,
          timeframe: body.timeframe,
          start_date: body.start_date,
          end_date: body.end_date,
          initial_capital: body.initial_capital || 10000,
          commission_per_lot: body.commission_per_lot || 7.0,
          spread_pips: body.spread_pips || null,
          slippage_pips: body.slippage_pips || 0.5,
          use_realistic_fills: body.use_realistic_fills !== undefined ? body.use_realistic_fills : 1
        };

        const { trades, metrics } = await runBacktest(backtest, strategy, env);

        // Save trades
        if (trades.length > 0) {
          for (const trade of trades) {
            await env.DB.prepare(`
              INSERT INTO backtest_trades (
                backtest_id, user_id, trade_number, symbol,
                entry_time, entry_price, entry_signal, entry_reason,
                exit_time, exit_price, exit_reason,
                lot_size, stop_loss_price, take_profit_price, risk_reward_ratio,
                profit_loss, profit_loss_pips, profit_loss_percent,
                commission, slippage, net_profit,
                duration_bars, duration_minutes,
                balance_before, balance_after, equity_before, equity_after,
                mae, mfe, is_winning_trade
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              backtestId, authResult.user.id, trade.trade_number, trade.symbol,
              trade.entry_time, trade.entry_price, trade.entry_signal, trade.entry_reason,
              trade.exit_time, trade.exit_price, trade.exit_reason,
              trade.lot_size, trade.stop_loss_price, trade.take_profit_price, trade.risk_reward_ratio,
              trade.profit_loss, trade.profit_loss_pips, trade.profit_loss_percent,
              trade.commission, trade.slippage, trade.net_profit,
              trade.duration_bars, trade.duration_minutes,
              trade.balance_before, trade.balance_after, trade.equity_before, trade.equity_after,
              trade.mae, trade.mfe, trade.is_winning_trade
            ).run();
          }
        }

        // Save metrics
        if (metrics) {
          await env.DB.prepare(`
            INSERT INTO backtest_results (
              backtest_id, user_id,
              total_trades, winning_trades, losing_trades, break_even_trades,
              win_rate, loss_rate,
              gross_profit, gross_loss, net_profit, total_commission, total_slippage,
              total_return, annual_return, monthly_return_avg,
              profit_factor, expectancy, expectancy_percent,
              avg_trade_profit, avg_trade_loss, avg_win, avg_loss, avg_trade_duration_minutes,
              largest_win, largest_loss, largest_win_pips, largest_loss_pips,
              max_consecutive_wins, max_consecutive_losses,
              max_drawdown, max_drawdown_percent, avg_drawdown,
              sharpe_ratio, sortino_ratio, calmar_ratio, recovery_factor, avg_r_multiple,
              trading_days, avg_trades_per_day, avg_trades_per_week, avg_trades_per_month,
              final_balance, final_equity, max_balance, min_balance,
              equity_curve, monthly_returns, drawdown_periods
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            backtestId, authResult.user.id,
            metrics.total_trades, metrics.winning_trades, metrics.losing_trades, metrics.break_even_trades,
            metrics.win_rate, metrics.loss_rate,
            metrics.gross_profit, metrics.gross_loss, metrics.net_profit, metrics.total_commission, metrics.total_slippage,
            metrics.total_return, metrics.annual_return, metrics.monthly_return_avg,
            metrics.profit_factor, metrics.expectancy, metrics.expectancy_percent,
            metrics.avg_trade_profit, metrics.avg_trade_loss, metrics.avg_win, metrics.avg_loss, metrics.avg_trade_duration_minutes,
            metrics.largest_win, metrics.largest_loss, metrics.largest_win_pips, metrics.largest_loss_pips,
            metrics.max_consecutive_wins, metrics.max_consecutive_losses,
            metrics.max_drawdown, metrics.max_drawdown_percent, metrics.avg_drawdown,
            metrics.sharpe_ratio, metrics.sortino_ratio, metrics.calmar_ratio, metrics.recovery_factor, metrics.avg_r_multiple,
            metrics.trading_days, metrics.avg_trades_per_day, metrics.avg_trades_per_week, metrics.avg_trades_per_month,
            metrics.final_balance, metrics.final_equity, metrics.max_balance, metrics.min_balance,
            metrics.equity_curve, metrics.monthly_returns, metrics.drawdown_periods
          ).run();
        }

        // Update backtest status
        await env.DB.prepare(`
          UPDATE backtests
          SET status = 'completed',
              completed_at = CURRENT_TIMESTAMP,
              bars_processed = ?,
              execution_time_ms = ?
          WHERE id = ?
        `).bind(metrics?.bars_processed || 0, metrics?.execution_time_ms || 0, backtestId).run();

        return jsonResponse({
          success: true,
          backtest_id: backtestId,
          trades: trades.length,
          metrics: metrics
        });
      } catch (error) {
        console.error('Backtest execution error:', error);

        // Update backtest with error
        if (error.backtestId) {
          await env.DB.prepare(`
            UPDATE backtests
            SET status = 'failed',
                error_message = ?,
                completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(error.message, error.backtestId).run();
        }

        return jsonResponse({ error: 'Backtest execution failed', details: error.message }, 500);
      }
    }
  });

  // GET /api/backtest/results - List backtests
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/results$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT * FROM backtest_summary
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 100
        `).bind(authResult.user.id).all();

        return jsonResponse({ backtests: result.results || [] });
      } catch (error) {
        console.error('Backtest fetch error:', error);
        return jsonResponse({ error: 'Failed to fetch backtests', details: error.message }, 500);
      }
    }
  });

  // GET /api/backtest/results/:id - Get backtest details
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/results\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const backtestId = parseInt(matches[1]);

        // Get backtest details
        const backtest = await env.DB.prepare(`
          SELECT b.*, s.name as strategy_name, s.strategy_type
          FROM backtests b
          LEFT JOIN strategies s ON b.strategy_id = s.id
          WHERE b.id = ? AND b.user_id = ?
        `).bind(backtestId, authResult.user.id).first();

        if (!backtest) {
          return jsonResponse({ error: 'Backtest not found' }, 404);
        }

        // Get metrics
        const metrics = await env.DB.prepare(`
          SELECT * FROM backtest_results WHERE backtest_id = ?
        `).bind(backtestId).first();

        // Parse JSON fields
        if (metrics) {
          metrics.equity_curve = metrics.equity_curve ? JSON.parse(metrics.equity_curve) : [];
          metrics.monthly_returns = metrics.monthly_returns ? JSON.parse(metrics.monthly_returns) : [];
          metrics.drawdown_periods = metrics.drawdown_periods ? JSON.parse(metrics.drawdown_periods) : [];
        }

        // Get trades
        const tradesResult = await env.DB.prepare(`
          SELECT * FROM backtest_trades
          WHERE backtest_id = ?
          ORDER BY entry_time ASC
        `).bind(backtestId).all();

        return jsonResponse({
          backtest,
          metrics,
          trades: tradesResult.results || []
        });
      } catch (error) {
        console.error('Backtest details fetch error:', error);
        return jsonResponse({ error: 'Failed to fetch backtest details', details: error.message }, 500);
      }
    }
  });

  // DELETE /api/backtest/results/:id - Delete backtest
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/results\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const backtestId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM backtests
          WHERE id = ? AND user_id = ?
        `).bind(backtestId, authResult.user.id).run();

        return jsonResponse({ success: true, message: 'Backtest deleted successfully' });
      } catch (error) {
        console.error('Backtest delete error:', error);
        return jsonResponse({ error: 'Failed to delete backtest', details: error.message }, 500);
      }
    }
  });

  // ============================================
  // EXPERT ADVISOR (EA) ENDPOINTS
  // ============================================

  // POST /api/backtest/ea/upload - Upload and parse MQL5 EA
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/ea\/upload$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const formData = await request.formData();
        const file = formData.get('file');
        const name = formData.get('name');
        const description = formData.get('description') || '';

        if (!file || !name) {
          return jsonResponse({ error: 'File and name are required' }, 400);
        }

        // Read MQL5 code
        const mql5Code = await file.text();
        const fileSize = mql5Code.length;

        // Import parser and transpiler dynamically
        const { Lexer } = await import('./mql5/lexer.js');
        const { Parser } = await import('./mql5/parser.js');
        const { Transpiler } = await import('./mql5/transpiler.js');

        let transpiledCode = null;
        let parameters = [];
        let parseErrors = [];
        let status = 'active';

        try {
          // Tokenize
          const lexer = new Lexer(mql5Code);
          const tokens = lexer.tokenize();

          // Parse to AST
          const parser = new Parser(tokens);
          const ast = parser.parseProgram();

          // Transpile to JavaScript
          const transpiler = new Transpiler(ast);
          transpiledCode = transpiler.transpile();

          // Extract input parameters metadata
          parameters = transpiler.extractInputParametersMetadata(ast);

        } catch (error) {
          console.error('EA parse/transpile error:', error);
          parseErrors.push({
            type: 'parse_error',
            message: error.message,
            stack: error.stack
          });
          status = 'error';
        }

        // Save to database
        const result = await env.DB.prepare(`
          INSERT INTO expert_advisors
          (user_id, name, description, original_code, transpiled_code, parameters, file_size, parse_errors, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          authResult.user.id,
          name,
          description,
          mql5Code,
          transpiledCode,
          JSON.stringify(parameters),
          fileSize,
          JSON.stringify(parseErrors),
          status
        ).run();

        const eaId = result.meta.last_row_id;

        return jsonResponse({
          success: true,
          eaId,
          name,
          status,
          parameters,
          parseErrors: parseErrors.length > 0 ? parseErrors : null,
          hasTranspiledCode: transpiledCode !== null
        }, status === 'error' ? 400 : 201);

      } catch (error) {
        console.error('EA upload error:', error);
        return jsonResponse({
          error: 'Failed to upload EA',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/ea/list - List user's EAs
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/ea\/list$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const result = await env.DB.prepare(`
          SELECT
            id,
            name,
            description,
            version,
            parameters,
            file_size,
            status,
            parse_errors,
            uploaded_at,
            updated_at
          FROM expert_advisors
          WHERE user_id = ?
          ORDER BY uploaded_at DESC
        `).bind(authResult.user.id).all();

        const eas = result.results.map(ea => ({
          ...ea,
          parameters: JSON.parse(ea.parameters || '[]'),
          parse_errors: JSON.parse(ea.parse_errors || '[]'),
          file_size_kb: (ea.file_size / 1024).toFixed(2)
        }));

        return jsonResponse({ success: true, eas });

      } catch (error) {
        console.error('EA list error:', error);
        return jsonResponse({
          error: 'Failed to fetch EAs',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/ea/:id - Get specific EA details
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/ea\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const eaId = parseInt(matches[1]);

        const ea = await env.DB.prepare(`
          SELECT
            id,
            name,
            description,
            version,
            parameters,
            original_code,
            transpiled_code,
            file_size,
            status,
            parse_errors,
            uploaded_at,
            updated_at
          FROM expert_advisors
          WHERE id = ? AND user_id = ?
        `).bind(eaId, authResult.user.id).first();

        if (!ea) {
          return jsonResponse({ error: 'EA not found' }, 404);
        }

        return jsonResponse({
          success: true,
          ea: {
            ...ea,
            parameters: JSON.parse(ea.parameters || '[]'),
            parse_errors: JSON.parse(ea.parse_errors || '[]'),
            file_size_kb: (ea.file_size / 1024).toFixed(2)
          }
        });

      } catch (error) {
        console.error('EA fetch error:', error);
        return jsonResponse({
          error: 'Failed to fetch EA',
          details: error.message
        }, 500);
      }
    }
  });

  // DELETE /api/backtest/ea/:id - Delete EA
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/ea\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const eaId = parseInt(matches[1]);

        // Delete EA (will cascade delete backtests)
        await env.DB.prepare(`
          DELETE FROM expert_advisors
          WHERE id = ? AND user_id = ?
        `).bind(eaId, authResult.user.id).run();

        return jsonResponse({
          success: true,
          message: 'EA deleted successfully'
        });

      } catch (error) {
        console.error('EA delete error:', error);
        return jsonResponse({
          error: 'Failed to delete EA',
          details: error.message
        }, 500);
      }
    }
  });

  // POST /api/backtest/ea/run - Run EA backtest
  routes.push({
    method: 'POST',
    pattern: /^\/api\/backtest\/ea\/run$/,
    handler: async (request, env) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const {
          eaId,
          datasetId,
          parameters = {},
          config = {}
        } = await request.json();

        if (!eaId || !datasetId) {
          return jsonResponse({
            error: 'EA ID and dataset ID are required'
          }, 400);
        }

        // Get EA code
        const ea = await env.DB.prepare(`
          SELECT id, name, transpiled_code, status
          FROM expert_advisors
          WHERE id = ? AND user_id = ?
        `).bind(eaId, authResult.user.id).first();

        if (!ea) {
          return jsonResponse({ error: 'EA not found' }, 404);
        }

        if (ea.status === 'error' || !ea.transpiled_code) {
          return jsonResponse({
            error: 'EA has parse errors and cannot be executed'
          }, 400);
        }

        // Get dataset info
        const dataset = await env.DB.prepare(`
          SELECT id, name, symbol, timeframe
          FROM datasets
          WHERE id = ? AND user_id = ?
        `).bind(datasetId, authResult.user.id).first();

        if (!dataset) {
          return jsonResponse({ error: 'Dataset not found' }, 404);
        }

        // Get historical data
        const dataResult = await env.DB.prepare(`
          SELECT timestamp, open, high, low, close, volume
          FROM historical_data
          WHERE dataset_id = ?
          ORDER BY timestamp ASC
        `).bind(datasetId).all();

        if (dataResult.results.length === 0) {
          return jsonResponse({
            error: 'No historical data found for this dataset'
          }, 400);
        }

        // Create backtest record
        const backtestResult = await env.DB.prepare(`
          INSERT INTO ea_backtests
          (ea_id, user_id, dataset_id, parameters, config, status)
          VALUES (?, ?, ?, ?, ?, 'running')
        `).bind(
          eaId,
          authResult.user.id,
          datasetId,
          JSON.stringify(parameters),
          JSON.stringify(config)
        ).run();

        const backtestId = backtestResult.meta.last_row_id;

        try {
          // Import EA Runner
          const { EARunner } = await import('./mql5/eaRunner.js');

          // Run backtest
          const backtestConfig = {
            initialBalance: config.initialBalance || 10000,
            symbol: dataset.symbol || config.symbol || 'EURUSD',
            timeframe: dataset.timeframe || config.timeframe || 'H1',
            spread: config.spread || null,
            commission: config.commission || 7
          };

          const runner = new EARunner(
            ea.transpiled_code,
            dataResult.results,
            parameters,
            backtestConfig
          );

          const runResult = await runner.run();

          if (!runResult.success) {
            throw new Error(runResult.error || 'Backtest execution failed');
          }

          // Update backtest with results
          await env.DB.prepare(`
            UPDATE ea_backtests
            SET
              results = ?,
              logs = ?,
              status = 'completed',
              completed_at = datetime('now')
            WHERE id = ?
          `).bind(
            JSON.stringify(runResult.results),
            JSON.stringify(runResult.logs || []),
            backtestId
          ).run();

          // Save metrics for quick comparison
          const metrics = runResult.results;
          await env.DB.prepare(`
            INSERT INTO ea_backtest_metrics
            (backtest_id, net_profit, total_return, profit_factor, sharpe_ratio,
             max_drawdown, win_rate, total_trades, avg_trade, expectancy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            backtestId,
            metrics.netProfit || 0,
            metrics.totalReturn || 0,
            metrics.profitFactor || 0,
            metrics.sharpeRatio || 0,
            metrics.maxDrawdownPercent || 0,
            metrics.winRate || 0,
            metrics.totalTrades || 0,
            metrics.avgTrade || 0,
            metrics.expectancy || 0
          ).run();

          return jsonResponse({
            success: true,
            backtestId,
            results: runResult.results,
            logs: runResult.logs
          });

        } catch (error) {
          console.error('EA execution error:', error);

          // Update backtest with error
          await env.DB.prepare(`
            UPDATE ea_backtests
            SET
              status = 'failed',
              error_message = ?,
              completed_at = datetime('now')
            WHERE id = ?
          `).bind(error.message, backtestId).run();

          return jsonResponse({
            success: false,
            backtestId,
            error: 'Backtest execution failed',
            details: error.message
          }, 500);
        }

      } catch (error) {
        console.error('EA backtest error:', error);
        return jsonResponse({
          error: 'Failed to run EA backtest',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/ea/:eaId/backtests - List backtests for an EA
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/ea\/(\d+)\/backtests$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const eaId = parseInt(matches[1]);

        const result = await env.DB.prepare(`
          SELECT
            b.id,
            b.ea_id,
            b.dataset_id,
            b.parameters,
            b.config,
            b.status,
            b.error_message,
            b.started_at,
            b.completed_at,
            d.name as dataset_name,
            d.symbol,
            d.timeframe,
            m.net_profit,
            m.total_return,
            m.profit_factor,
            m.sharpe_ratio,
            m.max_drawdown,
            m.win_rate,
            m.total_trades
          FROM ea_backtests b
          LEFT JOIN datasets d ON b.dataset_id = d.id
          LEFT JOIN ea_backtest_metrics m ON b.id = m.backtest_id
          WHERE b.ea_id = ? AND b.user_id = ?
          ORDER BY b.started_at DESC
        `).bind(eaId, authResult.user.id).all();

        const backtests = result.results.map(bt => ({
          ...bt,
          parameters: JSON.parse(bt.parameters || '{}'),
          config: JSON.parse(bt.config || '{}')
        }));

        return jsonResponse({ success: true, backtests });

      } catch (error) {
        console.error('EA backtests list error:', error);
        return jsonResponse({
          error: 'Failed to fetch backtests',
          details: error.message
        }, 500);
      }
    }
  });

  // GET /api/backtest/ea/backtest/:id - Get specific backtest results
  routes.push({
    method: 'GET',
    pattern: /^\/api\/backtest\/ea\/backtest\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const backtestId = parseInt(matches[1]);

        const backtest = await env.DB.prepare(`
          SELECT
            b.*,
            e.name as ea_name,
            d.name as dataset_name,
            d.symbol,
            d.timeframe
          FROM ea_backtests b
          LEFT JOIN expert_advisors e ON b.ea_id = e.id
          LEFT JOIN datasets d ON b.dataset_id = d.id
          WHERE b.id = ? AND b.user_id = ?
        `).bind(backtestId, authResult.user.id).first();

        if (!backtest) {
          return jsonResponse({ error: 'Backtest not found' }, 404);
        }

        return jsonResponse({
          success: true,
          backtest: {
            ...backtest,
            parameters: JSON.parse(backtest.parameters || '{}'),
            config: JSON.parse(backtest.config || '{}'),
            results: JSON.parse(backtest.results || '{}'),
            logs: JSON.parse(backtest.logs || '[]')
          }
        });

      } catch (error) {
        console.error('EA backtest fetch error:', error);
        return jsonResponse({
          error: 'Failed to fetch backtest',
          details: error.message
        }, 500);
      }
    }
  });

  // DELETE /api/backtest/ea/backtest/:id - Delete backtest
  routes.push({
    method: 'DELETE',
    pattern: /^\/api\/backtest\/ea\/backtest\/(\d+)$/,
    handler: async (request, env, matches) => {
      try {
        const authResult = await requireAuth(request, env);
        if (authResult.error) return jsonResponse(authResult, authResult.status);

        const backtestId = parseInt(matches[1]);

        await env.DB.prepare(`
          DELETE FROM ea_backtests
          WHERE id = ? AND user_id = ?
        `).bind(backtestId, authResult.user.id).run();

        return jsonResponse({
          success: true,
          message: 'Backtest deleted successfully'
        });

      } catch (error) {
        console.error('EA backtest delete error:', error);
        return jsonResponse({
          error: 'Failed to delete backtest',
          details: error.message
        }, 500);
      }
    }
  });

  return routes;
}
