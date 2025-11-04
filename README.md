# FX Trading Analytics Platform

**Version**: 3.0.0
**Last Updated**: November 4, 2025
**Status**: ✅ Production Ready

A professional, full-stack trading journal and analytics platform built with React, Cloudflare Workers, and D1 database. Features advanced risk metrics, trade management, admin controls, and beautiful UI with theme customization.

---

## 🎯 Overview

This platform provides traders with comprehensive tools to track, analyze, and improve their trading performance. It combines real-time data visualization, advanced risk metrics, trade journaling, and administrative controls into a beautiful, responsive interface.

### Key Highlights
- 🎨 **Beautiful UI**: Animated, glassmorphism design with dark/light themes
- 📊 **Advanced Analytics**: 16+ risk metrics including Sharpe ratio, drawdown, and more
- 🔐 **Secure**: Multi-user authentication with role-based access control
- 🛡️ **Bot Protection**: Cloudflare Turnstile integration
- 🎨 **Fully Brandable**: Custom logo, favicon, and platform name
- 📱 **Responsive**: Mobile-first design that works on all devices
- ⚡ **Fast**: Cloudflare edge network for global performance
- 🔧 **Admin Portal**: Complete user management and system controls

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fx-trading-system

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Development

```bash
# Terminal 1 - Start frontend (http://localhost:5174)
cd frontend
npm run dev

# Terminal 2 - Start backend (http://localhost:8787)
cd backend
npx wrangler dev --port 8787
```

### Default Login
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!

---

## ✨ Features

### 🎨 UI/UX Features
- ✅ **Beautiful Animated Login Page** - Trading-themed with floating icons, animated stats, and professional design
- ✅ **Dark/Light Theme Toggle** - Persistent theme preference with smooth transitions
- ✅ **Custom Branding** - Upload logo, favicon, and set platform name (admin only)
- ✅ **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- ✅ **Glassmorphism UI** - Modern backdrop-blur effects throughout

### 🔐 Authentication & Security
- ✅ **Multi-User Authentication** - JWT-based secure login system
- ✅ **Role-Based Access Control** - Admin and user roles with different permissions
- ✅ **Cloudflare Turnstile** - Bot protection on login page
- ✅ **Password Reset** - Admin can reset user passwords
- ✅ **Session Management** - 24-hour JWT tokens with auto-logout
- ✅ **Audit Logging** - Track all user actions and admin operations

### 👨‍💼 Admin Portal
- ✅ **Dashboard** - System stats, recent activity, and quick actions
- ✅ **User Management** - Create, edit, delete, activate/deactivate users
- ✅ **Password Reset** - Reset any user's password with one click
- ✅ **Audit Logs** - Comprehensive activity tracking with filtering
- ✅ **Platform Settings** - Branding, logo, favicon, and configuration
- ✅ **Role Management** - Assign admin/user roles

### 📊 Trading Analytics
- ✅ **Advanced Risk Metrics** - 16+ professional trading metrics:
  - Maximum Drawdown ($ and %)
  - Sharpe Ratio
  - Sortino Ratio
  - Calmar Ratio
  - MAE/MFE Analysis
  - Risk/Reward Ratio
  - Consecutive Win/Loss Streaks
  - Value at Risk (VaR)
  - Recovery Factor
  - Trade Expectancy
  - Volatility Analysis
  - And more...

- ✅ **Visual Analytics**
  - Equity curve with drawdown visualization
  - Daily P&L chart
  - Cumulative P&L chart
  - Trade distribution histogram
  - Per-pair performance breakdown

- ✅ **Performance Tracking**
  - Win rate and profit factor
  - Average win/loss amounts
  - Best/worst trades display
  - Monthly profitability tracking
  - Average trade duration

