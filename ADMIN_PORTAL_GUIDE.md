# Admin Portal - Complete Usage Guide

**Version**: 3.0.0
**Last Updated**: November 4, 2025
**Status**: ✅ Production Ready

---

## 🎯 Overview

The Admin Portal provides comprehensive administrative controls for managing users, monitoring system activity, and configuring platform settings. Only users with the **admin** role can access this portal.

### Access Requirements
- **Role**: Admin
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin123`
  - ⚠️ **CRITICAL**: Change this password immediately after first login!

---

## 🚀 Accessing the Admin Portal

### Step 1: Login
1. Navigate to the login page
2. Enter admin credentials
3. Click "Sign In"

### Step 2: Open Admin Portal
1. After login, you'll see the main dashboard
2. Click the **Admin** tab in the top navigation
3. The tab has a distinctive red/orange gradient badge
4. Admin Portal opens with Dashboard tab active

---

## 📊 Dashboard Tab

The Dashboard provides an at-a-glance view of system statistics and quick actions.

### Statistics Displayed

#### User Metrics
- **Total Users**: Count of all users in the system
- **Active Users**: Count of users with `is_active = 1`
- **Inactive Users**: Count of deactivated users
- **Recent Registrations**: Users created in the last 7 days

#### System Information
- **Platform Version**: Current version number
- **Database**: D1 database status
- **Uptime**: Worker deployment status

### Quick Actions
- **Create New User**: Opens user creation modal
- **View Audit Logs**: Jumps to Audit Logs tab
- **Platform Settings**: Jumps to Settings tab
- **Refresh Stats**: Reloads dashboard statistics

### Visual Indicators
- **Green Cards**: Positive metrics (active users, total users)
- **Blue Cards**: Informational metrics
- **Red Cards**: Warning metrics (inactive users)

---

## 👥 Users Tab

Complete user management interface for creating, editing, and managing user accounts.

### User List Display

#### Columns Shown
1. **ID**: Unique user identifier
2. **Username**: User's login username
3. **Email**: User's email address
4. **Full Name**: Display name
5. **Role**: Admin or User
6. **Status**: Active (green) or Inactive (red)
7. **Last Login**: Last successful login timestamp
8. **Created**: Account creation date
9. **Actions**: Management buttons

#### Action Buttons
- **Blue Pencil Icon**: Edit user details
- **Red Trash Icon**: Delete user (with confirmation)
- **Yellow Key Icon**: Reset user password
- **Green/Red Toggle**: Activate/deactivate user

### Creating a New User

#### Step 1: Open Creation Modal
- Click the **"Create New User"** button (purple/blue gradient)
- Modal appears with empty form

#### Step 2: Fill Required Fields
```
Username: * (required, must be unique)
Email: * (required, must be unique)
Password: * (required, min 6 characters)
Full Name: (optional)
Role: Admin or User (dropdown)
```

#### Step 3: Submit
- Click **"Create User"** button
- Success notification appears
- New user appears in the list
- User can immediately login

#### Validation Rules
- ✅ Username must be unique
- ✅ Email must be valid format and unique
- ✅ Password must be at least 6 characters
- ✅ All required fields must be filled

### Editing a User

#### Step 1: Click Edit Icon
- Click the blue **Pencil** icon next to the user
- Edit modal opens with current user data

#### Step 2: Modify Fields
You can change:
- Email address
- Full name
- Role (Admin ↔ User)
- Status (Active ↔ Inactive)

**Note**: Username and password cannot be changed via edit. Use password reset for password changes.

#### Step 3: Save Changes
- Click **"Save Changes"** button
- Success notification appears
- User list refreshes with new data
- Changes take effect immediately

### Deleting a User

#### Step 1: Click Delete Icon
- Click the red **Trash** icon next to the user
- Confirmation modal appears

#### Step 2: Review Details
The confirmation modal shows:
- Username being deleted
- Email address
- Current role
- Warning message about permanent deletion

#### Step 3: Confirm Deletion
- Click **"Delete"** button (red)
- Or click **"Cancel"** to abort
- If confirmed:
  - User is permanently removed from database
  - Action logged in audit trail
  - User list refreshes
  - Success notification appears

⚠️ **Warning**: Deletion is permanent and cannot be undone!

### Resetting User Password

#### Step 1: Click Key Icon
- Click the yellow **Key** icon next to the user
- Prompt dialog appears

#### Step 2: Enter New Password
- Type the new password in the prompt
- Must be at least 6 characters
- Click OK to confirm or Cancel to abort

#### Step 3: Password Updated
- Password is hashed and stored
- Success notification appears
- Action logged in audit trail
- User can immediately login with new password

**Use Cases**:
- User forgot password
- Security concern requiring password change
- Initial password setup for new users

### Activating/Deactivating Users

#### To Deactivate (Green → Red)
- Click the green **Toggle** icon
- User status changes to inactive
- User cannot login
- Trades remain visible

#### To Activate (Red → Green)
- Click the red **Toggle** icon
- User status changes to active
- User can login again
- Full access restored

**Use Cases**:
- Temporarily disable access without deleting account
- Former employees who may return
- Suspended accounts pending investigation

---

## 📋 Audit Logs Tab

Comprehensive activity tracking and monitoring system.

### What Gets Logged

#### Authentication Events
- `login` - Successful user login
- `logout` - User logout
- `failed_login` - Failed login attempt

#### User Management
- `create_user` - New user created
- `update_user` - User details modified
- `delete_user` - User deleted
- `reset_password` - Admin reset user password

#### Settings Changes
- `update_setting` - Platform setting modified
- `upload_logo` - Logo uploaded
- `upload_favicon` - Favicon uploaded

#### Trade Operations
- `create_trade` - New trade added
- `update_trade` - Trade modified
- `delete_trade` - Trade deleted

### Log Entry Format

Each log entry contains:
```json
{
  "id": 123,
  "user_id": 1,
  "username": "admin",
  "action": "reset_password",
  "target_user_id": 5,
  "target_username": "john_trader",
  "details": "{\"admin_reset\": true}",
  "ip_address": "203.0.113.42",
  "created_at": "2025-11-04 14:30:15"
}
```

### Viewing Audit Logs

#### Default View
- Shows most recent 100 entries
- Sorted by timestamp (newest first)
- Scrollable table with all details

#### Column Information
1. **Timestamp**: When action occurred
2. **User**: Who performed the action
3. **Action**: What was done
4. **Target**: Who/what was affected (if applicable)
5. **IP Address**: Source IP of the request
6. **Details**: Additional JSON data

### Filtering Logs (Future Enhancement)
Planned features:
- Filter by date range
- Filter by user
- Filter by action type
- Search by IP address
- Export to CSV/PDF

### Use Cases for Audit Logs

#### Security Monitoring
- Track failed login attempts
- Identify suspicious IP addresses
- Monitor admin actions

#### Compliance
- Prove who made what changes
- Audit trail for regulations
- Data access tracking

#### Troubleshooting
- Trace when a change was made
- Identify who deleted data
- Timeline reconstruction

---

## ⚙️ Settings Tab

Platform customization and configuration options.

### Platform Branding

#### 1. Platform Logo

**Purpose**: Replace text header with custom company logo

**Steps**:
1. Click **"Upload Logo"** button (purple/blue gradient)
2. Select image file from your computer
3. Wait for upload (you'll see "Uploading..." message)
4. Success notification appears
5. Logo immediately appears in header

**Requirements**:
- **Formats**: JPG, PNG, SVG, WebP
- **Max Size**: 2MB
- **Recommended**: SVG with transparent background
- **Dimensions**: 200-400px wide optimal

**Tips**:
- SVG format provides crisp display at all sizes
- Transparent background adapts to any theme
- Horizontal orientation works best
- Test visibility in both dark and light themes

**Preview**:
- Thumbnail preview shown in Settings tab
- Full-size logo displayed in header
- Visible to all users immediately

#### 2. Favicon (Browser Icon)

**Purpose**: Custom icon in browser tab, bookmarks, and history

**Steps**:
1. Click **"Upload Favicon"** button (orange/red gradient)
2. Select favicon file from your computer
3. Wait for upload (you'll see "Uploading..." message)
4. Success notification appears
5. **Page automatically reloads** to apply new favicon
6. New icon appears in browser tab

**Requirements**:
- **Formats**: ICO, PNG, SVG
- **Max Size**: 500KB
- **Recommended Size**: 32x32px or 64x64px
- **Best Format**: ICO (supports multiple sizes)

**Tips**:
- Use simple, recognizable icon
- Square aspect ratio (1:1)
- High contrast for visibility
- Test on both light and dark browser tabs
- ICO format can include multiple sizes (16x16, 32x32, 64x64)

**Tools for Creating Favicons**:
- [Favicon.io](https://favicon.io) - Generate from text, image, or emoji
- [RealFaviconGenerator](https://realfavicongenerator.net) - Multi-platform favicon generator

#### 3. Platform Name

**Purpose**: Custom text for browser title and header (when no logo)

**Steps**:
1. Find the **Platform Name** input field
2. Click in the field and type your desired name
3. Click outside the field or press Enter to save
4. Changes apply immediately

**Examples**:
```
"ABC Capital Trading"
"ProTrader Analytics"
"Your Company - FX Division"
"Elite Trading Platform"
```

**Where It Appears**:
- Browser tab title (always)
- Header text (only when no logo uploaded)
- Email subjects (future feature)
- PDF reports (future feature)

### Platform Settings List

Below the branding options, you'll see a list of all platform settings:

```
┌─────────────────┬───────────────────────────────────┐
│ Setting Key     │ Current Value                      │
├─────────────────┼───────────────────────────────────┤
│ platform_name   │ FX Trading Dashboard              │
│ logo_url        │ logos/company-logo-1730734215.svg │
│ favicon_url     │ favicons/icon-1730734230.ico      │
│ theme_mode      │ dark                              │
│ primary_color   │ #8b5cf6                           │
└─────────────────┴───────────────────────────────────┘
```

**Read-Only Display**:
- Shows current values
- Automatically updates after changes
- Includes metadata (last updated, updated by)

### Storage Information

All branding files are stored in:
- **Platform**: Cloudflare R2 (object storage)
- **Bucket**: `fx-trading-screenshots`
- **CDN**: Automatically distributed globally
- **Caching**: Browser caching enabled
- **Performance**: Fast load times worldwide

**File Naming**:
- Logos: `logos/filename-timestamp.ext`
- Favicons: `favicons/filename-timestamp.ext`
- Timestamp prevents caching issues

---

## 🔐 Security Best Practices

### Admin Account Security

#### Change Default Password Immediately
```
Default: admin / admin123
Change to: Strong unique password
```

#### Use Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No personal information
- Unique to this platform

#### Password Examples
```
❌ Bad: admin123, password, 12345678
✅ Good: Kj9#mP2$vL5@nQ8!wR3
```

### User Management Security

#### When Creating Users
- ✅ Use unique usernames
- ✅ Assign appropriate roles (principle of least privilege)
- ✅ Set strong initial passwords
- ✅ Document why user was created (in notes if available)

#### When Resetting Passwords
- ✅ Verify user identity before reset
- ✅ Use secure channel to communicate new password
- ✅ Instruct user to change password on first login
- ✅ Check audit logs after reset

#### When Deleting Users
- ✅ Verify deletion is necessary
- ✅ Archive or export user's trades first
- ✅ Document reason in change log
- ✅ Remember: deletion is permanent!

### Monitoring and Auditing

#### Regular Audit Log Review
- Check logs weekly for suspicious activity
- Look for failed login attempts
- Monitor admin actions
- Investigate unknown IP addresses

#### Red Flags to Watch For
- Multiple failed login attempts
- Logins from unusual locations
- Bulk user deletions
- Unexpected setting changes
- After-hours admin activity

---

## 📱 Mobile Access

The Admin Portal is fully responsive and works on mobile devices.

### Mobile Features
- ✅ Touch-optimized buttons
- ✅ Responsive tables
- ✅ Swipe-friendly modals
- ✅ Readable on small screens

### Mobile Limitations
- Audit log table may require horizontal scrolling
- Some advanced features easier on desktop
- File uploads work but may be slower

### Recommended Use
- Desktop/laptop for main administration
- Mobile for emergency access
- Tablet for on-the-go management

---

## 🆘 Troubleshooting

### Common Issues

#### "Unauthorized" Error
**Problem**: Can't access Admin Portal
**Solutions**:
1. Verify you're logged in as admin
2. Check if JWT token expired (login again)
3. Confirm user has admin role in database
4. Clear browser cache and cookies

#### User Creation Fails
**Problem**: "Username/email already exists"
**Solutions**:
1. Choose a different username
2. Check for typos in email
3. Search existing users to find conflict
4. Delete old user account if appropriate

#### Password Reset Not Working
**Problem**: User can't login after reset
**Solutions**:
1. Verify password was at least 6 characters
2. Check success notification appeared
3. Review audit logs for reset confirmation
4. Try resetting again
5. Check user is active (not deactivated)

#### Logo/Favicon Not Appearing
**Problem**: Uploaded file doesn't show
**Solutions**:
1. Verify file format is supported
2. Check file size is within limits
3. Clear browser cache (Ctrl+Shift+R)
4. Wait 30 seconds for CDN propagation
5. Check browser console for errors

#### Audit Logs Empty
**Problem**: No logs displayed
**Solutions**:
1. Verify database migrations ran
2. Check if audit_logs table exists
3. Perform some actions to generate logs
4. Refresh the page
5. Check browser console for API errors

---

## 🎓 Training Checklist

Use this checklist when training new admins:

### Basic Operations
- [ ] Login to admin account
- [ ] Navigate to Admin Portal
- [ ] View dashboard statistics
- [ ] Understand all four tabs

### User Management
- [ ] Create a new user
- [ ] Edit user details
- [ ] Reset a user's password
- [ ] Deactivate a user
- [ ] Reactivate a user
- [ ] Delete a user (test account only!)

### Monitoring
- [ ] View audit logs
- [ ] Understand log entry format
- [ ] Identify different action types
- [ ] Check IP addresses

### Platform Settings
- [ ] Upload a test logo
- [ ] Upload a test favicon
- [ ] Change platform name
- [ ] View settings list

### Security
- [ ] Change admin password
- [ ] Understand role differences
- [ ] Review security best practices
- [ ] Know what to log and monitor

---

## 📚 Additional Resources

### Documentation
- `README.md` - Complete project overview
- `FEATURES.md` - All features and status
- `SECURITY_AND_UX_FEATURES.md` - Security details
- `THEMING_AND_BRANDING_GUIDE.md` - Branding instructions
- `AUTHENTICATION_GUIDE.md` - Auth system details

### API Endpoints Reference

#### User Management
```
GET    /api/admin/users              # List all users
POST   /api/admin/users              # Create user
PUT    /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id          # Delete user
POST   /api/admin/users/:id/reset-password  # Reset password
```

#### Audit & Monitoring
```
GET    /api/admin/audit-logs         # View logs
GET    /api/admin/dashboard          # Dashboard stats
```

#### Platform Settings
```
GET    /api/admin/settings           # Get all settings
PUT    /api/admin/settings/:key      # Update setting
POST   /api/admin/settings/upload/logo     # Upload logo
POST   /api/admin/settings/upload/favicon  # Upload favicon
```

---

## ✅ Quick Reference

### Admin Portal Tabs
1. **Dashboard** 📊 - Statistics and overview
2. **Users** 👥 - User management
3. **Audit Logs** 📋 - Activity tracking
4. **Settings** ⚙️ - Platform configuration

### User Actions
- 🔵 **Edit** - Modify user details
- 🔴 **Delete** - Remove user permanently
- 🟡 **Key** - Reset password
- 🟢/🔴 **Toggle** - Activate/deactivate

### File Upload Limits
- **Logo**: 2MB, JPG/PNG/SVG/WebP
- **Favicon**: 500KB, ICO/PNG/SVG

### Password Requirements
- **Minimum Length**: 6 characters
- **Recommended**: 12+ characters with mixed case, numbers, symbols

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ CHANGE IMMEDIATELY!**

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Bulk user import from CSV
- [ ] Advanced audit log filtering
- [ ] Email notification settings
- [ ] Two-factor authentication setup
- [ ] IP whitelist/blacklist
- [ ] Session management dashboard
- [ ] User group/team management
- [ ] Custom role creation
- [ ] API key management
- [ ] System health monitoring

---

**Last Updated**: November 4, 2025
**Version**: 3.0.0
**Status**: ✅ Complete

For technical implementation details, see `SECURITY_AND_UX_FEATURES.md`
