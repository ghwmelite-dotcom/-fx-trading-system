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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={handleBackdropClick}
      style={{
        animation: mounted ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in'
      }}
    >
      {/* Animated Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl">
        {/* Floating animated particles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/15 rounded-full blur-2xl animate-float-slow"></div>
      </div>

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
        style={{
          animation: mounted ? 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideDown 0.3s ease-in'
        }}
      >
        {/* Glow effect behind modal */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-3xl blur-2xl"></div>

        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Animated gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 animate-gradient-shift"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:rotate-90 group"
          >
            <X size={20} className="text-slate-300 group-hover:text-white transition-colors" />
          </button>

          {/* Header Section */}
          <div className="relative px-6 sm:px-8 md:px-12 pt-10 sm:pt-12 md:pt-16 pb-8">
            {/* Logo and Title */}
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
              {/* Animated Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="text-white" size={32} />
                  <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" size={16} />
                </div>
              </div>

              {/* Title and Subtitle */}
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 animate-gradient-text">
                  Welcome Back
                </h2>
                <p className="text-slate-300 text-base sm:text-lg flex items-center justify-center gap-2">
                  <Shield size={18} className="text-purple-400" />
                  Login to TradeMetrics Pro
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 md:px-12 pb-10 sm:pb-12 space-y-5 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <div
                className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm flex items-start gap-3"
                style={{ animation: 'slideInTop 0.3s ease-out' }}
              >
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={12} className="text-red-400" />
                </div>
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold">Username</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors z-10" size={20} />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="relative w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-semibold">Password</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors z-10" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="relative w-full pl-12 pr-14 py-3.5 sm:py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 z-10"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-slate-400 hover:text-purple-400" />
                    ) : (
                      <Eye size={18} className="text-slate-400 hover:text-purple-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer transition-all"
                />
                <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-purple-400 text-sm hover:text-purple-300 transition-colors font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl animate-gradient-shift"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl blur-xl bg-gradient-to-r from-purple-500/50 to-blue-500/50 opacity-50 group-hover:opacity-75 transition-opacity"></div>

              {/* Button content */}
              <div className="relative px-6 py-4 flex items-center justify-center gap-3 text-yellow-400 font-bold text-base sm:text-lg transform group-hover:scale-105 transition-all duration-300">
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Dashboard</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {/* Demo Credentials */}
            <div className="pt-6 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm text-center mb-4 font-semibold">Quick Demo Access</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="group px-4 py-3 bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium">Admin Demo</span>
                    <Shield size={16} className="text-purple-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <code className="block text-purple-400 text-xs mt-1">admin / admin123</code>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials('trader')}
                  className="group px-4 py-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium">Trader Demo</span>
                    <TrendingUp size={16} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <code className="block text-blue-400 text-xs mt-1">trader / trader123</code>
                </button>
              </div>
            </div>

            {/* Contact Admin */}
            <p className="text-center text-slate-400 text-sm">
              Need an account?{' '}
              <button
                type="button"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline"
              >
                Contact Admin
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* CSS Animations */}
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
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
        }

        @keyframes slideInTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
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

        @keyframes gradient-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 25s ease-in-out infinite;
          animation-delay: -5s;
        }

        .animate-float-slow {
          animation: float 30s ease-in-out infinite;
          animation-delay: -10s;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