### 💼 Trade Management
- ✅ **Full CRUD Operations** - Create, read, update, delete trades
- ✅ **Advanced Filtering** - Filter by date range, pair, type, P&L
- ✅ **Global Search** - Search across all trade fields
- ✅ **Sorting & Pagination** - Handle thousands of trades efficiently
- ✅ **Bulk Import** - CSV/Excel file uploads
- ✅ **MT4/MT5 Integration** - Webhook for automated trade sync
- ✅ **Multi-Account Support** - Track multiple trading accounts

### 📝 Trade Journal (Foundation Ready)
- ✅ **Database Schema** - Notes, tags, ratings, emotions, screenshots
- ✅ **API Endpoints** - PATCH /api/trades/:id/journal
- ⏳ **UI Components** - Coming soon (see JOURNAL_IMPLEMENTATION_GUIDE.md)

---

## 📁 Project Structure

```
fx-trading-system/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── App.jsx             # Main app component (1800+ lines)
│   │   ├── index.css           # Global styles with theme variables
│   │   └── components/
│   │       ├── LoginPage.jsx           # Animated login page
│   │       ├── AdminPortal.jsx         # Admin interface
│   │       ├── PlatformSettings.jsx    # Branding settings
│   │       └── ... (more coming soon)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Cloudflare Worker API
│   ├── src/
│   │   └── index.js            # API endpoints (1900+ lines)
│   ├── migrations/
│   │   ├── 001_add_journal_columns.sql
│   │   ├── 002_create_users_and_audit_logs.sql
│   │   └── 003_create_settings_table.sql
│   ├── schema.sql              # Complete database schema
│   ├── wrangler.toml           # Cloudflare configuration
│   └── package.json
│
├── docs/                        # Documentation
│   ├── FEATURES.md                         # Feature tracking
│   ├── THEMING_AND_BRANDING_GUIDE.md      # Theme & branding guide
│   ├── AUTHENTICATION_GUIDE.md             # Auth implementation
│   ├── JOURNAL_IMPLEMENTATION_GUIDE.md     # Journal feature guide
│   └── ... (more documentation)
│
└── README.md                    # This file
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (wrangler.toml or Cloudflare Dashboard)
```toml
[vars]
JWT_SECRET = "your-secret-key-change-in-production"
TURNSTILE_SECRET_KEY = "your-cloudflare-turnstile-secret"
```

#### Frontend (.env or Cloudflare Pages)
```env
VITE_API_URL=https://fx-dashboard-api.ghwmelite.workers.dev
```

### Cloudflare Resources
- **D1 Database**: `fx-trading-db` (SQLite)
- **R2 Bucket**: `fx-trading-screenshots` (file storage for logos/screenshots)
- **Worker**: `fx-dashboard-api`
- **Pages**: Frontend deployment

---

## 🎨 Branding & Customization

### Theme Toggle
- Available to all users
- Sun/Moon icon in header
- Preference saved in localStorage
- Dark mode (default) and light mode

### Admin Branding Settings
Login as admin and go to **Admin → Settings**:

1. **Platform Logo**
   - Upload JPG, PNG, SVG, or WebP (max 2MB)
   - Appears in header across all pages
   - Recommendation: SVG with transparent background

2. **Favicon**
   - Upload ICO, PNG, or SVG (max 500KB)
   - Shows in browser tab
   - Recommendation: 32x32px ICO file

3. **Platform Name**
   - Appears in browser title
   - Shows in header when no logo uploaded
   - Example: "Your Company - FX Analytics"

See `THEMING_AND_BRANDING_GUIDE.md` for detailed instructions.

---

## 🔐 Security Features

### Implemented
- ✅ JWT authentication with 24-hour expiration
- ✅ Password hashing (SHA-256)
- ✅ Cloudflare Turnstile bot protection
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all admin actions
- ✅ CORS protection
- ✅ SQL injection protection (prepared statements)
- ✅ Input validation on all endpoints

### Setup Cloudflare Turnstile
1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a new site
3. Get your site key and secret key
4. Update `LoginPage.jsx` line 265 with your site key:
   ```javascript
   data-sitekey="YOUR_SITE_KEY_HERE"
   ```
5. Add secret key to Worker:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

---

## 🚀 Deployment

### Backend (Cloudflare Worker)

```bash
cd backend

