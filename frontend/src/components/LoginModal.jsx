import { useState, useEffect } from 'react';
import { X, Lock, User, TrendingUp, Eye, EyeOff, Loader, Shield, Sparkles, ArrowRight } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, apiUrl }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setMounted(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
        onClose();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const fillDemoCredentials = (type) => {
    if (type === 'admin') {
      setCredentials({ username: 'admin', password: 'admin123' });
    } else {
      setCredentials({ username: 'trader', password: 'trader123' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
      style={{
        animation: mounted ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.15s ease-in'
      }}
    >
      {/* Simplified Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/97 via-purple-900/97 to-slate-900/97 backdrop-blur-md">
        {/* Subtle gradient orbs - performance optimized */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Modal Container - Responsive and compact */}
      <div
        className="relative w-full max-w-[95vw] sm:max-w-md mx-auto max-h-[95vh] overflow-y-auto"
        style={{
          animation: mounted ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideDown 0.2s ease-in'
        }}
      >
        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>

        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          {/* Subtle animated border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-gradient-shift"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            aria-label="Close"
          >
            <X size={18} className="text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* Compact Header */}
          <div className="relative px-5 sm:px-8 pt-8 sm:pt-10 pb-4 sm:pb-6">
            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
              {/* Logo */}
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <TrendingUp className="text-white" size={24} />
                  <Sparkles className="absolute -top-1 -right-1 text-yellow-400" size={12} />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome Back
                </h2>
                <p className="text-slate-400 text-sm flex items-center justify-center gap-1.5">
                  <Shield size={14} className="text-purple-400" />
                  <span>Secure Login</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form Section - Compact */}
          <form onSubmit={handleSubmit} className="px-5 sm:px-8 pb-6 sm:pb-8 space-y-4">
            {/* Error Message */}
            {error && (
              <div
                className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm backdrop-blur-sm flex items-center gap-2"
                style={{ animation: 'slideInTop 0.2s ease-out' }}
              >
                <X size={14} className="text-red-400 flex-shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-xs sm:text-sm font-medium">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-sm"
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-xs sm:text-sm font-medium">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-sm"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-slate-400 hover:text-purple-400" />
                  ) : (
                    <Eye size={16} className="text-slate-400 hover:text-purple-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button - Streamlined */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden mt-5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

              <div className="relative px-4 py-3 flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base">
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Dashboard</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {/* Collapsible Demo Credentials */}
            <details className="pt-4 border-t border-slate-700/50 group/demo">
              <summary className="text-slate-400 text-xs sm:text-sm text-center cursor-pointer list-none flex items-center justify-center gap-1.5 hover:text-slate-300 transition-colors">
                <span className="font-medium">Demo Access</span>
                <svg className="w-4 h-4 transition-transform group-open/demo:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all text-left group/btn"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-300 text-xs font-medium">Admin</span>
                    <Shield size={14} className="text-purple-400" />
                  </div>
                  <code className="block text-purple-400 text-[10px]">admin / admin123</code>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials('trader')}
                  className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all text-left group/btn"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-300 text-xs font-medium">Trader</span>
                    <TrendingUp size={14} className="text-blue-400" />
                  </div>
                  <code className="block text-blue-400 text-[10px]">trader / trader123</code>
                </button>
              </div>
            </details>

            {/* Contact Admin - Compact */}
            <p className="text-center text-slate-400 text-xs pt-2">
              Need an account?{' '}
              <button
                type="button"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Contact Admin
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* CSS Animations - Optimized */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        @keyframes slideInTop {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }

        /* Custom scrollbar for modal */
        .max-h-\[95vh\]::-webkit-scrollbar {
          width: 6px;
        }

        .max-h-\[95vh\]::-webkit-scrollbar-track {
          background: transparent;
        }

        .max-h-\[95vh\]::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }

        .max-h-\[95vh\]::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
