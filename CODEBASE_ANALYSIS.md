# FX Trading Dashboard - Codebase Structure & Risk Metrics Implementation Guide

## PROJECT OVERVIEW

**Location:** C:\Users\rsimd\Desktop\fx-trading-system\frontend

### Technology Stack
- React 19.1.1 - UI Framework
- Vite 7.1.7 - Build tool
- Recharts 3.3.0 - Chart library (Area, Line, Bar, Pie charts)
- Tailwind CSS 4.1.15 - Styling
- Lucide React 0.546.0 - Icons
- XLSX (SheetJS) - Excel/CSV import/export
- Radix UI Tooltip 1.2.8 - Tooltip components

---

## 1. MAIN FRONTEND FILE STRUCTURE

### File Hierarchy
```
frontend/src/
├── main.jsx                  (Entry point - wraps App with ErrorBoundary)
├── App.jsx                   (Main dashboard component - 1636 lines)
├── ErrorBoundary.jsx         (Error handling component)
├── App.css                   (Global responsive styles)
├── index.css                 (Tailwind imports + base styles)
├── TooltipWrapper.jsx        (Tooltip utility component)
└── assets/                   (Static assets)
```

### Key File Details

**Location:** C:\Users\rsimd\Desktop\fx-trading-system\frontend\src\App.jsx
**Size:** 77,225 bytes | 1636 lines

---

## 2. APP.JSX STRUCTURE - KEY SECTIONS

### A. IMPORTS (Lines 1-5)
- React hooks: useState, useMemo, useEffect, useCallback
- Icons from lucide-react: Upload, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Calendar, Plus, Download, Settings, Wifi, WifiOff, X, Check, AlertCircle, Zap, Target, Edit, Trash2, Filter, Search
- Recharts: LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
- XLSX for Excel file handling

### B. COLOR PALETTE (Line 6)
```javascript
const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
// Purple, Pink, Cyan, Green, Amber, Red - Used for chart visualizations
```

### C. STATE MANAGEMENT (Lines 8-41)

**Trade Data State:**
- trades - Array of trade objects
- accounts - Array of account objects  
- selectedAccount - Current account filter ('all' or account ID)

**UI State:**
- activeTab - Current tab: 'overview', 'analytics', 'trades'
- showUpload, showManualEntry, showSettings, showEditTrade, showDeleteConfirm, showFilters - Modal/panel visibility flags
- selectedTrade - Currently selected trade for editing/deletion
- isOnline - API connection status
- isLoading - Data loading state
- notification - Toast notification {message, type}

**Pagination State (Lines 24-26):**
- currentPage - Current page number
- itemsPerPage - Items per page (default 50)

**API Configuration (Lines 29-30):**
- apiUrl - Cloudflare Worker URL
- apiKey - API authentication key

**Filter State (Lines 32-41):**
```javascript
{
  dateFrom: '',      // Start date filter
  dateTo: '',        // End date filter
  pair: '',          // Currency pair filter
  type: '',          // Trade type (buy/sell) filter
  minPnl: '',        // Minimum P&L filter
  maxPnl: '',        // Maximum P&L filter
  searchTerm: ''     // Free-text search filter
}
```

### D. INITIALIZATION (Lines 44-55)
- Loads API config from localStorage on mount
- Calls loadDataFromAPI if both URL and key are configured
- Sets loading state

### E. API HELPER FUNCTION (Lines 63-87)
```javascript
apiCall(endpoint, method = 'GET', body = null)
```
Makes authenticated fetch requests to Cloudflare Worker backend

### F. DATA LOADING (Lines 90-130)
```javascript
loadDataFromAPI(url, key) 
```
- Fetches /api/trades and /api/accounts endpoints in parallel
- Maps response data to trade/account object format
- Updates connection status and shows notifications

### G. FILTERING & SORTING (Lines 144-216)

**Filtered Trades (Lines 145-192):**
```javascript
filteredAndSearchedTrades = useMemo(() => {
  // Applies filters for: account, date range, pair, type, P&L range, search term
}, [trades, selectedAccount, filters]);
```

**Sorted Trades (Lines 195-203):**
```javascript
sortedTrades = useMemo(() => {
  // Sorts by date DESC (most recent first), then by ID DESC as tiebreaker
}, [filteredAndSearchedTrades]);
```