# Run migrations (first time only)
npx wrangler d1 migrations apply fx-trading-db

# Deploy to production
npx wrangler deploy

# View logs
npx wrangler tail
```

### Frontend (Cloudflare Pages)

```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name fx-trading-dashboard
```

### Database Migrations

```bash
# List migrations
npx wrangler d1 migrations list fx-trading-db

# Apply pending migrations
npx wrangler d1 migrations apply fx-trading-db

# Create new migration
npx wrangler d1 migrations create fx-trading-db "migration_name"
```

---

## 📊 API Documentation

### Public Endpoints (No Auth)
```
GET  /api/settings                    # Platform branding settings
POST /api/login                       # User login
```

### User Endpoints (Requires JWT)
```
GET    /api/trades                    # List all trades
POST   /api/trades                    # Create trade
PUT    /api/trades/:id                # Update trade
DELETE /api/trades/:id                # Delete trade
PATCH  /api/trades/:id/journal        # Update journal fields

GET    /api/accounts                  # List accounts
POST   /api/accounts                  # Create account

GET    /api/profile                   # Get user profile
PUT    /api/profile                   # Update profile
```

### Admin Endpoints (Requires Admin Role)
```
# User Management
GET    /api/admin/users               # List all users
POST   /api/admin/users               # Create user
PUT    /api/admin/users/:id           # Update user
DELETE /api/admin/users/:id           # Delete user
POST   /api/admin/users/:id/reset-password  # Reset password

# Audit Logs
GET    /api/admin/audit-logs          # View audit logs

# Platform Settings
GET    /api/admin/settings            # Get all settings
PUT    /api/admin/settings/:key       # Update setting
POST   /api/admin/settings/upload/logo     # Upload logo
POST   /api/admin/settings/upload/favicon  # Upload favicon

