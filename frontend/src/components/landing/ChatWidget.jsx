import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Calendar, DollarSign, HelpCircle, Sparkles } from 'lucide-react';

const ChatWidget = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickActions = [
    { icon: Calendar, label: 'Book Demo', action: 'demo' },
    { icon: DollarSign, label: 'See Pricing', action: 'pricing' },
    { icon: HelpCircle, label: 'Ask Question', action: 'question' }
  ];

  const handleQuickAction = (action) => {
    if (action === 'demo') {
      setMessage("I'd like to book a demo");
    } else if (action === 'pricing') {
      setMessage("What's the pricing?");
    } else if (action === 'question') {
      setMessage("I have a question about ");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      // In production, this would send the message to your support system
      console.log('Message sent:', message);
      alert('Thanks for your message! Our team will respond shortly via email.');
      setMessage('');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', damping: 15 }}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative group"
            >
              {/* Pulsing ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse-slow"></div>

              {/* Button */}
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
                <MessageCircle className="text-white" size={28} />

                {/* Online badge */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-950 rounded-full"></div>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                <p className="text-sm text-white font-semibold">Need help? Chat with us!</p>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] flex flex-col"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50"></div>

            <div className="relative bg-slate-900 border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">TradeMetrics Support</h3>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Online now</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="text-white" size={20} />
                </button>
              </div>

              {/* Welcome Message */}
              <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">Welcome to TradeMetrics Pro!</p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      How can we help you today? Choose a quick action below or send us a message.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 space-y-3">
                <p className="text-slate-400 text-sm font-semibold mb-3">Quick Actions</p>
                {quickActions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.action)}
                    className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all group"
                  >
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                      <action.icon className="text-purple-400" size={20} />
                    </div>
                    <span className="text-white font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Message Form */}
              <form onSubmit={handleSubmit} className="p-6 pt-0 mt-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-4 pr-12 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="text-white" size={18} />
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 pb-4">
                <p className="text-xs text-slate-500 text-center">
                  Average response time: <span className="text-purple-400 font-semibold">2 minutes</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
