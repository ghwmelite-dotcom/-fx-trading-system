// Cloudflare Worker - API for FX Trading Dashboard
// Deploy with: wrangler deploy

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Test endpoint (no auth required)
    if (path === '/api/test' || path === '/api/test/') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'Worker is running!',
        timestamp: new Date().toISOString(),
        hasDatabase: !!env.DB
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Database test endpoint (no auth for easier testing)
    if (path === '/api/test-db' || path === '/api/test-db/') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ 
            status: 'error',
            message: 'Database binding not found',
            hasDB: false
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const result = await env.DB.prepare('SELECT 1 as test').first();
        const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        return new Response(JSON.stringify({ 
          status: 'ok',
          message: 'Database connected!',
          tables: tables.results,
          hasDB: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          status: 'error',
          message: error.message,
          hasDB: !!env.DB
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // MT4/MT5 webhook endpoint (works for both MT4 and MT5)
    const isWebhookPath = path === '/api/mt4-webhook' || path === '/api/mt4-webhook/' || 
                          path === '/api/mt5-webhook' || path === '/api/mt5-webhook/' ||
                          path === '/api/trade-webhook' || path === '/api/trade-webhook/';
    
    if (isWebhookPath && request.method === 'POST') {
      // Check API key
      const apiKey = request.headers.get('X-API-Key');
      if (!apiKey || apiKey !== env.API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Invalid or missing API key' 
        }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return await handleMT4Webhook(request, env, corsHeaders);
    }

    // Simple API key authentication for other routes
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing API key' 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Routes
      if ((path === '/api/trades' || path === '/api/trades/') && request.method === 'GET') {
        return await getTrades(env, corsHeaders);
      }
      
      if ((path === '/api/trades' || path === '/api/trades/') && request.method === 'POST') {
        return await createTrade(request, env, corsHeaders);
      }
      
      if ((path === '/api/trades/bulk' || path === '/api/trades/bulk/') && request.method === 'POST') {
        return await createBulkTrades(request, env, corsHeaders);
      }
      
      if ((path === '/api/accounts' || path === '/api/accounts/') && request.method === 'GET') {
        return await getAccounts(env, corsHeaders);
      }
      
      if ((path === '/api/accounts' || path === '/api/accounts/') && request.method === 'POST') {
        return await createAccount(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ 
        error: 'Not Found',
        path: path,
        method: request.method,
        message: 'Endpoint not found. Available endpoints: /api/test, /api/mt4-webhook, /api/trades, /api/accounts'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Get all trades
async function getTrades(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM trades ORDER BY date DESC LIMIT 1000'
  ).all();
  
  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create single trade
async function createTrade(request, env, corsHeaders) {
  const trade = await request.json();
  
  const result = await env.DB.prepare(
    `INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id, ticket)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    trade.date,
    trade.pair,
    trade.type,
    trade.size,
    trade.entryPrice,
    trade.exitPrice,
    trade.pnl,
    trade.accountId || 1,
    trade.ticket || null
  ).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    id: result.meta.last_row_id 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create multiple trades (bulk upload)
async function createBulkTrades(request, env, corsHeaders) {
  const { trades } = await request.json();
  
  const stmt = env.DB.prepare(
    `INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id, ticket)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  
  const batch = trades.map(t => 
    stmt.bind(t.date, t.pair, t.type, t.size, t.entryPrice, t.exitPrice, t.pnl, t.accountId || 1, t.ticket || null)
  );
  
  await env.DB.batch(batch);
  
  return new Response(JSON.stringify({ 
    success: true, 
    count: trades.length 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Get all accounts
async function getAccounts(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM accounts ORDER BY name'
  ).all();
  
  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create account
async function createAccount(request, env, corsHeaders) {
  const account = await request.json();
  
  const result = await env.DB.prepare(
    `INSERT INTO accounts (name, broker, balance, account_number)
     VALUES (?, ?, ?, ?)`
  ).bind(
    account.name,
    account.broker,
    account.balance,
    account.accountNumber || null
  ).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    id: result.meta.last_row_id 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle MT4/MT5 webhook (auto-sync from EA)
async function handleMT4Webhook(request, env, corsHeaders) {
  try {
    const data = await request.json();
    
    console.log('Received trade data:', JSON.stringify(data));
    
    // Check if DB is available
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database not configured',
        message: 'D1 database binding is missing. Check wrangler.toml'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate required fields
    if (!data.symbol || data.lots === undefined || data.profit === undefined) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields',
        required: ['symbol', 'lots', 'profit'],
        received: data
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if trade already exists (by ticket number)
    if (data.ticket) {
      try {
        const existing = await env.DB.prepare(
          'SELECT id FROM trades WHERE ticket = ?'
        ).bind(data.ticket).first();
        
        if (existing) {
          console.log('Trade already exists:', data.ticket);
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Trade already exists',
            ticket: data.ticket,
            id: existing.id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (checkError) {
        console.error('Error checking for existing trade:', checkError);
        // Continue anyway - maybe table doesn't exist yet
      }
    }
    
    // Prepare trade data with defaults
    const tradeDate = data.closeTime || new Date().toISOString().split('T')[0];
    const tradeType = (data.type === 0 || data.type === '0') ? 'buy' : 'sell';
    const accountId = data.accountId || 1;
    
    console.log('Inserting trade:', {
      date: tradeDate,
      pair: data.symbol,
      type: tradeType,
      size: data.lots,
      entry: data.openPrice,
      exit: data.closePrice,
      pnl: data.profit,
      account: accountId,
      ticket: data.ticket
    });
    
    // Insert new trade
    const result = await env.DB.prepare(
      `INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id, ticket)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tradeDate,
      data.symbol,
      tradeType,
      data.lots,
      data.openPrice || 0,
      data.closePrice || 0,
      data.profit,
      accountId,
      data.ticket || null
    ).run();
    
    console.log('Trade inserted successfully:', result.meta.last_row_id);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Trade synced successfully',
      ticket: data.ticket,
      id: result.meta.last_row_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('MT5 Webhook error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack,
      hint: 'Check if D1 database is created and tables exist'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}