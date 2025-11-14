import React, { useState } from 'react';
import { Mail, User, MessageSquare, TrendingUp, DollarSign, Check, Loader, AlertCircle } from 'lucide-react';

const WaitlistForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    reason: '',
    experience_years: '',
    account_size: '',
    referral_code: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('https://fx-dashboard-api.ghwmelite.workers.dev/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setResult(data);
      } else {
        setStatus('error');
        setResult({ error: data.error || 'Failed to join waitlist' });
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: 'Network error. Please try again.' });
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-green-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              You're On The List! 🎉
            </h2>
            <p className="text-gray-300 mb-6">
              Check your email for confirmation
            </p>

            <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-violet-400">#{result.position}</div>
                  <div className="text-sm text-gray-400">Your Position</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400">
                    {result.priority || 0}
                  </div>
                  <div className="text-sm text-gray-400">Priority Score</div>
                </div>
              </div>
            </div>

            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-6">
              <p className="text-violet-300 text-sm font-medium mb-2">
                💡 Want to move up faster?
              </p>
              <p className="text-gray-400 text-xs">
                Each professional trader you refer moves you higher in the queue. We'll send you a referral link soon!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/30 rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Join the Waitlist
            </h2>
            <p className="text-gray-400">
              Be notified when spots open up
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="width" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-white font-medium mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-white font-medium mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="John Trader"
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-white font-medium mb-2">
              Trading Experience
            </label>
            <select
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select experience level</option>
              <option value="<1">Less than 1 year</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5+">5+ years</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">More experience = higher priority</p>
          </div>

          {/* Account Size */}
          <div>
            <label className="block text-white font-medium mb-2">
              Account Size (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.account_size}
                onChange={(e) => setFormData({ ...formData, account_size: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Larger accounts get priority</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-white font-medium mb-2">
              Why should we accept you?
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="Tell us about your trading journey and goals..."
              />
            </div>
          </div>

          {/* Referral Code (optional) */}
          <div>
            <label className="block text-white font-medium mb-2">
              Referral Code (Optional)
            </label>
            <input
              type="text"
              value={formData.referral_code}
              onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent uppercase"
              placeholder="ABCD1234"
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Have a referral code? +15 priority points!</p>
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{result?.error || 'Something went wrong'}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {status === 'loading' ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Joining Waitlist...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Join Waitlist
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            By joining, you agree to receive email notifications when spots become available.
          </p>
        </form>
      </div>
    </div>
  );
};

export default WaitlistForm;