# Dashboard Stats
GET    /api/admin/dashboard           # System statistics
```

### Webhook Endpoints (API Key Required)
```
POST /api/webhook/mt5                 # MT5 trade sync
POST /api/webhook/trade               # Generic trade webhook
```

---

## 📈 Performance

### Current Metrics
- **Frontend Bundle**: ~1MB JS (320KB gzipped), 44KB CSS (7KB gzipped)
- **Backend Worker**: ~51KB (7.5KB gzipped)
- **API Latency**: 20-50ms globally (Cloudflare edge network)
- **Database Queries**: <10ms average
- **Page Load**: <2s on 3G networks

### Optimization
- Lazy loading for large components
- useMemo/useCallback for expensive calculations
- Pagination for large datasets
- Edge caching for static assets
- Optimized SQL queries with indexes

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Login with admin credentials
- [ ] Login with user credentials
- [ ] Logout functionality
- [ ] Invalid credentials handling
- [ ] JWT token expiration
- [ ] Turnstile verification

#### User Features
- [ ] View trades in all tabs
- [ ] Create new trade
- [ ] Edit existing trade
- [ ] Delete trade with confirmation
- [ ] Filter by date, pair, type, P&L
- [ ] Global search functionality
- [ ] Pagination controls
- [ ] Theme toggle (dark/light)
- [ ] View analytics and risk metrics

#### Admin Features
- [ ] Access admin portal
- [ ] View dashboard statistics
- [ ] Create/edit/delete users
- [ ] Reset user password
- [ ] View audit logs
- [ ] Upload platform logo
- [ ] Upload favicon
- [ ] Change platform name

#### Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 🐛 Known Issues & Limitations

### Current Limitations
- ⚠️ Turnstile requires manual setup (site key configuration)
- ⚠️ R2 bucket must be created manually for logo/favicon uploads
- ⚠️ Default admin password should be changed immediately
- ⚠️ No email notifications yet (planned feature)
- ⚠️ Journal UI not yet implemented (backend ready)

### Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📚 Documentation

Comprehensive guides available:
- `FEATURES.md` - Complete feature list and status
- `THEMING_AND_BRANDING_GUIDE.md` - Theme and branding customization
- `AUTHENTICATION_GUIDE.md` - Auth system implementation details
- `JOURNAL_IMPLEMENTATION_GUIDE.md` - Trade journal feature guide
- `DEPLOYMENT_INFO.md` - Deployment instructions and URLs
- `ADMIN_PORTAL_GUIDE.md` - (Create this) Admin portal usage
- `SECURITY_GUIDE.md` - (Create this) Security best practices

---

## 🔄 Version History

### Version 3.0.0 - November 4, 2025 (Current)
- ✅ **Authentication System** - Multi-user JWT authentication
- ✅ **Admin Portal** - User management, audit logs, settings
- ✅ **Password Reset** - Admin can reset user passwords
- ✅ **Cloudflare Turnstile** - Bot protection on login
- ✅ **Animated Login Page** - Professional trading-themed design
- ✅ **Theme Toggle** - Dark/light mode switching
- ✅ **Custom Branding** - Logo, favicon, platform name
- ✅ **Comprehensive Audit Logs** - Track all system actions

### Version 2.1.0 - November 4, 2025
- ✅ Advanced risk metrics (16+ metrics)
- ✅ Risk analysis tab with visualizations
- ✅ Drawdown chart
- ✅ Trade distribution histogram
- ✅ Financial ratios (Sharpe, Sortino, Calmar)

### Version 2.0.0 - November 4, 2025
- ✅ Trade edit/delete functionality
- ✅ Advanced filtering system
- ✅ Global search
- ✅ Pagination
- ✅ Trade ordering improvements

### Version 1.0.0 - October 21, 2025
- Initial release
- Basic trade tracking
- Simple analytics
- CSV/Excel import
- MT4/MT5 webhooks

---

## 🚦 Roadmap

### Immediate (This Week)
- [ ] Complete trade journal UI components
- [ ] Screenshot upload to R2
- [ ] Update all documentation

### Short-term (This Month)
- [ ] Email notifications system
- [ ] PDF export functionality
- [ ] Advanced charting options
- [ ] Trade templates

### Medium-term (Next Quarter)
- [ ] Mobile app (React Native)
- [ ] Real-time trade updates (WebSockets)
- [ ] Social features / leaderboards
- [ ] AI-powered trade insights

### Long-term (Future)
- [ ] Broker integrations (API trading)
- [ ] Backtesting engine
- [ ] Strategy builder
- [ ] Community marketplace

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Update documentation
4. Commit with clear messages
5. Deploy to staging environment
6. Test in staging
7. Deploy to production
8. Update version history

### Code Standards
- React functional components with hooks
- Tailwind CSS for all styling
- RESTful API design
- Comprehensive error handling
- Mobile-first responsive design
- Comments for complex logic
- Security best practices

---

## 📞 Support & Contact

### Deployment URLs
- **Frontend**: https://fx-trading-dashboard.pages.dev
- **API**: https://fx-dashboard-api.ghwmelite.workers.dev
- **Latest Preview**: Check Cloudflare Pages dashboard

### Getting Help
1. Check documentation files in this repository
2. Review API endpoint examples
3. Check browser console for errors
4. Review Cloudflare Worker logs: `npx wrangler tail`

---

## ⚖️ License

Proprietary - All rights reserved

---

## 🙏 Acknowledgments

Built with:
- React & Vite
- Tailwind CSS
- Recharts
- Lucide React Icons
- Cloudflare Workers & D1
- Cloudflare Turnstile

---

**Last Updated**: November 4, 2025
**Current Version**: 3.0.0
**Status**: Production Ready ✅

For detailed feature information, see `FEATURES.md`
