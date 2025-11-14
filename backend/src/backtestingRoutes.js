// Backtesting System API Routes
// All routes require authentication and follow existing security patterns

import { runBacktest } from './backtestEngine.js';

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

  return routes;
}