**Pagination (Lines 206-211):**
```javascript
paginatedTrades = useMemo(() => {
  // Slices sorted trades for current page
}, [sortedTrades, currentPage, itemsPerPage]);
```

---

## 3. ANALYTICS CALCULATION (Lines 218-303)

All analytics calculations are in a single useMemo hook for performance.

### Metrics Calculated:

**1. Profit/Loss Metrics (Lines 222-227)**
- totalPnL - Sum of all trade P&L
- winningTrades - Count of profitable trades
- losingTrades - Count of losing trades
- winRate - Percentage of winning trades

**2. Account Balance (Lines 229-231)**
- totalBalance - Sum of all account balances (or selected account)

**3. Pair Performance Analysis (Lines 233-247)**
```javascript
pairPerformance = {
  [pair]: {
    pnl: number,      // Total profit/loss for pair
    count: number,    // Number of trades
    wins: number,     // Winning trades
    losses: number    // Losing trades
  }
}
// Returns top 6 pairs sorted by P&L
```

**4. Daily P&L Tracking (Lines 250-270)**
```javascript
dailyPnL = {
  [date]: totalPnLForDate
}
// Creates chart data with daily P&L values
// Calculates cumulative P&L series
```

**5. Pie Chart Data (Lines 272-277)**
- Pair performance visualization data
- Absolute values with win/loss coloring

**6. Average Win/Loss & Profit Factor (Lines 279-287)**
```javascript
avgWin = totalWinProfit / winningTradeCount
avgLoss = Math.abs(totalLossProfit / losingTradeCount)
profitFactor = avgWin / avgLoss
```

### Returned Analytics Object:
```javascript
{
  totalPnL,           // Total profit/loss
  winningTrades,      // Count of winning trades
  losingTrades,       // Count of losing trades
  winRate,            // Win percentage (0-100)
  totalBalance,       // Account balance
  avgWin,             // Average winning trade profit
  avgLoss,            // Average losing trade loss
  profitFactor,       // Ratio of avg wins to avg losses
  topPairs,           // Top 6 currency pairs
  chartData,          // Daily/cumulative P&L for charts
  pieData,            // Pair performance for pie chart
  totalTrades         // Total number of trades
}
```

---

## 4. CHART IMPLEMENTATIONS (Recharts Usage)

### Chart 1: Cumulative P&L Area Chart (Lines 829-863)
**Location:** Overview Tab, Left Panel
**Data:** analytics.chartData (with cumulative field)
**Features:**
- Gradient fill (purple with opacity)
- Responsive container (100% x 300px)
- Dark theme tooltip
- Shows cumulative profit/loss trend

### Chart 2: Top Pairs Performance Pie Chart (Lines 872-903)
**Location:** Overview Tab, Right Panel
**Data:** analytics.pieData
**Features:**
- Shows top 6 pairs with percentages
- Color-coded by profitability
- Responsive container (100% x 300px)
- Dark theme tooltip

### Chart 3: Daily P&L Bar Chart (Lines 1035-1060)
**Location:** Analytics Tab, Right Panel
**Data:** analytics.chartData (pnl field)
**Features:**
- Green bars for profit, red bars for loss
- Responsive container (100% x 400px)
- Rounded bar tops
- Dark theme tooltip

### Recharts Components Used:
- ResponsiveContainer - Responsive wrapper
- AreaChart, Area - Cumulative visualization
- BarChart, Bar - Daily P&L bars
- PieChart, Pie - Pair performance
- XAxis, YAxis - Axes with custom styling
- CartesianGrid - Grid lines
- Tooltip - Hover tooltips (dark themed)
- Cell - Individual bar/pie coloring

---

## 5. TAB NAVIGATION STRUCTURE

### Tab Buttons (Lines 546-578)
Located after header, before search/filter section

**Existing Tabs:**
1. **'overview'** (Lines 766-982)
   - 4 key metrics cards
   - Cumulative P&L area chart
   - Pair performance pie chart
   - Recent trades table (10 rows)

2. **'analytics'** (Lines 985-1062)
   - Currency pair analysis (detailed breakdown)
   - Daily performance bar chart
   - Top 6 pairs performance list

3. **'trades
