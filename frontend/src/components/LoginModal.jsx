import { useState, useEffect } from 'react';
import { X, Lock, User, TrendingUp, Eye, EyeOff, Loader, Shield, Sparkles, ArrowRight } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, apiUrl }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTempAccess, setShowTempAccess] = useState(false);
  const [tempAccessCode, setTempAccessCode] = useState('');

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (isOpen) {
      setMounted(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Prevent zoom on input focus (iOS Safari)
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport && window.innerWidth < 640) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    } else {
      setMounted(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('resize', checkMobile);
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

  const handleTempAccessSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/temporary-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: tempAccessCode })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.user, data.token);
        onClose();
      } else {
        setError(data.error || 'Invalid access code');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 xs:p-2 sm:p-4 safe-area-inset"
      onClick={handleBackdropClick}
      style={{
        animation: mounted ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.15s ease-in'
      }}
    >
      {/* Simplified Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/97 via-purple-900/97 to-slate-900/97 backdrop-blur-md">
        {/* Subtle gradient orbs - performance optimized, hidden on very small screens */}
        <div className="hidden xs:block absolute top-1/4 left-1/4 w-64 xs:w-96 h-64 xs:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="hidden xs:block absolute bottom-1/4 right-1/4 w-64 xs:w-96 h-64 xs:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Modal Container - Ultra Responsive */}
      <div
        className="relative w-full h-full xs:h-auto xs:max-w-[96vw] sm:max-w-[440px] md:max-w-md mx-auto xs:max-h-[96vh] overflow-y-auto modal-scrollbar"
        style={{
          animation: mounted ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideDown 0.2s ease-in'
        }}
      >
        {/* Subtle glow effect - hidden on mobile for performance */}
        <div className="hidden xs:block absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 xs:rounded-2xl blur-xl"></div>

        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl xs:rounded-2xl border-0 xs:border border-white/10 shadow-2xl min-h-full xs:min-h-0 flex flex-col">
          {/* Subtle animated border */}
          <div className="absolute inset-0 xs:rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-gradient-shift"></div>

          {/* Close Button - Larger touch target on mobile */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 z-10 p-2.5 xs:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group active:scale-95"
            aria-label="Close"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* Compact Header - Safe area aware */}
          <div className="relative px-4 xs:px-5 sm:px-8 pt-12 xs:pt-10 sm:pt-10 pb-3 xs:pb-4 sm:pb-6 safe-top">
            <div className="flex flex-col items-center text-center space-y-2.5 xs:space-y-3 sm:space-y-4">
              {/* Logo */}
              <div className="relative">
                <div className="w-14 h-14 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <TrendingUp className="text-white" size={isMobile ? 26 : 24} />
                  <Sparkles className="absolute -top-1 -right-1 text-yellow-400" size={12} />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-0.5 xs:space-y-1">
                <h2 className="text-2xl xs:text-2xl sm:text-3xl font-bold text-white">
                  Welcome Back
                </h2>
                <p className="text-slate-400 text-xs xs:text-sm flex items-center justify-center gap-1.5">
                  <Shield size={13} className="text-purple-400" />
                  <span>Secure Login</span>
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Section */}
          <div className="px-4 xs:px-5 sm:px-8 pt-2">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setShowTempAccess(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  showTempAccess
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Temp Access
              </button>
            </div>
          </div>

          {/* Form Section - Ultra Responsive */}
          {!showTempAccess ? (
          <form onSubmit={handleSubmit} className="flex-1 px-4 xs:px-5 sm:px-8 pb-4 xs:pb-6 sm:pb-8 space-y-3 xs:space-y-4 overflow-y-auto safe-bottom">
            {/* Error Message */}
            {error && (
              <div
                className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm backdrop-blur-sm flex items-center gap-2"
                style={{ animation: 'slideInTop 0.2s ease-out' }}
              >
                <X size={14} className="text-red-400 flex-shrink-0" />
                <span className="flex-1 leading-tight">{error}</span>
              </div>
            )}

            {/* Username Field - Larger touch targets */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-xs sm:text-sm font-medium px-0.5">Username</label>
              <div className="relative group">
                <User className="absolute left-3 xs:left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" size={18} />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 xs:py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-[16px] xs:text-sm"
                  placeholder="Enter username"
                  required
                  autoFocus={!isMobile}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field - Larger touch targets */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-xs sm:text-sm font-medium px-0.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 xs:left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 xs:py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-[16px] xs:text-sm"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2.5 hover:bg-slate-700/50 rounded-lg transition-colors active:scale-95"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-slate-400 hover:text-purple-400" />
                  ) : (
                    <Eye size={18} className="text-slate-400 hover:text-purple-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password - Responsive */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer group min-h-[44px] xs:min-h-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 xs:w-3.5 xs:h-3.5 rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium min-h-[44px] xs:min-h-0 active:scale-95"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button - Larger touch target */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden mt-4 xs:mt-5 active:scale-[0.98] transition-transform"
              style={{ minHeight: '52px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200"></div>

              <div className="relative px-4 py-3.5 xs:py-3 flex items-center justify-center gap-2 text-white font-semibold text-base xs:text-sm sm:text-base">
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Dashboard</span>
                    <ArrowRight size={19} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {/* Collapsible Demo Credentials - Touch-friendly */}
            <details className="pt-3 xs:pt-4 border-t border-slate-700/50 group/demo">
              <summary className="text-slate-400 text-xs sm:text-sm text-center cursor-pointer list-none flex items-center justify-center gap-1.5 hover:text-slate-300 transition-colors min-h-[44px] xs:min-h-0">
                <span className="font-medium">Demo Access</span>
                <svg className="w-4 h-4 transition-transform group-open/demo:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 xs:gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="px-3.5 xs:px-3 py-3 xs:py-2 bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-left group/btn active:scale-[0.98]"
                  style={{ minHeight: '56px' }}
                >
                  <div className="flex items-center justify-between mb-1 xs:mb-0.5">
                    <span className="text-slate-300 text-sm xs:text-xs font-medium">Admin</span>
                    <Shield size={16} className="text-purple-400" />
                  </div>
                  <code className="block text-purple-400 text-xs xs:text-[10px] font-mono">admin / admin123</code>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials('trader')}
                  className="px-3.5 xs:px-3 py-3 xs:py-2 bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-left group/btn active:scale-[0.98]"
                  style={{ minHeight: '56px' }}
                >
                  <div className="flex items-center justify-between mb-1 xs:mb-0.5">
                    <span className="text-slate-300 text-sm xs:text-xs font-medium">Trader</span>
                    <TrendingUp size={16} className="text-blue-400" />
                  </div>
                  <code className="block text-blue-400 text-xs xs:text-[10px] font-mono">trader / trader123</code>
                </button>
              </div>
            </details>

            {/* Contact Admin - Touch-friendly */}
            <p className="text-center text-slate-400 text-xs pt-2 xs:pt-2 pb-1">
              Need an account?{' '}
              <button
                type="button"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors active:scale-95 inline-block min-h-[32px]"
              >
                Contact Admin
              </button>
            </p>
          </form>
          ) : (
          <form onSubmit={handleTempAccessSubmit} className="flex-1 px-4 xs:px-5 sm:px-8 pb-4 xs:pb-6 sm:pb-8 space-y-3 xs:space-y-4 overflow-y-auto safe-bottom">
            {/* Error Message */}
            {error && (
              <div
                className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm backdrop-blur-sm flex items-center gap-2"
                style={{ animation: 'slideInTop 0.2s ease-out' }}
              >
                <X size={14} className="text-red-400 flex-shrink-0" />
                <span className="flex-1 leading-tight">{error}</span>
              </div>
            )}

            {/* Info Banner */}
            <div className="px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs sm:text-sm backdrop-blur-sm">
              Enter the temporary access code provided by an administrator
            </div>

            {/* Access Code Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-xs sm:text-sm font-medium px-0.5">Access Code</label>
              <div className="relative group">
                <Lock className="absolute left-3 xs:left-3 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" size={18} />
                <input
                  type="text"
                  value={tempAccessCode}
                  onChange={(e) => setTempAccessCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-3 xs:py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-[16px] xs:text-sm font-mono tracking-wider"
                  placeholder="XXXX-XXXX"
                  required
                  maxLength={9}
                  autoComplete="off"
                />
              </div>
              <p className="text-slate-500 text-xs px-0.5">Format: XXXX-XXXX</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !tempAccessCode}
              className="w-full py-3 xs:py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/50 active:scale-[0.99] text-sm sm:text-base min-h-[48px] xs:min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Access Portal</span>
                  <ArrowRight size={16} className="opacity-75" />
                </>
              )}
            </button>
          </form>
          )}
        </div>
      </div>

      {/* CSS Animations & Responsive Styles - Optimized */}
      <style>{`
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

        /* Safe area support for notched devices (iPhone X+, etc.) */
        .safe-area-inset {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }

        .safe-top {
          padding-top: max(1rem, env(safe-area-inset-top));
        }

        .safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        /* Custom scrollbar for modal */
        .modal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* Firefox scrollbar */
        .modal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
        }

        /* Smooth scrolling for modal content */
        .modal-scrollbar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Prevent text size adjustment on mobile */
        input, button, textarea, select {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        /* Landscape orientation adjustments for small phones */
        @media (max-height: 500px) and (orientation: landscape) {
          .safe-top {
            padding-top: 0.5rem;
          }
          
          .safe-bottom {
            padding-bottom: 0.5rem;
          }

          /* Make modal fully scrollable in landscape */
          .modal-scrollbar {
            max-height: 100vh !important;
            height: 100vh !important;
          }
        }

        /* Extra small devices (320px and up) */
        @media (min-width: 320px) {
          .xs\:block { display: block; }
          .xs\:h-auto { height: auto; }
          .xs\:min-h-0 { min-height: 0; }
          .xs\:p-2 { padding: 0.5rem; }
          .xs\:px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .xs\:px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
          .xs\:py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .xs\:py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
          .xs\:py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .xs\:pt-10 { padding-top: 2.5rem; }
          .xs\:pb-4 { padding-bottom: 1rem; }
          .xs\:pb-6 { padding-bottom: 1.5rem; }
          .xs\:pt-4 { padding-top: 1rem; }
          .xs\:pt-2 { padding-top: 0.5rem; }
          .xs\:top-3 { top: 0.75rem; }
          .xs\:right-3 { right: 0.75rem; }
          .xs\:left-3 { left: 0.75rem; }
          .xs\:space-y-3 > * + * { margin-top: 0.75rem; }
          .xs\:space-y-4 > * + * { margin-top: 1rem; }
          .xs\:space-y-1 > * + * { margin-top: 0.25rem; }
          .xs\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .xs\:text-xs { font-size: 0.75rem; line-height: 1rem; }
          .xs\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
          .xs\:w-12 { width: 3rem; }
          .xs\:h-12 { height: 3rem; }
          .xs\:w-96 { width: 24rem; }
          .xs\:h-96 { height: 24rem; }
          .xs\:max-w-\[96vw\] { max-width: 96vw; }
          .xs\:max-h-\[96vh\] { max-height: 96vh; }
          .xs\:rounded-2xl { border-radius: 1rem; }
          .xs\:border { border-width: 1px; }
          .xs\:gap-2 { gap: 0.5rem; }
          .xs\:mt-5 { margin-top: 1.25rem; }
          .xs\:mb-0\.5 { margin-bottom: 0.125rem; }
          .xs\:text-\[10px\] { font-size: 10px; }
          .xs\:flex-row { flex-direction: row; }
          .xs\:items-center { align-items: center; }
          .xs\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        /* Prevent zoom on input focus (iOS Safari) - handled via viewport meta */
        @supports (-webkit-touch-callout: none) {
          input[type="text"],
          input[type="password"] {
            font-size: 16px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .border-white\/10 {
            border-color: rgba(255, 255, 255, 0.3);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
