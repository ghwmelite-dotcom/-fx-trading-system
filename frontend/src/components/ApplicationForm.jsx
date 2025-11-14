import React, { useState } from 'react';
import { Mail, User, MessageSquare, TrendingUp, DollarSign, Check, Loader, AlertCircle, Award, Image } from 'lucide-react';

const ApplicationForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    experience_years: '',
    account_size: '',
    trading_style: '',
    why_you: '',
    proof_url: '',
    referral_source: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('https://fx-dashboard-api.ghwmelite.workers.dev/api/apply', {
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
        setResult({ error: data.error || 'Failed to submit application' });
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
              Application Submitted! 🎉
            </h2>
            <p className="text-gray-300 mb-6">
              Check your email for confirmation
            </p>

            <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-violet-400">#{result.queue_position}</div>
                  <div className="text-sm text-gray-400">Queue Position</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-400">{result.priority}</div>
                  <div className="text-sm text-gray-400">Priority Score</div>
                </div>
              </div>
            </div>

            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4 mb-6">
              <p className="text-violet-300 text-sm font-medium mb-2">
                🏆 Founding Member Benefits
              </p>
              <ul className="text-gray-400 text-xs space-y-1 text-left">
                <li>✓ Lifetime Free Access</li>
                <li>✓ 5 Invitation Codes</li>
                <li>✓ Priority Support</li>
                <li>✓ Private Discord</li>
              </ul>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-violet-500/30 rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 min-h-min">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Apply for Founding Member
            </h2>
            <p className="text-gray-400">
              Limited to 25 elite traders • Lifetime free access
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email & Name */}
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>

          {/* Experience & Account Size */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Trading Experience *
              </label>
              <select
                required
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
              <p className="text-xs text-gray-500 mt-1">More experience = higher priority (+15 pts)</p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Account Size (USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  required
                  value={formData.account_size}
                  onChange={(e) => setFormData({ ...formData, account_size: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Larger accounts get priority (+20 pts for $100k+)</p>
            </div>
          </div>

          {/* Trading Style */}
          <div>
            <label className="block text-white font-medium mb-2">
              Trading Style
            </label>
            <select
              value={formData.trading_style}
              onChange={(e) => setFormData({ ...formData, trading_style: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select your trading style</option>
              <option value="scalping">Scalping (seconds to minutes)</option>
              <option value="day">Day Trading (intraday)</option>
              <option value="swing">Swing Trading (days to weeks)</option>
              <option value="position">Position Trading (weeks to months)</option>
            </select>
          </div>

          {/* Why You */}
          <div>
            <label className="block text-white font-medium mb-2">
              Why should we accept you? *
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                required
                value={formData.why_you}
                onChange={(e) => setFormData({ ...formData, why_you: e.target.value })}
                rows={5}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="Tell us about your trading journey, goals, and why you'd be a great founding member..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.why_you.length} characters • Detailed answers (+10 pts for 200+ chars)
            </p>
          </div>

          {/* Proof URL (Optional) */}
          <div>
            <label className="block text-white font-medium mb-2">
              Proof of Trading (Optional)
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={formData.proof_url}
                onChange={(e) => setFormData({ ...formData, proof_url: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="https://imgur.com/your-trading-screenshot"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload screenshot to Imgur and paste link (+10 pts)</p>
          </div>

          {/* Referral Source */}
          <div>
            <label className="block text-white font-medium mb-2">
              How did you find us?
            </label>
            <input
              type="text"
              value={formData.referral_source}
              onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Twitter, YouTube, Friend, etc."
            />
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{result?.error || 'Something went wrong'}</p>
            </div>
          )}

          {/* Priority Score Preview */}
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-semibold">Estimated Priority Score</h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-400 mb-1">
                {(() => {
                  let score = 0;
                  if (formData.experience_years === '5+') score += 15;
                  else if (formData.experience_years === '3-5') score += 10;
                  else if (formData.experience_years === '1-3') score += 5;

                  const accountValue = parseInt(formData.account_size || 0);
                  if (accountValue >= 100000) score += 20;
                  else if (accountValue >= 50000) score += 15;
                  else if (accountValue >= 10000) score += 10;
                  else if (accountValue >= 5000) score += 5;

                  if (formData.why_you.length > 200) score += 10;
                  else if (formData.why_you.length > 100) score += 5;

                  if (formData.proof_url) score += 10;
                  if (formData.referral_source) score += 5;

                  return score;
                })()}
              </div>
              <div className="text-sm text-gray-400">
                Higher scores = faster review
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {status === 'loading' ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            By applying, you agree to our terms. We'll review your application within 24-48 hours.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
