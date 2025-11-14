import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Brain, TrendingUp, BookOpen, BarChart3, Target, Shield, Zap, Award, Activity, ArrowRight, CheckCircle, Star, Users, Globe, Lock, Send, Sparkles, LineChart } from 'lucide-react';

// Import new components
import SpotCounter from './SpotCounter';
import WaitlistForm from './WaitlistForm';
import ApplicationForm from './ApplicationForm';
import ThemeToggle from './landing/ThemeToggle';
import ScrollProgress from './landing/ScrollProgress';
import LiveActivityFeed from './landing/LiveActivityFeed';
import ROICalculator from './landing/ROICalculator';
import ExitIntentModal from './landing/ExitIntentModal';
import InteractiveFeatureDemo from './landing/InteractiveFeatureDemo';
import FAQSection from './landing/FAQSection';
import ChatWidget from './landing/ChatWidget';
import TradingSimulator from './landing/TradingSimulator';
import BeforeAfterComparison from './landing/BeforeAfterComparison';
import GamificationSection from './landing/GamificationSection';
import TrustSignals from './landing/TrustSignals';
import { useMousePosition } from '../hooks/useMousePosition';

const LandingPage = ({ onLoginClick }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

  const mousePosition = useMousePosition();
  const { scrollYProgress } = useScroll();

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Animated counters for stats
  const [animatedStats, setAnimatedStats] = useState({
    trades: 0,
    uptime: 0,
    traders: 0
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      trades: 10000,
      uptime: 99.9,
      traders: 500
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        trades: Math.floor(targets.trades * progress),
        uptime: (targets.uptime * progress).toFixed(1),
        traders: Math.floor(targets.traders * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          trades: targets.trades,
          uptime: targets.uptime,
          traders: targets.traders
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI Psychology Coach',
      description: 'World\'s first AI-powered trading psychology analysis. Get personalized insights on emotional patterns and mental performance.',
      color: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500',
      highlight: 'NEW'
    },
    {
      icon: BookOpen,
      title: 'Smart Trade Journal',
      description: 'Log emotions, tags, ratings, screenshots, and notes. Track your trading journey with comprehensive data.',
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500',
      highlight: 'POPULAR'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Multi-dimensional analysis across pairs, timeframes, and strategies. Discover your trading edge.',
      color: 'from-cyan-500 to-teal-500',
      iconBg: 'bg-cyan-500',
      highlight: 'PRO'
    },
    {
      icon: Target,
      title: 'Risk Management',
      description: 'Real-time risk monitoring, loss alerts, and drawdown tracking to protect your capital.',
      color: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500',
      highlight: 'ESSENTIAL'
    },
    {
      icon: Activity,
      title: 'MT4/MT5 Integration',
      description: 'Automatic trade capture via webhook. Your trades sync in real-time without manual entry.',
      color: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-500',
      highlight: 'AUTO'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, role-based access, audit logs, and secure authentication.',
      color: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500',
      highlight: 'SECURE'
    }
  ];

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Professional Day Trader',
      avatar: '👨‍💼',
      rating: 5,
      text: 'The Psychology Coach changed everything. My win rate went from 45% to 68% in 2 months. Game changer!'
    },
    {
      name: 'Sarah Williams',
      role: 'Swing Trader',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Best trading journal I\'ve ever used. The emotion tracking helped me identify patterns I never knew existed.'
    },
    {
      name: 'David Kumar',
      role: 'Forex Trader',
      avatar: '👨‍💻',
      rating: 5,
      text: 'MT4 integration is seamless. Analytics dashboard is incredibly powerful yet easy to understand.'
    }
  ];

  const handleEarlyAccessSubmit = async (e) => {
    e.preventDefault();
    console.log('Early access request:', { name, email });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      setName('');
    }, 5000);
  };

  // Calculate parallax offset based on mouse position
  const parallaxOffset = {
    x: (mousePosition.x - window.innerWidth / 2) * 0.01,
    y: (mousePosition.y - window.innerHeight / 2) * 0.01
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Scroll Progress */}
      <ScrollProgress />

      {/* Enhanced Animated Background Particles with Mouse Parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large glowing orbs with parallax */}
        <motion.div
          className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ x: parallaxOffset.x, y: parallaxOffset.y }}
        />
        <motion.div
          className="absolute top-60 right-10 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ x: parallaxOffset.x * 1.5, y: parallaxOffset.y * 1.5 }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-cyan-500/35 rounded-full blur-3xl"
          animate={{
            x: [0, -15, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ x: parallaxOffset.x * 0.8, y: parallaxOffset.y * 0.8 }}
        />

        {/* Rising particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-500/20 text-2xl"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50
            }}
            animate={{
              y: -100,
              x: Math.random() * window.innerWidth,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            {['$', '📈', '📊', '💹'][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 animate-pulse-slow"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="text-white" size={26} />
                  </div>
                </motion.div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    TradeMetrics Pro
                  </div>
                  <div className="text-xs text-purple-400 font-semibold">AI-Powered Trading</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLoginClick}
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center gap-2"
                >
                  <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                  Login
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section with 3D Tilt Effect */}
        <motion.section
          style={{ y: heroY, opacity: heroOpacity }}
          className="pt-40 pb-32 px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-10">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm"
              >
                <Sparkles size={18} className="text-purple-400 animate-pulse" />
                <span className="text-white font-semibold text-sm">World's First AI-Powered Trading Psychology Platform</span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white leading-[1.1] tracking-tight">
                  Master Your
                  <br />
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 blur-2xl opacity-50"></span>
                    <motion.span
                      className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    >
                      Trading Mind
                    </motion.span>
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                  Transform your trading performance with AI psychology coaching, advanced analytics, and automated trade tracking
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6"
              >
                <motion.a
                  href="#early-access"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 flex items-center gap-3"
                  style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                  Get Early Access
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLoginClick}
                  className="px-10 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-sm"
                >
                  Login to Dashboard
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center justify-center gap-8 pt-10 text-slate-300 text-sm"
              >
                {[
                  'No credit card required',
                  'Early access program',
                  'Limited spots'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Enhanced Dashboard Preview with 3D Tilt */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-24 relative"
            >
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-blue-600/30 blur-3xl opacity-75 animate-pulse-slow"></div>

              <motion.div
                whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border-2 border-white/10 p-6 shadow-2xl backdrop-blur-xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Browser Chrome */}
                <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-4 border-b border-white/10 flex items-center justify-between mb-4">
                  <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">TradeMetrics Pro Dashboard</div>
                  <div className="w-20"></div>
                </div>

                {/* Dashboard Content */}
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { label: 'Total Profit', value: '$12,450', change: '+23.5%', color: 'green', icon: TrendingUp },
                      { label: 'Win Rate', value: '68.4%', change: '+12.1%', color: 'blue', icon: Target },
                      { label: 'Total Trades', value: '247', change: 'This month', color: 'purple', icon: BarChart3 }
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + idx * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="relative group"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                        <div className={`relative bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border-2 border-${stat.color}-500/30 rounded-2xl p-6 backdrop-blur-sm`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className={`text-${stat.color}-400 text-sm font-semibold uppercase tracking-wide`}>{stat.label}</div>
                            <stat.icon size={20} className={`text-${stat.color}-400`} />
                          </div>
                          <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                          <div className={`flex items-center gap-2 text-${stat.color}-400 text-sm font-medium`}>
                            <TrendingUp size={14} />
                            <span>{stat.change}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="bg-slate-950/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-slate-300 font-semibold">Performance Over Time</div>
                      <LineChart size={18} className="text-slate-500" />
                    </div>
                    <div className="h-40 flex items-end gap-3">
                      {[30, 55, 40, 75, 50, 85, 65, 90, 55, 95, 70, 88].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 1.7 + i * 0.05, type: 'spring' }}
                          className="flex-1 bg-gradient-to-t from-purple-600 via-pink-500 to-blue-500 rounded-t-xl relative group cursor-pointer"
                          style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                          whileHover={{ scaleY: 1.1 }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                            ${(height * 100).toFixed(0)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Live Activity Feed */}
        <LiveActivityFeed />

        {/* Exclusive Access Spot Counter */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-5xl mx-auto">
            <SpotCounter
              onWaitlistClick={() => setShowWaitlist(true)}
              onApplyClick={() => setShowApplication(true)}
            />
          </div>
        </section>

        {/* ROI Calculator */}
        <ROICalculator onLoginClick={onLoginClick} />

        {/* Before/After Comparison */}
        <BeforeAfterComparison onLoginClick={onLoginClick} />

        {/* Interactive Feature Demo */}
        <InteractiveFeatureDemo onLoginClick={onLoginClick} />

        {/* Trading Simulator */}
        <TradingSimulator onLoginClick={onLoginClick} />

        {/* Gamification */}
        <GamificationSection onLoginClick={onLoginClick} />

        {/* Stats Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Activity, value: `${animatedStats.trades.toLocaleString()}+`, label: 'Trades Analyzed', color: 'purple' },
                { icon: Zap, value: `${animatedStats.uptime}%`, label: 'Uptime', color: 'blue' },
                { icon: Users, value: `${animatedStats.traders}+`, label: 'Active Traders', color: 'pink' },
                { icon: Globe, value: '24/7', label: 'Access', color: 'cyan' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center space-y-4 group"
                >
                  <div className={`inline-flex p-4 bg-${stat.color}-500/10 rounded-2xl border border-${stat.color}-500/20 transition-transform`}>
                    <stat.icon className={`text-${stat.color}-400`} size={32} />
                  </div>
                  <div className="text-5xl font-bold text-white">{stat.value}</div>
                  <div className="text-slate-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <TrustSignals />

        {/* Testimonials */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-5 mb-20"
            >
              <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-semibold mb-4">
                TESTIMONIALS
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold text-white">
                Loved by Traders
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Worldwide
                </span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/5 rounded-3xl p-8 hover:border-white/20 transition-all backdrop-blur-sm"
                >
                  <div className="flex gap-1 mb-5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-300 leading-relaxed mb-6 text-lg">"{testimonial.text}"</p>

                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-white text-lg">{testimonial.name}</div>
                      <div className="text-slate-400 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection onLoginClick={onLoginClick} />

        {/* Early Access */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative" id="early-access">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-5 mb-16"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm animate-pulse">
                <Sparkles size={18} className="text-purple-400" />
                <span className="text-white font-semibold text-sm">Limited Early Access Spots</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold text-white">
                Join the
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Waitlist
                </span>
              </h2>
              <p className="text-xl text-slate-300">
                Be among the first to experience TradeMetrics Pro
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-blue-600/30 blur-3xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-10 backdrop-blur-xl">
                {submitted ? (
                  <div className="text-center py-12 animate-fade-in">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 10 }}
                      className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle size={40} className="text-green-400" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-3">You're on the list!</h3>
                    <p className="text-slate-300 text-lg">We'll be in touch soon with your early access invitation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleEarlyAccessSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="block text-white text-sm font-semibold">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-white text-sm font-semibold">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-2xl shadow-purple-500/50 flex items-center justify-center gap-3 group"
                    >
                      <Send size={22} />
                      Request Early Access
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                    </motion.button>

                    <p className="text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                      <Lock size={14} className="text-green-400" />
                      Your information is secure and will never be shared
                    </p>
                  </form>
                )}

                {/* Benefits */}
                {!submitted && (
                  <div className="grid md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-white/10">
                    {[
                      { icon: Zap, title: 'Priority Access', desc: 'Be first in line' },
                      { icon: Award, title: 'Special Pricing', desc: 'Exclusive discounts' },
                      { icon: Users, title: 'VIP Support', desc: 'Dedicated help' }
                    ].map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-center space-y-3"
                      >
                        <div className="inline-flex p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <benefit.icon className="text-purple-400" size={24} />
                        </div>
                        <div className="text-white font-bold">{benefit.title}</div>
                        <div className="text-slate-400 text-sm">{benefit.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-10 relative"
          >
            <h2 className="text-5xl sm:text-6xl font-bold text-white">
              Ready to Level Up
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your Trading?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join hundreds of traders improving their performance with AI-powered insights
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <motion.a
                href="#early-access"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-2xl shadow-purple-500/50 flex items-center gap-3"
              >
                Get Early Access
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLoginClick}
                className="px-10 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-sm"
              >
                Login to Dashboard
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-white" size={24} />
                  </div>
                  <span className="text-xl font-bold text-white">TradeMetrics Pro</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  AI-powered trading psychology and performance platform
                </p>
              </div>

              {[
                { title: 'Product', links: ['Features', 'Early Access', 'Integrations', 'API'] },
                { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] }
              ].map((section, idx) => (
                <div key={idx}>
                  <h4 className="font-bold text-white mb-5">{section.title}</h4>
                  <ul className="space-y-3">
                    {section.links.map((link, i) => (
                      <li key={i}>
                        <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-400 text-sm">
                © 2025 TradeMetrics Pro. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Lock size={14} className="text-green-400" />
                <span className="text-slate-400">Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && <WaitlistForm onClose={() => setShowWaitlist(false)} />}

      {/* Application Form Modal */}
      {showApplication && <ApplicationForm onClose={() => setShowApplication(false)} />}

      {/* Exit Intent Modal */}
      <ExitIntentModal onLoginClick={onLoginClick} />

      {/* Chat Widget */}
      <ChatWidget onLoginClick={onLoginClick} />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
