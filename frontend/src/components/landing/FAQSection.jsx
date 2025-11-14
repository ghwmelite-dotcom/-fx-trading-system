import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

const FAQSection = ({ onLoginClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Platform',
      questions: [
        {
          q: 'How does the AI Psychology Coach work?',
          a: 'Our AI analyzes your trading journal entries, emotions, tags, and performance metrics to identify patterns in your decision-making. It provides personalized insights on emotional discipline, risk-taking behavior, and suggests areas for improvement based on behavioral finance principles.'
        },
        {
          q: 'What platforms do you integrate with?',
          a: 'We currently support MetaTrader 4 (MT4) and MetaTrader 5 (MT5) via webhook integration. Your trades sync automatically in real-time without manual entry. We\'re working on adding support for cTrader, TradingView, and other popular platforms.'
        },
        {
          q: 'Can I import my historical trades?',
          a: 'Yes! You can import trades via CSV upload from most trading platforms. We support standard MT4/MT5 export formats, as well as custom CSV templates. Historical data is essential for accurate analytics and AI insights.'
        }
      ]
    },
    {
      category: 'Security & Privacy',
      questions: [
        {
          q: 'How secure is my trading data?',
          a: 'We use bank-level AES-256 encryption for all data at rest and in transit. Your data is stored on Cloudflare\'s infrastructure with SOC 2 compliance. We implement role-based access control, audit logging, and regular security audits. We never sell or share your data.'
        },
        {
          q: 'Do you have access to my broker account?',
          a: 'No. We only receive trade data via webhook or manual entry. We never connect directly to your broker account and cannot execute trades on your behalf. Your broker credentials remain completely private.'
        },
        {
          q: 'Is my data backed up?',
          a: 'Yes. We maintain automated daily backups with point-in-time recovery. Your data is replicated across multiple geographic regions for redundancy and disaster recovery.'
        }
      ]
    },
    {
      category: 'Pricing & Access',
      questions: [
        {
          q: 'How much does TradeMetrics Pro cost?',
          a: 'We\'re currently in early access with exclusive beta pricing. Early adopters get lifetime discounts and priority features. Join the waitlist or apply for immediate access to lock in special pricing before public launch.'
        },
        {
          q: 'Is there a free trial?',
          a: 'Yes! Early access users get a 14-day trial to explore all features. No credit card required for the trial period. We want you to experience the full platform before committing.'
        },
        {
          q: 'What happens if I cancel?',
          a: 'You can cancel anytime. Your data remains accessible in read-only mode for 90 days, giving you time to export everything. We also offer data export in standard formats (CSV, JSON) at any time.'
        }
      ]
    },
    {
      category: 'Features',
      questions: [
        {
          q: 'What analytics metrics do you provide?',
          a: 'We calculate 30+ metrics including win rate, profit factor, Sharpe ratio, Sortino ratio, max drawdown, expectancy, average R, win/loss streaks, and more. Analytics can be filtered by currency pair, strategy, timeframe, session, and custom tags.'
        },
        {
          q: 'Can I track multiple trading accounts?',
          a: 'Yes! You can connect unlimited MT4/MT5 accounts and track them all in one dashboard. View consolidated analytics or filter by specific accounts. Perfect for traders managing multiple strategies or prop firm accounts.'
        },
        {
          q: 'Do you support mobile devices?',
          a: 'Yes! TradeMetrics Pro is a Progressive Web App (PWA) that works seamlessly on desktop, tablet, and mobile. Install it on your phone for offline access and native app experience. All features are fully responsive.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-5 mb-16"
        >
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-semibold mb-4">
            FAQ
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-white">
            Got
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Questions?
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about TradeMetrics Pro
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-14 pr-6 py-5 bg-slate-900/90 border-2 border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-xl"
            />
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-8">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <HelpCircle className="text-blue-400" size={24} />
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const index = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openIndex === index;

                    return (
                      <div
                        key={questionIndex}
                        className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl hover:border-white/20 transition-colors"
                      >
                        <button
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left group"
                        >
                          <span className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors pr-4">
                            {faq.q}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <ChevronDown className="text-slate-400 group-hover:text-blue-400 transition-colors" size={24} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-5 pt-0 border-t border-white/10">
                                <p className="text-slate-300 leading-relaxed pt-4">
                                  {faq.a}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <HelpCircle className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400 text-lg">No questions found matching "{searchQuery}"</p>
            </motion.div>
          )}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-50"></div>
            <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <MessageCircle className="text-blue-400 mx-auto mb-4" size={40} />
              <h3 className="text-2xl font-bold text-white mb-3">Still have questions?</h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Our team is here to help. Get in touch and we'll respond within 24 hours.
              </p>
              <button
                onClick={onLoginClick}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all hover:scale-105"
              >
                Contact Support
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQSection;
