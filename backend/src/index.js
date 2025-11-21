// Cloudflare Worker - API for FX Trading Dashboard
// Deploy with: wrangler deploy

// ============================================
// EXCLUSIVE ACCESS SYSTEM IMPORTS
// ============================================
import {
  getPlatformStats,
  canUserRegister,
  setupUserExclusiveFeatures,
  addToWaitlist
} from './exclusiveAccess.js';

import { emailTemplates, sendEmail } from './emailService.js';

import {
  submitApplication,
  getApplications,
  approveApplication,
  rejectApplication,
  validateApplicationInvite,
  useApplicationInvite,
  isCuratedMode,
  getApplicationStats
} from './applicationSystem.js';

import { registerBacktestingRoutes } from './backtestingRoutes.js';

// ============================================
// ADVANCED FEATURES IMPORTS
// ============================================
import { registerPsychologyRoutes } from './features/psychologyScoring/routes.js';
import { registerVoiceRoutes } from './features/voiceAssistant/routes.js';
import { registerBrokerRoutes } from './features/brokerComparison/routes.js';
import { registerSocialRoutes } from './features/socialNetwork/routes.js';

// ============================================
// AUTHENTICATION & SECURITY UTILITIES
// ============================================

// Password hashing using PBKDF2 (much more secure than SHA-256)
async function hashPassword(password, providedSalt = null) {
  const encoder = new TextEncoder();

  // Generate or use provided salt
  const salt = providedSalt
    ? Uint8Array.from(atob(providedSalt), c => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // Convert to hex
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Encode salt to base64
  const saltArray = Array.from(salt);
  const saltBase64 = btoa(String.fromCharCode(...saltArray));

  // Return salt:hash format
  return `${saltBase64}:${hashHex}`;
}

async function verifyPassword(password, storedHash) {
  // Handle legacy SHA-256 hashes (for backward compatibility during migration)
  if (!storedHash.includes(':')) {
    // Legacy SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === storedHash;
  }

  // New PBKDF2 format: salt:hash
  const [salt, hash] = storedHash.split(':');
  const newHash = await hashPassword(password, salt);
  return newHash === storedHash;
}

// JWT generation and verification
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${message}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    const message = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(message)
    );

    if (!isValid) return null;

    const payload = JSON.parse(atob(encodedPayload));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

// Middleware to verify authentication
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  const jwtSecret = env.JWT_SECRET || 'default-secret-change-in-production';
  const payload = await verifyJWT(token, jwtSecret);

  if (!payload) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { user: payload };
}

