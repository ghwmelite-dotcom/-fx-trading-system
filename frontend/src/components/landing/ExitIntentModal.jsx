import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useExitIntent } from '../../hooks/useExitIntent';
import { useState } from 'react';

const ExitIntentModal = ({ onLoginClick }) => {
  const showExitIntent = useExitIntent(true);
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClaim = () => {
    // Scroll to early access section
    const section = document.getElementById('early-access');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    handleClose();
  };

  if (!showExitIntent || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-2xl w-full"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-3xl blur-xl opacity-75 animate-pulse-slow"></div>

          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="text-slate-400 hover:text-white" size={24} />
            </button>

            {/* Content */}
            <div className="text-center space-y-6">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="inline-flex"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-75"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Gift className="text-white" size={40} />
                  </div>
                </div>
              </motion.div>

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full"
              >
                <Clock size={16} className="text-purple-400" />
                <span className="text-purple-300 text-sm font-bold">LIMITED TIME OFFER</span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <h2 className="text-4xl md:text-5xl font-extrabold text-white">
                  Wait! Don't Miss Out
                </h2>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Get 20% Off Early Access
                </p>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 py-6"
              >
                <p className="text-lg text-slate-300 leading-relaxed">
                  Join now and get exclusive early bird pricing plus:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  {[
                    { icon: Sparkles, text: 'AI Psychology Coach Access' },
                    { icon: Gift, text: 'Priority Support' },
                    { icon: Sparkles, text: 'Advanced Analytics Unlocked' },
                    { icon: Gift, text: 'Lifetime Updates' }
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <benefit.icon className="text-purple-400 flex-shrink-0" size={20} />
                      <span className="text-slate-200 font-medium text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <button
                  onClick={handleClaim}
                  className="flex-1 group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Gift size={20} />
                  Claim 20% Discount
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button
                  onClick={handleClose}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/20 text-white rounded-xl font-semibold text-lg transition-all"
                >
                  No Thanks
                </button>
              </motion.div>

              {/* Timer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-slate-400 flex items-center justify-center gap-2"
              >
                <Clock size={14} className="text-orange-400" />
                Offer expires in 24 hours
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ExitIntentModal;
