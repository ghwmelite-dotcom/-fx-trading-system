/**
 * Exclusive Access System
 * Handles 100-user limit, waitlist, and invitation codes
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate random invitation code
function generateInvitationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Calculate access tier based on user number
function calculateAccessTier(userNumber) {
  if (userNumber <= 25) return 1; // Founding Members
  if (userNumber <= 75) return 2; // Early Adopters
  if (userNumber <= 100) return 3; // Beta Testers
  return 4; // Standard (waitlist/future users)
}

// Get tier benefits
function getTierBenefits(tier) {
  const benefits = {
    1: {
      name: 'Founding Member',
      badge: '🏆',
      pricing: 'Lifetime Free',
      invitations: 5,
      features: ['All features', 'Priority support', 'Exclusive Discord channel']
    },
    2: {
      name: 'Early Adopter',
      badge: '⭐',
      pricing: '50% Off Forever',
      invitations: 3,
      features: ['All features', 'Priority support']
    },
    3: {
      name: 'Beta Tester',
      badge: '🎯',
      pricing: 'Free for 1 Year',
      invitations: 2,
      features: ['All features', 'Community support']
    },
    4: {
      name: 'Member',
      badge: '👤',
      pricing: 'Standard',
      invitations: 1,
      features: ['All features']
    }
  };
  return benefits[tier] || benefits[4];
}

// ============================================
// PLATFORM LIMITS
// ============================================

// Get current platform stats
async function getPlatformStats(env) {
  try {
    const stats = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT max_users FROM platform_limits WHERE id = 1) as max_users,
        (SELECT COUNT(*) FROM users) as spots_taken,
        (SELECT COUNT(*) FROM waitlist WHERE status = 'waiting') as waitlist_size,
        (SELECT invitations_enabled FROM platform_limits WHERE id = 1) as invitations_enabled,
        (SELECT waitlist_enabled FROM platform_limits WHERE id = 1) as waitlist_enabled
    `).first();

    return {
      total_users: stats?.total_users || 0,
      max_users: stats?.max_users || 100,
      spots_taken: stats?.spots_taken || 0,
      spots_remaining: (stats?.max_users || 100) - (stats?.total_users || 0),
      waitlist_size: stats?.waitlist_size || 0,
      invitations_enabled: stats?.invitations_enabled === 1,
      waitlist_enabled: stats?.waitlist_enabled === 1,
      is_full: (stats?.total_users || 0) >= (stats?.max_users || 100)
    };
  } catch (error) {
    console.error('Error getting platform stats:', error);
    return {
      total_users: 0,
      max_users: 100,
      spots_taken: 0,
      spots_remaining: 100,
      waitlist_size: 0,
      invitations_enabled: true,
      waitlist_enabled: true,
      is_full: false
    };
  }
}

// Check if user can register (checks limit and invitation codes)
async function canUserRegister(env, invitationCode = null) {
  const stats = await getPlatformStats(env);

  // If not full, anyone can register
  if (!stats.is_full) {
    return { allowed: true, reason: null, user_number: stats.total_users + 1 };
  }

  // Platform is full - check invitation code
  if (invitationCode) {
    const codeValid = await validateInvitationCode(env, invitationCode);
    if (codeValid) {
      return { allowed: true, reason: 'invitation_code', user_number: null }; // Over limit, no number
    }
  }

  // Platform full, no valid invitation
  return {
    allowed: false,
    reason: 'platform_full',
    waitlist_size: stats.waitlist_size
  };
}

// ============================================
// INVITATION CODES
// ============================================

// Validate invitation code
async function validateInvitationCode(env, code) {
  if (!code) return false;

  try {
    const invitation = await env.DB.prepare(`
      SELECT * FROM invitation_codes
      WHERE code = ?
      AND status = 'active'
      AND current_uses < max_uses
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(code).first();

    return !!invitation;
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return false;
  }
}

// Mark invitation code as used
async function useInvitationCode(env, code, userId) {
  try {
    await env.DB.prepare(`
      UPDATE invitation_codes
      SET current_uses = current_uses + 1,
          used_by = ?,
          used_at = datetime('now'),
          status = CASE
            WHEN current_uses + 1 >= max_uses THEN 'used'
            ELSE 'active'
          END
      WHERE code = ?
    `).bind(userId, code).run();

    return true;
  } catch (error) {
    console.error('Error using invitation code:', error);
    return false;
  }
}

// Create invitation codes for user
async function createUserInvitations(env, userId, count = 3) {
  try {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = generateInvitationCode();
      await env.DB.prepare(`
        INSERT INTO invitation_codes (code, created_by, max_uses, status)
        VALUES (?, ?, 1, 'active')
      `).bind(code, userId).run();
      codes.push(code);
    }

    // Track in user_invitations
    await env.DB.prepare(`
      INSERT INTO user_invitations (user_id, code, max_uses, current_uses)
      VALUES (?, ?, ?, 0)
    `).bind(userId, codes.join(','), count).run();

    return codes;
  } catch (error) {
    console.error('Error creating invitation codes:', error);
    return [];
  }
}

// ============================================
// USER EXCLUSIVE FEATURES
// ============================================

// Set up exclusive features for new user
async function setupUserExclusiveFeatures(env, userId, userNumber, invitedBy = null, invitationCode = null) {
  try {
    const tier = calculateAccessTier(userNumber);
    const benefits = getTierBenefits(tier);

    // Create exclusive features record
    await env.DB.prepare(`
      INSERT INTO user_exclusive_features
      (user_id, user_number, early_access, access_tier, invited_by, invitation_code_used)
      VALUES (?, ?, 1, ?, ?, ?)
    `).bind(userId, userNumber, tier, invitedBy, invitationCode).run();

    // Create invitation codes for this user
    const invitationCodes = await createUserInvitations(env, userId, benefits.invitations);

    return {
      user_number: userNumber,
      tier,
      tier_name: benefits.name,
      badge: benefits.badge,
      pricing: benefits.pricing,
      invitation_codes: invitationCodes,
      features: benefits.features
    };
  } catch (error) {
    console.error('Error setting up exclusive features:', error);
    return null;
  }
}

// Get user exclusive features
async function getUserExclusiveFeatures(env, userId) {
  try {
    const features = await env.DB.prepare(`
      SELECT
        uef.*,
        (SELECT code FROM user_invitations WHERE user_id = uef.user_id LIMIT 1) as invitation_code
      FROM user_exclusive_features uef
      WHERE uef.user_id = ?
    `).bind(userId).first();

    if (!features) return null;

    const benefits = getTierBenefits(features.access_tier);

    return {
      user_number: features.user_number,
      tier: features.access_tier,
      tier_name: benefits.name,
      badge: benefits.badge,
      early_access: features.early_access === 1,
      invitation_codes: features.invitation_code ? features.invitation_code.split(',') : [],
      referral_count: features.referral_count || 0
    };
  } catch (error) {
    console.error('Error getting exclusive features:', error);
    return null;
  }
}

// ============================================
// WAITLIST
// ============================================

// Add to waitlist
async function addToWaitlist(env, data) {
  try {
    const { email, name, reason, experience_years, account_size, referral_code } = data;

    // Check if email already exists
    const existing = await env.DB.prepare(`
      SELECT id FROM waitlist WHERE email = ?
    `).bind(email).first();

    if (existing) {
      return { success: false, error: 'Email already on waitlist' };
    }

    // Calculate priority
    let priority = 0;
    if (experience_years === '5+') priority += 10;
    else if (experience_years === '3-5') priority += 5;
    if (parseInt(account_size || 0) > 10000) priority += 10;
    else if (parseInt(account_size || 0) > 5000) priority += 5;
    if (referral_code) priority += 15;

    // Add to waitlist (provide defaults for optional fields to avoid D1 undefined errors)
    const result = await env.DB.prepare(`
      INSERT INTO waitlist (email, name, reason, experience_years, account_size, priority, referral_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')
    `).bind(
      email,
      name,
      reason || null,
      experience_years || null,
      account_size || null,
      priority,
      referral_code || null
    ).run();

    // Get waitlist position
    const position = await env.DB.prepare(`
      SELECT COUNT(*) as position FROM waitlist WHERE id <= ?
    `).bind(result.meta.last_row_id).first();

    return {
      success: true,
      waitlist_id: result.meta.last_row_id,
      position: position?.position || 0,
      priority
    };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { success: false, error: error.message };
  }
}

// Get waitlist stats
async function getWaitlistStats(env) {
  try {
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'invited' THEN 1 END) as invited,
        COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered
      FROM waitlist
    `).first();

    return stats;
  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    return null;
  }
}

// Export all functions
export {
  getPlatformStats,
  canUserRegister,
  validateInvitationCode,
  useInvitationCode,
  setupUserExclusiveFeatures,
  getUserExclusiveFeatures,
  addToWaitlist,
  getWaitlistStats,
  getTierBenefits
};
