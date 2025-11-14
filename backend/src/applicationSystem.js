// ============================================
// APPLICATION SYSTEM MODULE
// Handles curated access for first 25 spots
// ============================================

// Generate unique invitation code
function generateInvitationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if platform is in curated mode (first 25 spots)
export async function isCuratedMode(env) {
  const stats = await env.DB.prepare(`
    SELECT COUNT(*) as total_users FROM users
  `).first();

  return (stats?.total_users || 0) < 25;
}

// Submit application
export async function submitApplication(env, data) {
  try {
    const { email, name, experience_years, account_size, trading_style, why_you, proof_url, referral_source } = data;

    // Check if email already applied
    const existing = await env.DB.prepare(`
      SELECT id, status FROM applications WHERE email = ?
    `).bind(email).first();

    if (existing) {
      if (existing.status === 'pending') {
        return { success: false, error: 'Application already submitted and under review' };
      }
      if (existing.status === 'approved') {
        return { success: false, error: 'You have already been approved. Check your email for invitation code.' };
      }
      if (existing.status === 'rejected') {
        return { success: false, error: 'Application was previously rejected' };
      }
    }

    // Calculate priority score
    let priority = 0;

    // Experience scoring
    if (experience_years === '5+') priority += 15;
    else if (experience_years === '3-5') priority += 10;
    else if (experience_years === '1-3') priority += 5;

    // Account size scoring
    const accountValue = parseInt(account_size || 0);
    if (accountValue >= 100000) priority += 20;
    else if (accountValue >= 50000) priority += 15;
    else if (accountValue >= 10000) priority += 10;
    else if (accountValue >= 5000) priority += 5;

    // Why you text length (shows effort)
    if (why_you && why_you.length > 200) priority += 10;
    else if (why_you && why_you.length > 100) priority += 5;

    // Proof provided
    if (proof_url) priority += 10;

    // Referral source
    if (referral_source && referral_source.length > 0) priority += 5;

    // Insert application
    const result = await env.DB.prepare(`
      INSERT INTO applications
      (email, name, experience_years, account_size, trading_style, why_you, proof_url, referral_source, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      email,
      name,
      experience_years || null,
      account_size || null,
      trading_style || null,
      why_you || null,
      proof_url || null,
      referral_source || null,
      priority
    ).run();

    // Get position in queue
    const position = await env.DB.prepare(`
      SELECT COUNT(*) as position
      FROM applications
      WHERE status = 'pending' AND priority >= ?
    `).bind(priority).first();

    return {
      success: true,
      application_id: result.meta.last_row_id,
      priority,
      queue_position: position?.position || 1,
      message: 'Application submitted successfully! We\'ll review it within 24-48 hours.'
    };
  } catch (error) {
    console.error('Error submitting application:', error);
    return { success: false, error: error.message };
  }
}

// Get all applications (admin only)
export async function getApplications(env, filters = {}) {
  try {
    const { status, limit, offset } = filters;

    let query = `
      SELECT
        id,
        email,
        name,
        experience_years,
        account_size,
        trading_style,
        why_you,
        proof_url,
        referral_source,
        priority,
        status,
        invitation_code,
        created_at,
        reviewed_at
      FROM applications
    `;

    const conditions = [];
    const bindings = [];

    if (status) {
      conditions.push('status = ?');
      bindings.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY priority DESC, created_at ASC';

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    if (offset) {
      query += ` OFFSET ${parseInt(offset)}`;
    }

    const stmt = env.DB.prepare(query);
    const applications = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all();

    // Get total counts
    const counts = await env.DB.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(*) as total
      FROM applications
    `).first();

    return {
      success: true,
      applications: applications.results || [],
      counts: counts || { pending: 0, approved: 0, rejected: 0, total: 0 }
    };
  } catch (error) {
    console.error('Error getting applications:', error);
    return { success: false, error: error.message };
  }
}

