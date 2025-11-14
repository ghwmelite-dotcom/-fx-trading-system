/**
 * Email Service using Resend
 * Handles all email notifications for exclusive access system
 */

// Email templates
const emailTemplates = {
  waitlistConfirmation: (name, position, waitlistSize) => ({
    subject: '🎯 You\'re on the FX Metrics Waitlist!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .badge { display: inline-block; background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 10px 0; }
    .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-number { font-size: 32px; font-weight: bold; color: #8b5cf6; }
    .stat-label { font-size: 14px; color: #666; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to the Waitlist!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name || 'there'}! 👋</h2>
      <p>Thank you for your interest in <strong>FX Trade Metrics Pro</strong>. You've been added to our exclusive waitlist!</p>

      <div class="stats">
        <div class="stat">
          <div class="stat-number">#${position}</div>
          <div class="stat-label">Your Position</div>
        </div>
        <div class="stat">
          <div class="stat-number">${waitlistSize}</div>
          <div class="stat-label">Total on Waitlist</div>
        </div>
      </div>

      <h3>🏆 What happens next?</h3>
      <ul>
        <li>We'll notify you as soon as a spot opens up</li>
        <li>Early waitlist members get priority access</li>
        <li>You'll receive an invitation code when available</li>
        <li>Your position may improve based on referrals</li>
      </ul>

      <h3>💡 Want to move up faster?</h3>
      <p>Share your unique referral link with fellow traders! Each successful referral moves you up in the queue.</p>

      <p style="margin-top: 30px;">
        <strong>Stay tuned!</strong> We're building something special and can't wait to have you onboard.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://fx-trade-metrics-pro.ghwmelite.work" class="button">Visit Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>FX Trade Metrics Pro - Professional Trading Analytics</p>
      <p>You're receiving this because you joined our waitlist.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${name || 'there'}!\n\nThank you for joining the FX Trade Metrics Pro waitlist.\n\nYour position: #${position}\nTotal on waitlist: ${waitlistSize}\n\nWe'll notify you as soon as a spot opens up!\n\nBest regards,\nFX Metrics Team`
  }),

  spotAvailable: (name, invitationCode) => ({
    subject: '🎉 Your FX Metrics Spot is Ready!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .code-box { background: white; border: 2px dashed #8b5cf6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .code { font-size: 32px; font-weight: bold; color: #8b5cf6; letter-spacing: 4px; font-family: monospace; }
    .button { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 18px; font-weight: bold; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <h2>A Spot Just Opened Up!</h2>
    </div>
    <div class="content">
      <h2>Hi ${name || 'there'}! 🎊</h2>
      <p>Great news! We have a spot available for you in <strong>FX Trade Metrics Pro</strong>.</p>

      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #666;">Your Exclusive Invitation Code:</p>
        <div class="code">${invitationCode}</div>
        <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Use this code to register</p>
      </div>

      <div class="warning">
        <strong>⏰ Act Fast!</strong> This invitation expires in 48 hours. If you don't claim your spot, it will go to the next person on the waitlist.
      </div>

      <h3>✨ How to claim your spot:</h3>
      <ol>
        <li>Click the button below to visit the registration page</li>
        <li>Enter your details and paste your invitation code</li>
        <li>Start trading smarter today!</li>
      </ol>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://fx-trade-metrics-pro.ghwmelite.work/register?code=${invitationCode}" class="button">Claim Your Spot Now →</a>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <strong>Need help?</strong> Reply to this email and we'll assist you right away.
      </p>
    </div>
    <div class="footer">
      <p>FX Trade Metrics Pro - Professional Trading Analytics</p>
      <p>This invitation is personal and non-transferable.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Congratulations ${name || 'there'}!\n\nA spot just opened up in FX Trade Metrics Pro!\n\nYour invitation code: ${invitationCode}\n\nClaim your spot: https://fx-trade-metrics-pro.ghwmelite.work/register?code=${invitationCode}\n\n⏰ This invitation expires in 48 hours.\n\nBest regards,\nFX Metrics Team`
  }),

  applicationReceived: (name, queuePosition, priority) => ({
    subject: '✅ Application Received - FX Metrics Pro',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #8b5cf6; }
    .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Application Received!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name || 'there'}! 👋</h2>
      <p>Thank you for applying to become a <strong>Founding Member</strong> of FX Trade Metrics Pro!</p>

      <div class="stats">
        <div class="stat-number">#${queuePosition}</div>
        <div class="stat-label">Your Queue Position</div>
        <div style="margin-top: 15px;">
          <span style="background: #8b5cf6; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
            Priority Score: ${priority}
          </span>
        </div>
      </div>

      <div class="info-box">
        <strong>📋 What happens next?</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Our team will review your application within 24-48 hours</li>
          <li>We evaluate based on trading experience, account size, and commitment</li>
          <li>If approved, you'll receive an exclusive invitation code</li>
          <li>Founding Members get lifetime free access + 5 invitation codes</li>
        </ul>
      </div>

      <h3>🏆 Founding Member Benefits:</h3>
      <ul>
        <li>✨ <strong>Lifetime Free Access</strong> - Never pay a subscription</li>
        <li>🎫 <strong>5 Invitation Codes</strong> - Invite other traders</li>
        <li>🌟 <strong>Founding Member Badge</strong> - Exclusive recognition</li>
        <li>💬 <strong>Private Discord Channel</strong> - Connect with elite traders</li>
        <li>🚀 <strong>Priority Support</strong> - Direct access to our team</li>
        <li>🎯 <strong>Early Feature Access</strong> - Try new features first</li>
      </ul>

      <p style="margin-top: 30px; color: #666;">
        <strong>Tip:</strong> Applications with higher priority scores (experience + account size) are reviewed first.
      </p>
    </div>
    <div class="footer">
      <p>FX Trade Metrics Pro - Professional Trading Analytics</p>
      <p>Limited to 25 Founding Members</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${name}!\n\nYour application to become a Founding Member has been received.\n\nQueue Position: #${queuePosition}\nPriority Score: ${priority}\n\nWe'll review your application within 24-48 hours and notify you of the decision.\n\nBest regards,\nFX Metrics Team`
  }),

  applicationApproved: (name, invitationCode, expiresAt) => ({
    subject: '🎉 You\'re Approved! Founding Member Invitation',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .code-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; padding: 30px; text-align: center; margin: 25px 0; border-radius: 12px; }
    .code { font-size: 40px; font-weight: bold; color: #92400e; letter-spacing: 6px; font-family: monospace; margin: 15px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 18px 45px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .benefits { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .benefit-item:last-child { border-bottom: none; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 64px;">🏆</div>
      <h1>Congratulations!</h1>
      <h2>You're a Founding Member!</h2>
    </div>
    <div class="content">
      <h2>Welcome, ${name || 'Trader'}! 🎊</h2>
      <p>After careful review, we're excited to invite you to join FX Trade Metrics Pro as one of our <strong>25 Founding Members</strong>!</p>

      <div class="code-box">
        <p style="margin: 0; color: #78350f; font-size: 16px; font-weight: 600;">YOUR EXCLUSIVE INVITATION CODE</p>
        <div class="code">${invitationCode}</div>
        <p style="margin: 5px 0 0 0; color: #78350f; font-size: 14px;">Keep this code safe - it's your key to lifetime access</p>
      </div>

      <div class="warning">
        <strong>⏰ Important!</strong> This invitation expires in 7 days (${new Date(expiresAt).toLocaleDateString()}). Register now to secure your Founding Member status!
      </div>

      <div class="benefits">
        <h3 style="margin-top: 0;">🎁 Your Founding Member Benefits:</h3>
        <div class="benefit-item">🌟 <strong>Lifetime Free Access</strong> - Worth $99/month, yours forever</div>
        <div class="benefit-item">🎫 <strong>5 Invitation Codes</strong> - Bring your trading friends</div>
        <div class="benefit-item">🏆 <strong>Founding Member Badge</strong> - Permanent recognition</div>
        <div class="benefit-item">💬 <strong>Private Discord Channel</strong> - Elite community access</div>
        <div class="benefit-item">🚀 <strong>Priority Support</strong> - Direct line to our team</div>
        <div class="benefit-item">✨ <strong>Early Feature Access</strong> - Beta test new features</div>
        <div class="benefit-item">📊 <strong>All Premium Features</strong> - AI Coach, Analytics, Journal</div>
      </div>

      <h3>🚀 How to Register:</h3>
      <ol style="line-height: 2;">
        <li>Click the button below to visit the registration page</li>
        <li>Enter your details</li>
        <li>Paste your invitation code: <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${invitationCode}</code></li>
        <li>Start trading smarter today!</li>
      </ol>

      <div style="text-align: center; margin: 35px 0;">
        <a href="https://fx-trade-metrics-pro.ghwmelite.work?invite=${invitationCode}" class="button">
          🎉 Claim Your Founding Member Spot →
        </a>
      </div>

      <p style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb; color: #666; font-size: 14px;">
        <strong>Questions?</strong> Reply to this email or join our Discord. We're here to help!
      </p>
    </div>
    <div class="footer">
      <p><strong>FX Trade Metrics Pro - Founding Member #${Math.floor(Math.random() * 25) + 1}</strong></p>
      <p>Lifetime Access • Priority Support • Private Community</p>
      <p style="margin-top: 15px; font-size: 11px;">This invitation is personal and non-transferable.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Congratulations ${name}!\n\nYou've been approved as a Founding Member of FX Trade Metrics Pro!\n\nYour Invitation Code: ${invitationCode}\n\nExpires: ${new Date(expiresAt).toLocaleDateString()}\n\nRegister now: https://fx-trade-metrics-pro.ghwmelite.work?invite=${invitationCode}\n\nBenefits:\n- Lifetime Free Access\n- 5 Invitation Codes\n- Founding Member Badge\n- Private Discord Channel\n- Priority Support\n\nBest regards,\nFX Metrics Team`
  }),

  applicationRejected: (name) => ({
    subject: 'FX Metrics Application Update',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 16px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <h2>Hi ${name || 'there'},</h2>
      <p>Thank you for your interest in becoming a Founding Member of FX Trade Metrics Pro.</p>

      <p>After careful review, we're unable to offer you a Founding Member spot at this time. We received an overwhelming number of exceptional applications and had to make difficult choices for our limited 25 spots.</p>

      <div class="info-box">
        <strong>🌟 Good News!</strong>
        <p style="margin: 10px 0 0 0;">You're automatically on our priority list for the next tier:</p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
          <li><strong>Early Adopter</strong> (Spots 26-75)</li>
          <li>50% Off Forever</li>
          <li>3 Invitation Codes</li>
          <li>Early Adopter Badge</li>
        </ul>
      </div>

      <p>Registration for Early Adopter spots opens when Founding Member slots are filled. You'll be among the first to know!</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://fx-trade-metrics-pro.ghwmelite.work/waitlist" class="button">
          Join Early Adopter Waitlist
        </a>
      </div>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        We appreciate your interest and look forward to having you as an Early Adopter member!
      </p>
    </div>
    <div class="footer">
      <p>FX Trade Metrics Pro - Professional Trading Analytics</p>
      <p>Your trading journey matters to us</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Hi ${name},\n\nThank you for applying to FX Trade Metrics Pro.\n\nWhile we're unable to offer a Founding Member spot at this time, you're automatically on our priority list for Early Adopter access (50% off forever, 3 invitation codes).\n\nWe'll notify you as soon as registration opens!\n\nBest regards,\nFX Metrics Team`
  }),

  adminNewApplication: (applicantName, applicantEmail, priority, queuePosition, applicationData) => ({
    subject: `🚨 New Founding Member Application - Priority ${priority}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .priority-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; margin: 10px 0; }
    .priority-high { background: #10b981; color: white; }
    .priority-medium { background: #f59e0b; color: white; }
    .priority-low { background: #6b7280; color: white; }
    .info-grid { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: bold; width: 180px; color: #6b7280; }
    .info-value { flex: 1; color: #1f2937; }
    .why-section { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .action-buttons { margin: 25px 0; }
    .button { display: inline-block; padding: 12px 24px; margin: 5px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .btn-approve { background: #10b981; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 New Application Received</h1>
      <p style="margin: 5px 0; font-size: 16px;">Founding Member Application</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <div class="priority-badge ${priority >= 50 ? 'priority-high' : priority >= 30 ? 'priority-medium' : 'priority-low'}">
          Priority Score: ${priority}
        </div>
        <p style="color: #6b7280; margin-top: 10px;">Queue Position: #${queuePosition}</p>
      </div>

      <div class="info-grid">
        <h3 style="margin-top: 0; color: #1f2937;">Applicant Details</h3>
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value"><strong>${applicantName}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${applicantEmail}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Trading Experience:</div>
          <div class="info-value">${applicationData.experience_years || 'Not provided'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Account Size:</div>
          <div class="info-value">$${parseInt(applicationData.account_size || 0).toLocaleString()}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Trading Style:</div>
          <div class="info-value">${applicationData.trading_style || 'Not provided'}</div>
        </div>
        ${applicationData.proof_url ? `
        <div class="info-row">
          <div class="info-label">Proof of Trading:</div>
          <div class="info-value"><a href="${applicationData.proof_url}" target="_blank">View Screenshot</a></div>
        </div>
        ` : ''}
        ${applicationData.referral_source ? `
        <div class="info-row">
          <div class="info-label">Referral Source:</div>
          <div class="info-value">${applicationData.referral_source}</div>
        </div>
        ` : ''}
      </div>

      ${applicationData.why_you ? `
      <div class="why-section">
        <h3 style="margin-top: 0; color: #1e40af;">Why should we accept them?</h3>
        <p style="margin: 0; white-space: pre-wrap;">${applicationData.why_you}</p>
      </div>
      ` : ''}

      <div class="action-buttons" style="text-align: center;">
        <p style="color: #6b7280; margin-bottom: 15px;">Review this application:</p>
        <a href="https://fx-dashboard-api.ghwmelite.workers.dev/api/admin/applications" class="button btn-approve">
          View All Applications
        </a>
      </div>

      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⚡ Quick Actions:</strong><br>
          To approve via API: <code style="background: white; padding: 2px 6px; border-radius: 4px;">POST /api/admin/applications/[ID]/approve</code><br>
          To reject via API: <code style="background: white; padding: 2px 6px; border-radius: 4px;">POST /api/admin/applications/[ID]/reject</code>
        </p>
      </div>
    </div>
    <div class="footer">
      <p><strong>FX Trade Metrics Pro - Admin Notification</strong></p>
      <p>Founding Member Applications • Priority-based review system</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `New Founding Member Application Received!\n\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\nPriority Score: ${priority}\nQueue Position: #${queuePosition}\n\nExperience: ${applicationData.experience_years || 'N/A'}\nAccount Size: $${parseInt(applicationData.account_size || 0).toLocaleString()}\nTrading Style: ${applicationData.trading_style || 'N/A'}\n\n${applicationData.why_you ? `Why:\n${applicationData.why_you}\n\n` : ''}Review at: https://fx-dashboard-api.ghwmelite.workers.dev/api/admin/applications`
  }),

  welcomeNewUser: (name, userNumber, tier, invitationCodes) => ({
    subject: `🏆 Welcome to FX Metrics - You're Member #${userNumber}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .badge { font-size: 48px; margin-bottom: 10px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .tier-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .feature-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .feature:last-child { border-bottom: none; }
    .invitation-codes { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .code-item { background: #f3f4f6; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-weight: bold; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 18px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${tier === 1 ? '🏆' : tier === 2 ? '⭐' : '🎯'}</div>
      <h1>Welcome to FX Metrics Pro!</h1>
      <h2>You're Member #${userNumber}</h2>
    </div>
    <div class="content">
      <h2>Hi ${name || 'there'}! 🎉</h2>
      <p>Congratulations on joining the exclusive FX Trade Metrics Pro community!</p>

      <div class="tier-box">
        <h3 style="margin: 0; color: #92400e;">${tier === 1 ? '🏆 Founding Member' : tier === 2 ? '⭐ Early Adopter' : '🎯 Beta Tester'}</h3>
        <p style="margin: 10px 0 0 0; color: #78350f; font-size: 18px; font-weight: bold;">
          ${tier === 1 ? 'Lifetime Free Access' : tier === 2 ? '50% Off Forever' : 'Free for 1 Year'}
        </p>
      </div>

      <div class="feature-list">
        <h3>🎁 Your Benefits:</h3>
        <div class="feature">✅ Full access to all trading analytics</div>
        <div class="feature">✅ AI-powered insights and coaching</div>
        <div class="feature">✅ Advanced trade journaling</div>
        <div class="feature">✅ ${tier === 1 ? '5' : tier === 2 ? '3' : '2'} invitation codes to share</div>
        <div class="feature">✅ ${tier === 1 ? 'Exclusive founding member badge' : tier === 2 ? 'Early adopter recognition' : 'Beta tester access'}</div>
        ${tier === 1 ? '<div class="feature">✅ Priority support & private Discord channel</div>' : ''}
      </div>

      ${invitationCodes && invitationCodes.length > 0 ? `
      <div class="invitation-codes">
        <h3>🎫 Your Invitation Codes:</h3>
        <p>Share these with fellow traders to help them join the platform:</p>
        ${invitationCodes.map(code => `<div class="code-item">${code}</div>`).join('')}
        <p style="margin-top: 15px; font-size: 14px; color: #666;">Each code can be used once. Track referrals in your dashboard!</p>
      </div>
      ` : ''}

      <h3>🚀 Get Started:</h3>
      <ol>
        <li>Log in to your dashboard</li>
        <li>Connect your MT5 accounts</li>
        <li>Start tracking your trades automatically</li>
        <li>Explore AI-powered insights</li>
      </ol>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://fx-trade-metrics-pro.ghwmelite.work" class="button">Access Your Dashboard →</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666;">
        <strong>Need help getting started?</strong><br>
        Check out our quick start guide or reply to this email for support.
      </p>
    </div>
    <div class="footer">
      <p>FX Trade Metrics Pro - Member #${userNumber}</p>
      <p>${tier === 1 ? 'Founding Member' : tier === 2 ? 'Early Adopter' : 'Beta Tester'} • ${tier === 1 ? 'Lifetime Access' : tier === 2 ? '50% Off Forever' : 'Free for 1 Year'}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome to FX Metrics Pro!\n\nYou're Member #${userNumber}\nTier: ${tier === 1 ? 'Founding Member' : tier === 2 ? 'Early Adopter' : 'Beta Tester'}\n\nAccess your dashboard: https://fx-trade-metrics-pro.ghwmelite.work\n\nBest regards,\nFX Metrics Team`
  })
};

// Send email using Resend
async function sendEmail(resendApiKey, to, template) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FX Metrics Pro <noreply@ghwmelite.work>',
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Email send failed' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
export {
  emailTemplates,
  sendEmail
};