// Middleware to require admin role
async function requireAdmin(request, env) {
  const authResult = await requireAuth(request, env);
  if (authResult.error) return authResult;

  if (authResult.user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return authResult;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS configuration - configurable via environment variable
    const allowedOrigins = env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(',')
      : [
          'https://fx-trading-dashboard.pages.dev',
          'https://*.fx-trading-dashboard.pages.dev',
          'https://fx-trade-metrics-pro.ghwmelite.work',
          'https://trademetricspro.ghwmelite.work',
          'https://fxjournalpro.ghwmelite.work',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:4173'
        ];

    const origin = request.headers.get('Origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin && (
        allowedOrigins.includes('*') ||
        allowedOrigins.some(allowed =>
          allowed.includes('*') ? new RegExp(allowed.replace(/\*/g, '.*')).test(origin) : allowed === origin
        )
      ) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper function for JSON responses
    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // BACKTESTING SYSTEM ROUTES
    // ============================================
    const routes = [];
    registerBacktestingRoutes(routes, requireAuth, jsonResponse);

    // ============================================
    // ADVANCED FEATURE ROUTES (AUTHENTICATED)
    // ============================================
    const authRoutes = [];
    registerPsychologyRoutes(authRoutes);
    registerVoiceRoutes(authRoutes);
    registerBrokerRoutes(authRoutes);
    registerSocialRoutes(authRoutes);

    // Try to match authenticated feature routes first
    for (const route of authRoutes) {
      if (request.method === route.method) {
        const match = path.match(route.pattern);
        if (match) {
          try {
            // Require authentication for all feature routes
            const authResult = await requireAuth(request, env);
            if (authResult.error) {
              return jsonResponse({ error: authResult.error }, authResult.status);
            }

            const userId = authResult.user.id;
            return await route.handler(request, env, userId, match.slice(1));
          } catch (error) {
            console.error('Feature route error:', error);
            return jsonResponse({ error: error.message }, 500);
          }
        }
      }
    }

    // Try to match backtesting routes
    for (const route of routes) {
      if (request.method === route.method) {
        const match = path.match(route.pattern);
        // Log health check route matching for debugging
        if (path.includes('/mt5/health')) {
          console.log(`Testing route: ${route.pattern} against path: ${path}, match:`, !!match, 'method:', request.method);
        }
        if (request.method === 'DELETE' && path.includes('/datasets/')) {
          console.log(`Testing route: ${route.pattern} against path: ${path}, match:`, !!match);
        }
        if (match) {
          try {
            return await route.handler(request, env, match.slice(1));
          } catch (error) {
            console.error('Backtesting route error:', error);
            return jsonResponse({ error: error.message }, 500);
          }
        }
      }
    }

    // Log 404 for dataset deletion attempts
    if (request.method === 'DELETE' && path.includes('/datasets/')) {
      console.log(`404 - No route matched for DELETE ${path}`);
      console.log(`Total routes registered:`, routes.length);
      console.log(`DELETE routes:`, routes.filter(r => r.method === 'DELETE').map(r => r.pattern.toString()));
    }

    // ============================================
    // EXCLUSIVE ACCESS SYSTEM ENDPOINTS
    // ============================================

    // GET /api/platform/stats - Public platform statistics
    if (path === '/api/platform/stats' && request.method === 'GET') {
      try {
        const stats = await getPlatformStats(env);
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error getting platform stats:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get platform stats',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /api/waitlist - Join waitlist
    if (path === '/api/waitlist' && request.method === 'POST') {
      try {
        const data = await request.json();

        // Validate required fields
        if (!data.email || !data.name) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email and name are required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Add to waitlist
        const result = await addToWaitlist(env, data);

        // Send confirmation email if successful
        if (result.success && env.RESEND_API_KEY) {
          const stats = await getPlatformStats(env);
          const template = emailTemplates.waitlistConfirmation(
            data.name,
            result.position,
            stats.waitlist_size
          );
          await sendEmail(env.RESEND_API_KEY, data.email, template);
        }

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error adding to waitlist:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to add to waitlist',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================
    // APPLICATION SYSTEM ENDPOINTS (Curated Access)
    // ============================================

    // POST /api/apply - Submit founding member application
    if (path === '/api/apply' && request.method === 'POST') {
      try {
        const data = await request.json();

        // Validate required fields
        if (!data.email || !data.name || !data.experience_years || !data.account_size || !data.why_you) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Please fill in all required fields'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Submit application
        const result = await submitApplication(env, data);

        // Send confirmation email to applicant
        if (result.success && env.RESEND_API_KEY) {
          const template = emailTemplates.applicationReceived(
            data.name,
            result.queue_position,
            result.priority
          );
          await sendEmail(env.RESEND_API_KEY, data.email, template);

          // Send notification email to admin
          if (env.ADMIN_EMAIL) {
            const adminTemplate = emailTemplates.adminNewApplication(
              data.name,
              data.email,
              result.priority,
              result.queue_position,
              data
            );
            await sendEmail(env.RESEND_API_KEY, env.ADMIN_EMAIL, adminTemplate);
          }
        }

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error submitting application:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to submit application',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/platform/mode - Check if curated or automatic registration
    if (path === '/api/platform/mode' && request.method === 'GET') {
      try {
        const inCuratedMode = await isCuratedMode(env);
        const stats = await getPlatformStats(env);

        return new Response(JSON.stringify({
          curated_mode: inCuratedMode,
          mode: inCuratedMode ? 'application' : stats.is_full ? 'waitlist' : 'registration',
          spots_filled: stats.total_users,
          founding_spots_remaining: Math.max(0, 25 - stats.total_users)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error checking platform mode:', error);
        return new Response(JSON.stringify({
          error: 'Failed to check platform mode',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/admin/applications - List applications (requires auth)
    if (path === '/api/admin/applications' && request.method === 'GET') {
      try {
        // Get auth from request
        const authHeader = request.headers.get('Authorization');
        const sessionCookie = request.headers.get('Cookie')?.split('; ').find(c => c.startsWith('session_token='));

        if (!authHeader && !sessionCookie) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Parse query params
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const limit = url.searchParams.get('limit');
        const offset = url.searchParams.get('offset');

        const result = await getApplications(env, { status, limit, offset });

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error getting applications:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to get applications',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /api/admin/applications/:id/approve - Approve application
    if (path.match(/^\/api\/admin\/applications\/\d+\/approve$/) && request.method === 'POST') {
      try {
        // Get auth from request
        const authHeader = request.headers.get('Authorization');
        const sessionCookie = request.headers.get('Cookie')?.split('; ').find(c => c.startsWith('session_token='));

        if (!authHeader && !sessionCookie) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Extract application ID
        const applicationId = parseInt(path.split('/')[4]);

        // TODO: Get actual admin user ID from session
        const adminId = 1;

        // Approve application
        const result = await approveApplication(env, applicationId, adminId);

        // Send approval email if successful
        if (result.success && env.RESEND_API_KEY) {
          const template = emailTemplates.applicationApproved(
            result.applicant_name,
            result.invitation_code,
            result.expires_at
          );
          await sendEmail(env.RESEND_API_KEY, result.applicant_email, template);
        }

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error approving application:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to approve application',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /api/admin/applications/:id/reject - Reject application
    if (path.match(/^\/api\/admin\/applications\/\d+\/reject$/) && request.method === 'POST') {
      try {
        // Get auth from request
        const authHeader = request.headers.get('Authorization');
        const sessionCookie = request.headers.get('Cookie')?.split('; ').find(c => c.startsWith('session_token='));

        if (!authHeader && !sessionCookie) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Extract application ID
        const applicationId = parseInt(path.split('/')[4]);

        // Get reason from body
        const data = await request.json().catch(() => ({}));
        const reason = data.reason || null;

        // TODO: Get actual admin user ID from session
        const adminId = 1;

        // Reject application
        const result = await rejectApplication(env, applicationId, adminId, reason);

        // Send rejection email if successful
        if (result.success && env.RESEND_API_KEY) {
          const template = emailTemplates.applicationRejected(result.applicant_name);
          await sendEmail(env.RESEND_API_KEY, result.applicant_email, template);
        }

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error rejecting application:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to reject application',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/admin/applications/stats - Get application statistics
    if (path === '/api/admin/applications/stats' && request.method === 'GET') {
      try {
        // Get auth from request
        const authHeader = request.headers.get('Authorization');
        const sessionCookie = request.headers.get('Cookie')?.split('; ').find(c => c.startsWith('session_token='));

        if (!authHeader && !sessionCookie) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await getApplicationStats(env);

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error getting application stats:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to get application stats',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================
    // EXISTING ENDPOINTS
    // ============================================

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

    // ============================================
    // AUTHENTICATION ENDPOINTS (No API key required)
    // ============================================

    // Login endpoint
    if ((path === '/api/auth/login' || path === '/api/auth/login/') && request.method === 'POST') {
      return await login(request, env, corsHeaders);
    }

    // Get current user info
    if ((path === '/api/auth/me' || path === '/api/auth/me/') && request.method === 'GET') {
      return await getCurrentUser(request, env, corsHeaders);
    }

    // Logout endpoint
    if ((path === '/api/auth/logout' || path === '/api/auth/logout/') && request.method === 'POST') {
      return await logout(request, env, corsHeaders);
    }

    // ============================================
    // ADMIN ENDPOINTS (Require admin role)
    // ============================================

    // Get all users (admin only)
    if ((path === '/api/admin/users' || path === '/api/admin/users/') && request.method === 'GET') {
      return await getAllUsers(request, env, corsHeaders);
    }

    // Create new user (admin only)
    if ((path === '/api/admin/users' || path === '/api/admin/users/') && request.method === 'POST') {
      return await createUser(request, env, corsHeaders);
    }

    // Update user (admin only)
    if (path.match(/^\/api\/admin\/users\/\d+\/?$/) && request.method === 'PUT') {
      const userId = path.split('/')[4];
      return await updateUser(userId, request, env, corsHeaders);
    }

    // Delete user (admin only)
    if (path.match(/^\/api\/admin\/users\/\d+\/?$/) && request.method === 'DELETE') {
      const userId = path.split('/')[4];
      return await deleteUser(userId, request, env, corsHeaders);
    }

    // Reset user password (admin only)
    if (path.match(/^\/api\/admin\/users\/\d+\/reset-password\/?$/) && request.method === 'POST') {
      const userId = path.split('/')[4];
      return await resetUserPassword(userId, request, env, corsHeaders);
    }

    // Get audit logs (admin only)
    if ((path === '/api/admin/audit-logs' || path === '/api/admin/audit-logs/') && request.method === 'GET') {
      return await getAuditLogs(request, env, corsHeaders);
    }

    // Get admin dashboard stats (admin only)
    if ((path === '/api/admin/dashboard' || path === '/api/admin/dashboard/') && request.method === 'GET') {
      return await getAdminDashboard(request, env, corsHeaders);
    }

    // Get all platform settings (admin only)
    if ((path === '/api/admin/settings' || path === '/api/admin/settings/') && request.method === 'GET') {
      return await getAllSettings(request, env, corsHeaders);
    }

    // Update platform setting (admin only)
    if (path.startsWith('/api/admin/settings/') && request.method === 'PUT') {
      const settingKey = path.substring('/api/admin/settings/'.length).replace(/\/$/, '');
      return await updateSetting(settingKey, request, env, corsHeaders);
    }

    // Upload logo (admin only)
    if ((path === '/api/admin/settings/upload/logo' || path === '/api/admin/settings/upload/logo/') && request.method === 'POST') {
      return await uploadLogo(request, env, corsHeaders);
    }

    // Upload favicon (admin only)
    if ((path === '/api/admin/settings/upload/favicon' || path === '/api/admin/settings/upload/favicon/') && request.method === 'POST') {
      return await uploadFavicon(request, env, corsHeaders);
    }

    // ============================================
    // TEMPORARY ACCESS MANAGEMENT ROUTES (Admin only)
    // ============================================

    // POST /api/admin/temporary-access - Generate temporary access token
    if ((path === '/api/admin/temporary-access' || path === '/api/admin/temporary-access/') && request.method === 'POST') {
      return await generateTemporaryAccess(request, env, corsHeaders);
    }

    // GET /api/admin/temporary-access - List all temporary access tokens
    if ((path === '/api/admin/temporary-access' || path === '/api/admin/temporary-access/') && request.method === 'GET') {
      return await listTemporaryAccess(request, env, corsHeaders);
    }

    // DELETE /api/admin/temporary-access/:token - Revoke temporary access token
    if (path.startsWith('/api/admin/temporary-access/') && request.method === 'DELETE') {
      const token = path.substring('/api/admin/temporary-access/'.length).replace(/\/$/, '');
      return await revokeTemporaryAccess(token, request, env, corsHeaders);
    }

    // POST /api/auth/temporary-login - Login with temporary access code
    if ((path === '/api/auth/temporary-login' || path === '/api/auth/temporary-login/') && request.method === 'POST') {
      return await temporaryLogin(request, env, corsHeaders);
    }

    // POST /api/auth/verify-temporary-access - Verify temporary access token is valid
    if ((path === '/api/auth/verify-temporary-access' || path === '/api/auth/verify-temporary-access/') && request.method === 'POST') {
      return await verifyTemporaryAccess(request, env, corsHeaders);
    }

    // Get public platform settings (no auth required)
    if ((path === '/api/settings' || path === '/api/settings/') && request.method === 'GET') {
      return await getPublicSettings(env, corsHeaders);
    }

    // Serve R2 images (GET /api/r2/:path) - no auth required for viewing
    if (path.startsWith('/api/r2/') && request.method === 'GET') {
      const key = path.substring('/api/r2/'.length);
      return await serveR2Image(key, env, corsHeaders);
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

    // ============================================
    // JWT-AUTHENTICATED TRADE ENDPOINTS
    // ============================================

    try {
      // Trade endpoints - require JWT authentication for user data isolation
      if ((path === '/api/trades' || path === '/api/trades/') && request.method === 'GET') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await getTrades(env, corsHeaders, authResult.user);
      }
      
      if ((path === '/api/trades' || path === '/api/trades/') && request.method === 'POST') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await createTrade(request, env, corsHeaders, authResult.user);
      }

      if ((path === '/api/trades/bulk' || path === '/api/trades/bulk/') && request.method === 'POST') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await createBulkTrades(request, env, corsHeaders, authResult.user);
      }

      // Update trade (PUT /api/trades/:id)
      if (path.match(/^\/api\/trades\/\d+\/?$/) && request.method === 'PUT') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const tradeId = path.split('/')[3];
        return await updateTrade(tradeId, request, env, corsHeaders, authResult.user);
      }

      // Delete trade (DELETE /api/trades/:id)
      if (path.match(/^\/api\/trades\/\d+\/?$/) && request.method === 'DELETE') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const tradeId = path.split('/')[3];
        return await deleteTrade(tradeId, env, corsHeaders, authResult.user);
      }

      // Update trade journal (PATCH /api/trades/:id/journal)
      if (path.match(/^\/api\/trades\/\d+\/journal\/?$/) && request.method === 'PATCH') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const tradeId = path.split('/')[3];
        return await updateTradeJournal(tradeId, request, env, corsHeaders, authResult.user);
      }

      // Upload screenshot (POST /api/trades/:id/screenshot)
      if (path.match(/^\/api\/trades\/\d+\/screenshot\/?$/) && request.method === 'POST') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const tradeId = path.split('/')[3];
        return await uploadScreenshot(tradeId, request, env, corsHeaders, authResult.user);
      }

      // Delete screenshot (DELETE /api/trades/:id/screenshot)
      if (path.match(/^\/api\/trades\/\d+\/screenshot\/?$/) && request.method === 'DELETE') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const tradeId = path.split('/')[3];
        return await deleteScreenshot(tradeId, request, env, corsHeaders, authResult.user);
      }

      // Psychology Coach - Generate AI insights (POST /api/psychology-coach)
      if ((path === '/api/psychology-coach' || path === '/api/psychology-coach/') && request.method === 'POST') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await generatePsychologyInsights(request, env, corsHeaders, authResult.user);
      }

      if ((path === '/api/accounts' || path === '/api/accounts/') && request.method === 'GET') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await getAccounts(env, corsHeaders, authResult.user);
      }

      if ((path === '/api/accounts' || path === '/api/accounts/') && request.method === 'POST') {
        const authResult = await requireAuth(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify(authResult), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await createAccount(request, env, corsHeaders, authResult.user);
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
async function getTrades(env, corsHeaders, user) {
  // Admin can see all trades, regular users only see their own
  let query, results;

  if (user.role === 'admin') {
    query = env.DB.prepare('SELECT * FROM trades ORDER BY date DESC, id DESC LIMIT 1000');
    results = await query.all();
  } else {
    query = env.DB.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 1000');
    results = await query.bind(user.id).all();
  }

  return new Response(JSON.stringify(results.results || []), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create single trade
async function createTrade(request, env, corsHeaders, user) {
  const trade = await request.json();

  const result = await env.DB.prepare(
    `INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id, ticket, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    trade.date,
    trade.pair,
    trade.type,
    trade.size,
    trade.entryPrice,
    trade.exitPrice,
    trade.pnl,
    trade.accountId || 1,
    trade.ticket || null,
    user.id  // Set the user_id from JWT token
  ).run();

  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create multiple trades (bulk upload)
async function createBulkTrades(request, env, corsHeaders, user) {
  const { trades } = await request.json();

  const stmt = env.DB.prepare(
    `INSERT INTO trades (date, pair, type, size, entry_price, exit_price, pnl, account_id, ticket, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = trades.map(t =>
    stmt.bind(t.date, t.pair, t.type, t.size, t.entryPrice, t.exitPrice, t.pnl, t.accountId || 1, t.ticket || null, user.id)
  );

  await env.DB.batch(batch);

  return new Response(JSON.stringify({
    success: true,
    count: trades.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Update a trade
async function updateTrade(tradeId, request, env, corsHeaders, user) {
  const trade = await request.json();

  // Verify ownership (unless admin)
  if (user.role !== 'admin') {
    const existing = await env.DB.prepare('SELECT user_id FROM trades WHERE id = ?').bind(tradeId).first();
    if (!existing || existing.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trade not found or access denied'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  const result = await env.DB.prepare(
    `UPDATE trades
     SET date = ?, pair = ?, type = ?, size = ?, entry_price = ?, exit_price = ?, pnl = ?, account_id = ?
     WHERE id = ?`
  ).bind(
    trade.date,
    trade.pair,
    trade.type,
    trade.size,
    trade.entryPrice,
    trade.exitPrice,
    trade.pnl,
    trade.accountId,
    tradeId
  ).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Trade not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Trade updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Delete a trade
async function deleteTrade(tradeId, env, corsHeaders, user) {
  // Verify ownership (unless admin)
  if (user.role !== 'admin') {
    const existing = await env.DB.prepare('SELECT user_id FROM trades WHERE id = ?').bind(tradeId).first();
    if (!existing || existing.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trade not found or access denied'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  const result = await env.DB.prepare(
    `DELETE FROM trades WHERE id = ?`
  ).bind(tradeId).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Trade not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Trade deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Update trade journal fields (notes, tags, ratings, emotions, screenshot)
async function updateTradeJournal(tradeId, request, env, corsHeaders, user) {
  const journal = await request.json();

  // Verify ownership (unless admin)
  if (user.role !== 'admin') {
    const existing = await env.DB.prepare('SELECT user_id FROM trades WHERE id = ?').bind(tradeId).first();
    if (!existing || existing.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trade not found or access denied'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Build dynamic UPDATE query based on provided fields
  const updates = [];
  const bindings = [];

  if (journal.notes !== undefined) {
    updates.push('notes = ?');
    bindings.push(journal.notes);
  }

  if (journal.tags !== undefined) {
    updates.push('tags = ?');
    bindings.push(JSON.stringify(journal.tags)); // Store as JSON string
  }

  if (journal.rating !== undefined) {
    updates.push('rating = ?');
    bindings.push(journal.rating);
  }

  if (journal.setupQuality !== undefined) {
    updates.push('setup_quality = ?');
    bindings.push(journal.setupQuality);
  }

  if (journal.executionQuality !== undefined) {
    updates.push('execution_quality = ?');
    bindings.push(journal.executionQuality);
  }

  if (journal.emotions !== undefined) {
    updates.push('emotions = ?');
    bindings.push(JSON.stringify(journal.emotions)); // Store as JSON string
  }

  if (journal.screenshotUrl !== undefined) {
    updates.push('screenshot_url = ?');
    bindings.push(journal.screenshotUrl);
  }

  if (journal.lessonsLearned !== undefined) {
    updates.push('lessons_learned = ?');
    bindings.push(journal.lessonsLearned);
  }

  // Always update the updated_at timestamp
  updates.push('updated_at = CURRENT_TIMESTAMP');

  if (updates.length === 1) { // Only updated_at, no journal fields provided
    return new Response(JSON.stringify({
      success: false,
      error: 'No journal fields provided to update'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Add tradeId to the end of bindings
  bindings.push(tradeId);

  const query = `UPDATE trades SET ${updates.join(', ')} WHERE id = ?`;

  const result = await env.DB.prepare(query).bind(...bindings).run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Trade not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Trade journal updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Upload screenshot to R2 and update trade
async function uploadScreenshot(tradeId, request, env, corsHeaders, user) {
  try {
    // Check if R2 bucket is configured
    if (!env.SCREENSHOTS) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Screenshot storage not configured',
        message: 'R2 bucket binding is missing. Run: wrangler r2 bucket create fx-trading-screenshots'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify trade exists and ownership
    const trade = await env.DB.prepare('SELECT id, user_id FROM trades WHERE id = ?').bind(tradeId).first();
    if (!trade) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trade not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check ownership (unless admin)
    if (user.role !== 'admin' && trade.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate unique key for R2
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const key = `trades/${tradeId}/${timestamp}.${extension}`;

    // Upload to R2
    await env.SCREENSHOTS.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Generate public URL (adjust domain based on your R2 configuration)
    // For now, we'll store the key and retrieve it later
    const screenshotUrl = key;

    // Update trade with screenshot URL
    await env.DB.prepare(
      'UPDATE trades SET screenshot_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(screenshotUrl, tradeId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Screenshot uploaded successfully',
      url: screenshotUrl,
      key: key
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Delete screenshot from R2
async function deleteScreenshot(tradeId, request, env, corsHeaders, user) {
  try {
    // Check if R2 bucket is configured
    if (!env.SCREENSHOTS) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Screenshot storage not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current screenshot URL from database and check ownership
    const trade = await env.DB.prepare(
      'SELECT screenshot_url, user_id FROM trades WHERE id = ?'
    ).bind(tradeId).first();

    if (!trade) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trade not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check ownership (unless admin)
    if (user.role !== 'admin' && trade.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!trade.screenshot_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No screenshot to delete'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete from R2
    await env.SCREENSHOTS.delete(trade.screenshot_url);

    // Update database
    await env.DB.prepare(
      'UPDATE trades SET screenshot_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(tradeId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Screenshot deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Screenshot delete error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Serve R2 image
async function serveR2Image(key, env, corsHeaders) {
  try {
    // Check if R2 bucket is configured
    if (!env.SCREENSHOTS) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Screenshot storage not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get object from R2
    const object = await env.SCREENSHOTS.get(key);

    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders
      });
    }

    // Return the image with appropriate headers
    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(object.body, { headers });

  } catch (error) {
    console.error('R2 serve error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get all accounts
async function getAccounts(env, corsHeaders, user) {
  // For now, all users can see all accounts (accounts are shared resources)
  // TODO: Add user_id to accounts table for full multi-user isolation
  const { results: accounts } = await env.DB.prepare(
    'SELECT * FROM accounts ORDER BY name'
  ).all();

  // Calculate actual balance for each account from trades
  const accountsWithBalance = await Promise.all(accounts.map(async (account) => {
    const { results: trades } = await env.DB.prepare(
      'SELECT COALESCE(SUM(pnl), 0) as total_pnl FROM trades WHERE account_id = ?'
    ).bind(account.id).all();

    const totalPnl = trades[0]?.total_pnl || 0;
    const calculatedBalance = account.balance + totalPnl;

    return {
      ...account,
      balance: calculatedBalance
    };
  }));

  return new Response(JSON.stringify(accountsWithBalance), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create account
async function createAccount(request, env, corsHeaders, user) {
  const account = await request.json();

  // Only admins can create accounts
  if (user.role !== 'admin') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Only administrators can create accounts'
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

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

    // Validate account ID - MUST be provided and cannot be default (1)
    if (!data.accountId && !data.account) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Account ID is required',
        message: 'Please update your MT5 EA to version 2.00 or later',
        instructions: 'The EA must send accountId using AccountInfoInteger(ACCOUNT_LOGIN)',
        download: 'Get the latest EA from your dashboard repository',
        received: data
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Reject trades using default account ID (indicates old EA version)
    const providedAccountId = data.accountId || data.account;
    if (providedAccountId === 1 || providedAccountId === '1') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid account ID',
        message: 'Account ID cannot be 1 (default value). You must update your MT5 EA to version 2.00',
        issue: 'Your EA is using the old hardcoded account ID instead of the real MT5 account number',
        solution: 'Update line 163 of your EA to use: AccountInfoInteger(ACCOUNT_LOGIN)',
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

    // Auto-create account if it doesn't exist
    // Use validated account ID from above (already checked it's not 1)
    const accountId = providedAccountId;

    try {
      // Check if account exists
      const existingAccount = await env.DB.prepare(
        'SELECT id, name FROM accounts WHERE id = ?'
      ).bind(accountId).first();

      if (!existingAccount) {
        // Create new account automatically
        const accountName = data.accountName || `MT5 Account ${accountId}`;
        const brokerName = data.broker || 'MT5';
        const initialBalance = data.balance || 10000;

        console.log(`Auto-creating account: ${accountName} (${accountId}) - ${brokerName}`);

        await env.DB.prepare(
          `INSERT INTO accounts (id, name, broker, balance) VALUES (?, ?, ?, ?)`
        ).bind(
          accountId,
          accountName,
          brokerName,
          initialBalance
        ).run();

        console.log(`✓ Account ${accountId} created successfully`);
      } else {
        console.log(`Account ${accountId} exists: ${existingAccount.name}`);
      }
    } catch (accountError) {
      console.error('Error checking/creating account:', accountError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Database error while creating account',
        details: accountError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
    
    console.log(`✓ Trade ${data.ticket} inserted successfully (ID: ${result.meta.last_row_id})`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Trade synced successfully',
      trade: {
        id: result.meta.last_row_id,
        ticket: data.ticket,
        symbol: data.symbol,
        profit: data.profit
      },
      account: {
        id: accountId,
        broker: data.broker || 'MT5'
      },
      tip: 'View your trade at: https://fx-trading-dashboard.pages.dev'
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

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token, env, clientIP) {
  // Allow dev-mode bypass for development
  if (token === 'dev-mode-bypass') {
    console.log('Turnstile verification bypassed for development');
    return { success: true, dev_mode: true };
  }

  // Get Turnstile secret from environment variables
  const secret = env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not configured - skipping verification');
    return { success: true, warning: 'Turnstile not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (clientIP) {
      formData.append('remoteip', clientIP);
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await result.json();

    if (!outcome.success) {
      console.error('Turnstile verification failed:', outcome);
      return {
        success: false,
        error: 'Invalid security verification',
        'error-codes': outcome['error-codes']
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, error: 'Security verification failed' };
  }
}

// Login endpoint
async function login(request, env, corsHeaders) {
  try {
    const { username, password, turnstileToken } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify Turnstile token
    if (turnstileToken) {
      const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
      const turnstileResult = await verifyTurnstileToken(turnstileToken, env, clientIP);

      if (!turnstileResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: turnstileResult.error || 'Security verification failed. Please try again.'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Find user by username or email
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1'
    ).bind(username, username).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT
    const jwtSecret = env.JWT_SECRET || 'default-secret-change-in-production';
    const token = await generateJWT({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, jwtSecret);

    // Check if password must be changed (for default admin or expired passwords)
    const mustChangePassword = user.must_change_password === 1 || false;

    // Check if account is locked
    if (user.account_locked === 1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Account is locked. Please contact an administrator.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Reset failed login attempts on successful login
    await env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0 WHERE id = ?'
    ).bind(user.id).run();

    // Log audit
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)'
    ).bind(user.id, 'login', request.headers.get('cf-connecting-ip') || 'unknown').run();

    return new Response(JSON.stringify({
      success: true,
      token,
      mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        avatarUrl: user.avatar_url
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Login failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get current user
async function getCurrentUser(request, env, corsHeaders) {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const user = await env.DB.prepare(
    'SELECT id, username, email, role, full_name, avatar_url, last_login FROM users WHERE id = ?'
  ).bind(authResult.user.id).first();

  return new Response(JSON.stringify({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      lastLogin: user.last_login
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Logout endpoint
async function logout(request, env, corsHeaders) {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Log audit
  await env.DB.prepare(
    'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)'
  ).bind(authResult.user.id, 'logout', request.headers.get('cf-connecting-ip') || 'unknown').run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all users (admin only)
async function getAllUsers(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, username, email, role, full_name, avatar_url, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
  ).all();

  return new Response(JSON.stringify({
    success: true,
    users: results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Create new user (admin only)
async function createUser(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username, email, password, role, fullName } = await request.json();

    if (!username || !email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username, email, and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await env.DB.prepare(
      'INSERT INTO users (username, email, password_hash, role, full_name, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(username, email, passwordHash, role || 'trader', fullName || null).run();

    // Log audit
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, target_user_id, details) VALUES (?, ?, ?, ?)'
    ).bind(authResult.user.id, 'create_user', result.meta.last_row_id, JSON.stringify({ username, email, role: role || 'trader' })).run();

    return new Response(JSON.stringify({
      success: true,
      userId: result.meta.last_row_id,
      message: 'User created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message.includes('UNIQUE') ? 'Username or email already exists' : 'Failed to create user'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Update user (admin only)
async function updateUser(userId, request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username, email, role, fullName, isActive, password } = await request.json();
    const updates = [];
    const bindings = [];

    if (username) {
      updates.push('username = ?');
      bindings.push(username);
    }
    if (email) {
      updates.push('email = ?');
      bindings.push(email);
    }
    if (role) {
      updates.push('role = ?');
      bindings.push(role);
    }
    if (fullName !== undefined) {
      updates.push('full_name = ?');
      bindings.push(fullName);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      bindings.push(isActive ? 1 : 0);
    }
    if (password) {
      updates.push('password_hash = ?');
      bindings.push(await hashPassword(password));
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(userId);

    await env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();

    // Log audit
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, target_user_id, details) VALUES (?, ?, ?, ?)'
    ).bind(authResult.user.id, 'update_user', userId, JSON.stringify({ username, email, role })).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'User updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update user'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Delete user (admin only)
async function deleteUser(userId, request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Prevent admin from deleting themselves
  if (parseInt(userId) === authResult.user.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Cannot delete your own account'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  // Log audit
  await env.DB.prepare(
    'INSERT INTO audit_logs (user_id, action, target_user_id) VALUES (?, ?, ?)'
  ).bind(authResult.user.id, 'delete_user', userId).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'User deleted successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Reset user password (admin only)
async function resetUserPassword(userId, request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password must be at least 6 characters long'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user to verify it exists
    const user = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Hash the new password using PBKDF2
    const passwordHash = await hashPassword(newPassword);

    // Update password in database and clear must_change_password flag
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, must_change_password = 0, last_password_change = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(passwordHash, userId).run();

    // Log the action in audit logs
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      authResult.user.id,
      'reset_password',
      userId,
      JSON.stringify({
        admin_reset: true,
        target_username: user.username,
        reset_by: authResult.user.username
      }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Password reset successfully for user: ${user.username}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to reset password: ' + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get audit logs (admin only)
async function getAuditLogs(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT al.*, u.username, tu.username as target_username
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     LEFT JOIN users tu ON al.target_user_id = tu.id
     ORDER BY al.created_at DESC
     LIMIT 100`
  ).all();

  return new Response(JSON.stringify({
    success: true,
    logs: results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Get admin dashboard stats
async function getAdminDashboard(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const [totalUsers, activeUsers, totalTrades, recentLogins] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM trades').first(),
    env.DB.prepare('SELECT username, last_login FROM users WHERE last_login IS NOT NULL ORDER BY last_login DESC LIMIT 10').all()
  ]);

  return new Response(JSON.stringify({
    success: true,
    stats: {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalTrades: totalTrades.count,
      recentLogins: recentLogins.results
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================
// PLATFORM SETTINGS FUNCTIONS
// ============================================

// Get public platform settings (no auth required)
async function getPublicSettings(env, corsHeaders) {
  try {
    const settings = await env.DB.prepare(
      `SELECT setting_key, setting_value, setting_type
       FROM platform_settings
       WHERE setting_key IN ('platform_name', 'logo_url', 'favicon_url', 'theme_mode', 'primary_color')`
    ).all();

    const settingsObj = {};
    settings.results.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    return new Response(JSON.stringify({
      success: true,
      settings: settingsObj
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch settings'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Get all platform settings (admin only)
async function getAllSettings(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const settings = await env.DB.prepare(
      'SELECT setting_key, setting_value, setting_type, description, updated_at FROM platform_settings ORDER BY setting_key'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      settings: settings.results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch settings'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Update platform setting (admin only)
async function updateSetting(settingKey, request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { value } = await request.json();
    const userId = authResult.user.id;

    // Update the setting
    await env.DB.prepare(
      'UPDATE platform_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(value, userId, settingKey).run();

    // Log the action
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      'update_setting',
      JSON.stringify({ setting_key: settingKey, new_value: value }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Setting updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update setting'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Upload logo (admin only)
async function uploadLogo(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!env.SCREENSHOTS) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Storage not configured'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only JPG, PNG, SVG, and WebP are allowed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (2MB max for logo)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 2MB'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload to R2
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const key = `branding/logo-${timestamp}.${extension}`;

    await env.SCREENSHOTS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // Update setting in database
    const userId = authResult.user.id;
    await env.DB.prepare(
      'UPDATE platform_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(key, userId, 'logo_url').run();

    // Log the action
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      'upload_logo',
      JSON.stringify({ logo_url: key }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      url: key,
      message: 'Logo uploaded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload logo'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Upload favicon (admin only)
async function uploadFavicon(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!env.SCREENSHOTS) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Storage not configured'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only ICO, PNG, and SVG are allowed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (500KB max for favicon)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 500KB'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload to R2
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const key = `branding/favicon-${timestamp}.${extension}`;

    await env.SCREENSHOTS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // Update setting in database
    const userId = authResult.user.id;
    await env.DB.prepare(
      'UPDATE platform_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(key, userId, 'favicon_url').run();

    // Log the action
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      'upload_favicon',
      JSON.stringify({ favicon_url: key }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      url: key,
      message: 'Favicon uploaded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload favicon error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload favicon'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// TEMPORARY ACCESS MANAGEMENT FUNCTIONS
// ============================================

// Helper: Generate random access code (human-readable)
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Format as XXXX-XXXX for readability
  return code.substring(0, 4) + '-' + code.substring(4);
}

// Helper: Generate secure access token
function generateAccessToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// POST /api/admin/temporary-access - Generate temporary access token
async function generateTemporaryAccess(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { duration_minutes, access_level, granted_to_email, notes } = await request.json();

    // Validate duration (must be between 5 minutes and 24 hours)
    if (!duration_minutes || duration_minutes < 5 || duration_minutes > 1440) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Duration must be between 5 and 1440 minutes (24 hours)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate access level
    const validLevels = ['admin', 'read_only'];
    if (access_level && !validLevels.includes(access_level)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid access level. Must be "admin" or "read_only"'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = authResult.user.id;
    const accessToken = generateAccessToken();
    const accessCode = generateAccessCode();
    const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000);

    // Insert into database
    await env.DB.prepare(`
      INSERT INTO temporary_access (
        access_token, access_code, created_by_user_id, granted_to_email,
        access_level, duration_minutes, expires_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      accessToken,
      accessCode,
      userId,
      granted_to_email || null,
      access_level || 'admin',
      duration_minutes,
      expiresAt.toISOString(),
      notes || null
    ).run();

    // Log the action
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      'create_temporary_access',
      JSON.stringify({
        access_code: accessCode,
        duration_minutes,
        access_level: access_level || 'admin',
        granted_to_email: granted_to_email || 'anyone',
        expires_at: expiresAt.toISOString()
      }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      access_code: accessCode,
      access_token: accessToken,
      expires_at: expiresAt.toISOString(),
      duration_minutes,
      access_level: access_level || 'admin',
      message: 'Temporary access created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Generate temporary access error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate temporary access'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/admin/temporary-access - List all temporary access tokens
async function listTemporaryAccess(request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await env.DB.prepare(`
      SELECT
        ta.id,
        ta.access_code,
        ta.created_by_user_id,
        u.username as created_by_username,
        ta.granted_to_email,
        ta.granted_to_user_id,
        gu.username as granted_to_username,
        ta.access_level,
        ta.duration_minutes,
        ta.expires_at,
        ta.created_at,
        ta.used_at,
        ta.last_activity_at,
        ta.is_active,
        ta.is_used,
        ta.notes,
        ta.revoked_at,
        ta.revoked_by_user_id,
        ru.username as revoked_by_username
      FROM temporary_access ta
      LEFT JOIN users u ON ta.created_by_user_id = u.id
      LEFT JOIN users gu ON ta.granted_to_user_id = gu.id
      LEFT JOIN users ru ON ta.revoked_by_user_id = ru.id
      ORDER BY ta.created_at DESC
      LIMIT 100
    `).all();

    return new Response(JSON.stringify({
      success: true,
      tokens: result.results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('List temporary access error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list temporary access tokens'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/admin/temporary-access/:token - Revoke temporary access token
async function revokeTemporaryAccess(accessCode, request, env, corsHeaders) {
  const authResult = await requireAdmin(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({
      success: false,
      error: authResult.error
    }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const userId = authResult.user.id;

    // Check if token exists
    const token = await env.DB.prepare(
      'SELECT * FROM temporary_access WHERE access_code = ?'
    ).bind(accessCode).first();

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Temporary access token not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Revoke the token
    await env.DB.prepare(`
      UPDATE temporary_access
      SET is_active = 0, revoked_at = CURRENT_TIMESTAMP, revoked_by_user_id = ?
      WHERE access_code = ?
    `).bind(userId, accessCode).run();

    // Log the action
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      userId,
      'revoke_temporary_access',
      JSON.stringify({ access_code: accessCode }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Temporary access revoked successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Revoke temporary access error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to revoke temporary access'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/auth/temporary-login - Login with temporary access code
async function temporaryLogin(request, env, corsHeaders) {
  try {
    const { access_code } = await request.json();

    if (!access_code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access code is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate the access code
    const token = await env.DB.prepare(`
      SELECT * FROM temporary_access
      WHERE access_code = ?
      AND is_active = 1
      AND datetime(expires_at) > datetime('now')
    `).bind(access_code).first();

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid, expired, or revoked access code'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark as used (first time) and update last activity
    // Note: Tokens can be used multiple times until they expire
    const updateQuery = token.is_used === 0
      ? `UPDATE temporary_access
         SET is_used = 1,
             used_at = CURRENT_TIMESTAMP,
             last_activity_at = CURRENT_TIMESTAMP,
             ip_address = ?
         WHERE access_code = ?`
      : `UPDATE temporary_access
         SET last_activity_at = CURRENT_TIMESTAMP
         WHERE access_code = ?`;

    if (token.is_used === 0) {
      await env.DB.prepare(updateQuery).bind(
        request.headers.get('cf-connecting-ip') || 'unknown',
        access_code
      ).run();
    } else {
      await env.DB.prepare(updateQuery).bind(access_code).run();
    }

    // Generate JWT for this temporary session
    const payload = {
      type: 'temporary',
      access_token: token.access_token,
      access_level: token.access_level,
      role: token.access_level, // Use access_level as role
      expires_at: token.expires_at,
      iat: Math.floor(Date.now() / 1000)
    };

    const jwtToken = await generateJWT(payload, env.JWT_SECRET || 'default-secret-change-in-production');

    // Log the login
    await env.DB.prepare(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)'
    ).bind(
      null, // No user_id for temporary access
      'temporary_login',
      JSON.stringify({
        access_code,
        access_level: token.access_level
      }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      token: jwtToken,
      user: {
        username: 'Temporary Access',
        role: token.access_level,
        access_type: 'temporary',
        expires_at: token.expires_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Temporary login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process temporary login'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/auth/verify-temporary-access - Verify temporary access token is valid
async function verifyTemporaryAccess(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization token provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, env.JWT_SECRET || 'default-secret-change-in-production');

    if (!payload || payload.type !== 'temporary') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid temporary access token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if still valid in database
    const accessToken = await env.DB.prepare(`
      SELECT * FROM temporary_access
      WHERE access_token = ?
      AND is_active = 1
      AND datetime(expires_at) > datetime('now')
    `).bind(payload.access_token).first();

    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Temporary access has been revoked or expired'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update last activity
    await env.DB.prepare(`
      UPDATE temporary_access
      SET last_activity_at = CURRENT_TIMESTAMP
      WHERE access_token = ?
    `).bind(payload.access_token).run();

    return new Response(JSON.stringify({
      success: true,
      valid: true,
      access_level: accessToken.access_level,
      expires_at: accessToken.expires_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Verify temporary access error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to verify temporary access'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// PSYCHOLOGY COACH ENDPOINT
// ============================================

async function generatePsychologyInsights(request, env, corsHeaders, user) {
  try {
    const data = await request.json();
    const { timeframe, totalTrades, avgRating, patterns, topEmotions, performanceByEmotion, bestStrategy, worstStrategy } = data;

    // Check if Claude API key is available
    const claudeApiKey = env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      // Return intelligent fallback insights without AI
      const insights = generateFallbackInsights(data);
      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare the prompt for Claude
    const prompt = `You are an expert trading psychology coach analyzing a trader's performance data. Based on the following information, provide personalized, actionable coaching insights in 3-5 paragraphs.

Timeframe: ${timeframe}
Total Trades Analyzed: ${totalTrades}
Average Self-Rating: ${avgRating}/5.0

${patterns.length > 0 ? `Detected Patterns:\n${patterns.map(p => `- ${p.title}: ${p.description}`).join('\n')}` : 'No significant patterns detected yet.'}

${topEmotions.length > 0 ? `Most Frequent Emotions:\n${topEmotions.map(([emotion, count]) => `- ${emotion}: ${count} trades`).join('\n')}` : ''}

${bestStrategy ? `Best Performing Strategy: ${bestStrategy[0]} (${bestStrategy[1].winRate}% win rate, $${bestStrategy[1].avgPL} avg P&L)` : ''}

${worstStrategy ? `Needs Improvement: ${worstStrategy[0]} (${worstStrategy[1].winRate}% win rate, $${worstStrategy[1].avgPL} avg P&L)` : ''}

Performance by Emotion:
${Object.entries(performanceByEmotion).slice(0, 5).map(([emotion, data]) =>
  `- ${emotion}: ${data.winRate}% win rate, $${data.avgPL} avg P&L`
).join('\n')}

Provide insights covering:
1. Key psychological strengths to leverage
2. Critical risk patterns to address immediately
3. Specific actionable recommendations
4. Mindset shifts that could improve performance
5. Warning signs to watch for

Be direct, supportive, and focus on actionable psychology improvements. Use a professional but encouraging tone.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      const insights = generateFallbackInsights(data);
      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    const insights = result.content[0].text;

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Psychology insights error:', error);
    // Return fallback insights on error
    const insights = generateFallbackInsights(await request.json());
    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Generate fallback insights when AI is not available
function generateFallbackInsights(data) {
  const { timeframe, totalTrades, avgRating, patterns, topEmotions, performanceByEmotion, bestStrategy, worstStrategy } = data;

  let insights = `Trading Psychology Analysis (${timeframe})\n\n`;

  insights += `📊 Overview:\nYou've logged ${totalTrades} trades with an average self-rating of ${avgRating}/5.0. `;

  if (parseFloat(avgRating) >= 4.0) {
    insights += `Your high self-rating suggests good self-awareness and disciplined execution.\n\n`;
  } else if (parseFloat(avgRating) >= 3.0) {
    insights += `There's room for improvement in your trading discipline and setup quality.\n\n`;
  } else {
    insights += `Your lower self-ratings indicate you may be aware of discipline issues. This awareness is the first step to improvement.\n\n`;
  }

  if (patterns.length > 0) {
    insights += `🚨 Critical Patterns Detected:\n`;
    patterns.forEach(p => {
      insights += `• ${p.title}: ${p.description}\n`;
    });
    insights += `\n`;
  }

  if (bestStrategy) {
    insights += `💪 Strengths to Leverage:\nYour ${bestStrategy[0]} strategy is performing exceptionally well with a ${bestStrategy[1].winRate}% win rate. Focus more on these high-probability setups.\n\n`;
  }

  if (worstStrategy) {
    insights += `⚠️ Areas for Improvement:\nYour ${worstStrategy[0]} approach needs refinement (${worstStrategy[1].winRate}% win rate). Consider reviewing these trades to identify what's not working.\n\n`;
  }

  insights += `🎯 Actionable Recommendations:\n`;
  insights += `1. Continue journaling every trade - you're building valuable data\n`;
  insights += `2. ${patterns.some(p => p.severity === 'critical') ? 'Take immediate action on critical psychological patterns' : 'Monitor your emotional states before entering trades'}\n`;
  insights += `3. ${bestStrategy ? `Double down on your ${bestStrategy[0]} setups` : 'Identify which strategies work best for you'}\n`;
  insights += `4. ${worstStrategy ? `Avoid or refine your ${worstStrategy[0]} approach until you understand what's failing` : 'Keep tracking performance by strategy'}\n`;

  return insights;
}