// Approve application
export async function approveApplication(env, applicationId, adminId) {
  try {
    // Get application
    const application = await env.DB.prepare(`
      SELECT * FROM applications WHERE id = ?
    `).bind(applicationId).first();

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    if (application.status !== 'pending') {
      return { success: false, error: `Application is already ${application.status}` };
    }

    // Check if still in curated mode
    const inCuratedMode = await isCuratedMode(env);
    if (!inCuratedMode) {
      return { success: false, error: 'Platform no longer in curated mode. First 25 spots are full.' };
    }

    // Generate unique invitation code
    let invitationCode;
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      invitationCode = generateInvitationCode();
      const existing = await env.DB.prepare(`
        SELECT id FROM applications WHERE invitation_code = ?
        UNION
        SELECT id FROM invitation_codes WHERE code = ?
      `).bind(invitationCode, invitationCode).first();

      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return { success: false, error: 'Failed to generate unique invitation code' };
    }

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update application
    await env.DB.prepare(`
      UPDATE applications
      SET
        status = 'approved',
        invitation_code = ?,
        expires_at = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ?
      WHERE id = ?
    `).bind(invitationCode, expiresAt.toISOString(), adminId, applicationId).run();

    return {
      success: true,
      invitation_code: invitationCode,
      expires_at: expiresAt.toISOString(),
      applicant_email: application.email,
      applicant_name: application.name
    };
  } catch (error) {
    console.error('Error approving application:', error);
    return { success: false, error: error.message };
  }
}

// Reject application
export async function rejectApplication(env, applicationId, adminId, reason = null) {
  try {
    // Get application
    const application = await env.DB.prepare(`
      SELECT * FROM applications WHERE id = ?
    `).bind(applicationId).first();

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    if (application.status !== 'pending') {
      return { success: false, error: `Application is already ${application.status}` };
    }

    // Update application
    await env.DB.prepare(`
      UPDATE applications
      SET
        status = 'rejected',
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ?
      WHERE id = ?
    `).bind(adminId, applicationId).run();

    // Add note if reason provided
    if (reason) {
      await env.DB.prepare(`
        INSERT INTO application_notes (application_id, admin_id, note)
        VALUES (?, ?, ?)
      `).bind(applicationId, adminId, `Rejection reason: ${reason}`).run();
    }

    return {
      success: true,
      applicant_email: application.email,
      applicant_name: application.name
    };
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { success: false, error: error.message };
  }
}

// Validate invitation code from application
export async function validateApplicationInvite(env, code) {
  try {
    const application = await env.DB.prepare(`
      SELECT * FROM applications
      WHERE invitation_code = ?
        AND status = 'approved'
    `).bind(code).first();

    if (!application) {
      return { valid: false, error: 'Invalid invitation code' };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(application.expires_at);

    if (now > expiresAt) {
      return { valid: false, error: 'Invitation code has expired' };
    }

    // Check if platform still in curated mode
    const inCuratedMode = await isCuratedMode(env);
    if (!inCuratedMode) {
      return { valid: false, error: 'Founding member spots are now full' };
    }

    return {
      valid: true,
      application_id: application.id,
      email: application.email,
      name: application.name
    };
  } catch (error) {
    console.error('Error validating application invite:', error);
    return { valid: false, error: error.message };
  }
}

// Mark invitation code as used
export async function useApplicationInvite(env, code, userId) {
  try {
    const application = await env.DB.prepare(`
      SELECT id FROM applications WHERE invitation_code = ?
    `).bind(code).first();

    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // Mark as used (could add a used_at field if needed)
    await env.DB.prepare(`
      UPDATE applications
      SET status = 'used'
      WHERE id = ?
    `).bind(application.id).run();

    return { success: true };
  } catch (error) {
    console.error('Error using application invite:', error);
    return { success: false, error: error.message };
  }
}

// Get application stats
export async function getApplicationStats(env) {
  try {
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used,
        AVG(priority) as avg_priority,
        MAX(priority) as max_priority
      FROM applications
    `).first();

    const inCuratedMode = await isCuratedMode(env);
    const spotsRemaining = await env.DB.prepare(`
      SELECT 25 - COUNT(*) as remaining FROM users
    `).first();

    return {
      success: true,
      stats: {
        ...stats,
        curated_mode_active: inCuratedMode,
        founding_spots_remaining: Math.max(0, spotsRemaining?.remaining || 0)
      }
    };
  } catch (error) {
    console.error('Error getting application stats:', error);
    return { success: false, error: error.message };
  }
}
