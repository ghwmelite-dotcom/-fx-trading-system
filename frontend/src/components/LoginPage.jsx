import { useState, useEffect } from 'react';
import { Lock, Mail, AlertCircle, Loader, TrendingUp, DollarSign, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showTempAccess, setShowTempAccess] = useState(false);
  const [tempAccessCode, setTempAccessCode] = useState('');

  // Trading stats animation
  const [animatedStats, setAnimatedStats] = useState({
    profit: 0,
    trades: 0,
    winRate: 0
  });

  // Floating elements animation
  const [floatingElements, setFloatingElements] = useState([]);

  useEffect(() => {
    // Animate stats on mount
    const interval = setInterval(() => {
      setAnimatedStats(prev => ({
        profit: prev.profit < 15847 ? prev.profit + 200 : 15847,
        trades: prev.trades < 1247 ? prev.trades + 15 : 1247,
        winRate: prev.winRate < 68.5 ? prev.winRate + 0.8 : 68.5
      }));
    }, 30);

    // Generate floating elements
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      size: 20 + Math.random() * 40
    }));
    setFloatingElements(elements);

    // Load Cloudflare Turnstile
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    // Set up global callbacks for Turnstile
    window.onTurnstileSuccess = (token) => {
      setTurnstileToken(token);
      console.log('✅ Turnstile verification successful');
    };

    window.onTurnstileError = (error) => {
      console.error('❌ Turnstile error:', error);
      setTurnstileToken('dev-mode-bypass'); // Fallback for development
    };

    window.onTurnstileExpire = () => {
      console.warn('⚠️ Turnstile token expired');
      setTurnstileToken('');
    };

    script.onload = () => {
      console.log('✅ Turnstile script loaded');
    };

    script.onerror = () => {
      console.error('❌ Failed to load Turnstile script');
      setTurnstileToken('dev-mode-bypass'); // Fallback
    };

    document.body.appendChild(script);

    return () => {
      clearInterval(interval);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete window.onTurnstileSuccess;
      delete window.onTurnstileError;
      delete window.onTurnstileExpire;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Note: Turnstile verification is optional for development
    // In production, backend will enforce verification
    setLoading(true);

    try {
      await onLogin(username, password, turnstileToken || 'dev-mode-bypass');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      // Reset Turnstile on error
      if (window.turnstile) {
        window.turnstile.reset();
      }
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleTempAccessSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the temporary login endpoint
      const apiUrl = 'https://fx-dashboard-api.ghwmelite.workers.dev';
      const response = await fetch(`${apiUrl}/api/auth/temporary-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_code: tempAccessCode })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid access code');
      }

      // Store the token and user data
      localStorage.setItem('auth_token', data.token);

      // Call the onLogin callback with a special flag for temporary access
      if (onLogin.temporary) {
        await onLogin.temporary(data.user, data.token);
      } else {
        // Reload the page to trigger authentication
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'Failed to login with temporary access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Floating Trading Elements */}
      {floatingElements.map((elem) => (
        <div
          key={elem.id}
          className="absolute text-purple-500/10 pointer-events-none"
          style={{
            left: `${elem.left}%`,
            animationDelay: `${elem.delay}s`,
            animationDuration: `${elem.duration}s`,
            animation: 'float 20s infinite ease-in-out'
          }}
        >
          {elem.id % 4 === 0 && <TrendingUp size={elem.size} />}
          {elem.id % 4 === 1 && <DollarSign size={elem.size} />}
          {elem.id % 4 === 2 && <BarChart3 size={elem.size} />}
          {elem.id % 4 === 3 && <Activity size={elem.size} />}
        </div>
      ))}

      {/* Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden md:block space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                <TrendingUp className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">FX Trading</h1>
                <p className="text-purple-300">Analytics Platform</p>
              </div>
            </div>
            <p className="text-slate-300 text-lg">
              Professional trading journal with advanced analytics, risk management, and performance tracking.
            </p>
          </div>

          {/* Animated Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="text-green-400" size={20} />
                <span className="text-green-400 text-sm font-medium">Total Profit</span>
              </div>
              <p className="text-3xl font-bold text-white">
                ${animatedStats.profit.toLocaleString()}
              </p>
              <p className="text-green-300 text-sm mt-1">+12.5% this month</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-400" size={20} />
                <span className="text-blue-400 text-sm font-medium">Total Trades</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {animatedStats.trades.toLocaleString()}
              </p>
              <p className="text-blue-300 text-sm mt-1">All time</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 transform hover:scale-105 transition-all duration-300 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-purple-400" size={20} />
                <span className="text-purple-400 text-sm font-medium">Win Rate</span>
              </div>
              <div className="flex items-end gap-4">
                <p className="text-4xl font-bold text-white">
                  {animatedStats.winRate.toFixed(1)}%
                </p>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${animatedStats.winRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            {[
              'Advanced Performance Analytics',
              'Real-time Risk Management',
              'Comprehensive Trade Journal',
              'Multi-Account Support',
              'Category-based Insights'
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-slate-300 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50 md:hidden">
                <Lock className="text-white" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-400">Sign in to access your trading dashboard</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Toggle between regular login and temporary access */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setShowTempAccess(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  !showTempAccess
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Regular Login
              </button>
              <button
                type="button"
                onClick={() => setShowTempAccess(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  showTempAccess
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Temp Access
              </button>
            </div>

            {!showTempAccess ? (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
              <div className="group">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="cf-turnstile"
                  data-sitekey="0x4AAAAAAB_HmCMW24YIDUTm"
                  data-callback="onTurnstileSuccess"
                  data-error-callback="onTurnstileError"
                  data-expired-callback="onTurnstileExpire"
                  data-theme="dark"
                  data-size="normal"
                ></div>
                <p className="text-xs text-slate-500 text-center">
                  Protected by Cloudflare Turnstile
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>
            ) : (
              /* Temporary Access Form */
              <form onSubmit={handleTempAccessSubmit} className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    Enter the temporary access code provided by an administrator to get time-limited access to the admin portal.
                  </p>
                </div>

                {/* Access Code Field */}
                <div className="group">
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Access Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                    <input
                      type="text"
                      value={tempAccessCode}
                      onChange={(e) => setTempAccessCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      disabled={loading}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-lg tracking-wider"
                      maxLength={9}
                    />
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    Format: XXXX-XXXX (8 characters)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !tempAccessCode}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Access Portal
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Default Credentials Hint (Remove in production) */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-300 text-xs font-medium mb-2">🔐 Default Admin Credentials:</p>
              <div className="space-y-1 text-slate-400 text-xs font-mono">
                <p>Username: <span className="text-white">admin</span></p>
                <p>Password: <span className="text-white">admin123</span></p>
              </div>
            </div>

            {/* API Status (Development only) */}
            <div className="mt-4 text-center">
              <p className="text-slate-500 text-xs">
                API: fx-dashboard-api.ghwmelite.workers.dev
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                Powered by Cloudflare Workers & D1
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-100px) rotate(180deg); opacity: 0.3; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
