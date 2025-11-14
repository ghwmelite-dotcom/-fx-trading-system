/**
 * ADD THESE SECTIONS TO YOUR backend/src/index.js FILE
 *
 * Instructions:
 * 1. Add the imports at the top of your file
 * 2. Add the endpoints in your main fetch handler
 * 3. Modify your existing registration endpoint (shown below)
 */

// ===================================================================
// SECTION 1: ADD THESE IMPORTS AT THE TOP OF index.js
// ===================================================================

import {
  getPlatformStats,
  canUserRegister,
  validateInvitationCode,
  useInvitationCode,
  setupUserExclusiveFeatures,
  getUserExclusiveFeatures,
  addToWaitlist,
  getWaitlistStats
} from './exclusiveAccess.js';

import { emailTemplates, sendEmail } from './emailService.js';


// ===================================================================
// SECTION 2: ADD THESE ENDPOINTS IN YOUR fetch() HANDLER
// Add these BEFORE your existing endpoints
// ===================================================================

    // ============================================
    // EXCLUSIVE ACCESS ENDPOINTS
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

    // GET /api/waitlist/stats - Waitlist statistics (admin only)
    if (path === '/api/waitlist/stats' && request.method === 'GET') {
      try {
        // Verify admin authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env.JWT_SECRET || 'your-secret-key');

        if (!payload || !payload.isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const stats = await getWaitlistStats(env);
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error getting waitlist stats:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get waitlist stats',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /api/invitation/validate - Validate invitation code
    if (path === '/api/invitation/validate' && request.method === 'POST') {
      try {
        const { code } = await request.json();

        if (!code) {
          return new Response(JSON.stringify({
            valid: false,
            error: 'Invitation code is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const isValid = await validateInvitationCode(env, code);

        return new Response(JSON.stringify({ valid: isValid }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error validating invitation code:', error);
        return new Response(JSON.stringify({
          valid: false,
          error: 'Validation failed'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /api/user/exclusive - Get user's exclusive features (authenticated)
    if (path === '/api/user/exclusive' && request.method === 'GET') {
      try {
        // Verify authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env.JWT_SECRET || 'your-secret-key');

        if (!payload || !payload.userId) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const features = await getUserExclusiveFeatures(env, payload.userId);

        if (!features) {
          return new Response(JSON.stringify({ error: 'No exclusive features found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify(features), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error getting exclusive features:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get exclusive features',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }


// ===================================================================
// SECTION 3: MODIFY YOUR EXISTING REGISTRATION ENDPOINT
// Find your registration endpoint and ADD THIS CODE at the beginning
// (before creating the user)
// ===================================================================

    // Example: if (path === '/api/auth/register' && request.method === 'POST') {
    //   const data = await request.json();
    //
    //   // ADD THIS CODE HERE (at the beginning of registration):
    //
    //   // Check if user can register (platform limit)
    //   const canRegister = await canUserRegister(env, data.invitationCode);
    //   if (!canRegister.allowed) {
    //     return new Response(JSON.stringify({
    //       success: false,
    //       error: 'Registration closed',
    //       message: 'We have reached our 100-user limit. Join the waitlist to be notified when spots open up!',
    //       waitlist_size: canRegister.waitlist_size,
    //       reason: canRegister.reason
    //     }), {
    //       status: 403,
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    //     });
    //   }
    //
    //   // ... continue with your existing registration code ...
    //   // (create user in database, etc.)
    //
    //   // AFTER creating the user successfully, ADD THIS CODE:
    //
    //   // Set up exclusive features for new user
    //   const exclusiveFeatures = await setupUserExclusiveFeatures(
    //     env,
    //     userId,  // The ID of the newly created user
    //     canRegister.user_number,
    //     null,  // invited_by (null for now)
    //     data.invitationCode
    //   );
    //
    //   // Mark invitation code as used (if provided)
    //   if (data.invitationCode) {
    //     await useInvitationCode(env, data.invitationCode, userId);
    //   }
    //
    //   // Send welcome email
    //   if (env.RESEND_API_KEY && exclusiveFeatures) {
    //     const template = emailTemplates.welcomeNewUser(
    //       data.name || data.username,
    //       exclusiveFeatures.user_number,
    //       exclusiveFeatures.tier,
    //       exclusiveFeatures.invitation_codes
    //     );
    //     await sendEmail(env.RESEND_API_KEY, data.email, template);
    //   }
    //
    //   // Include exclusive features in response
    //   return new Response(JSON.stringify({
    //     success: true,
    //     message: 'Registration successful',
    //     token: yourJwtToken,
    //     user: {
    //       id: userId,
    //       username: data.username,
    //       // ... other user fields
    //     },
    //     exclusive: exclusiveFeatures  // Add this
    //   }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    //   });
    // }


// ===================================================================
// SUMMARY OF CHANGES:
// ===================================================================
//
// 1. Added imports for exclusive access and email functions
// 2. Added 4 new API endpoints:
//    - GET  /api/platform/stats (public - spots remaining)
//    - POST /api/waitlist (public - join waitlist)
//    - GET  /api/waitlist/stats (admin - waitlist analytics)
//    - POST /api/invitation/validate (public - check invitation code)
//    - GET  /api/user/exclusive (authenticated - get user's features)
// 3. Modified registration to:
//    - Check user limit before allowing registration
//    - Set up exclusive features for new users
//    - Send welcome email with tier info and invitation codes
//
// ===================================================================
