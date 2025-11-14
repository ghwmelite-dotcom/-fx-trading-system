import { useState, useEffect } from 'react';
import { Brain, TrendingUp, BookOpen, BarChart3, Target, Shield, Zap, Award, Activity, ArrowRight, CheckCircle, Star, Users, Globe, Lock, Send, Sparkles, LineChart, PieChart, TrendingDown } from 'lucide-react';
import SpotCounter from './SpotCounter';
import WaitlistForm from './WaitlistForm';
import ApplicationForm from './ApplicationForm';

const LandingPage = ({ onLoginClick }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showApplication, setShowApplication] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Enhanced Animated Background Particles - Now VERY visible */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large glowing orbs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-60 right-10 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-cyan-500/35 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-float"></div>

        {/* Smaller accent orbs */}
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-pink-500/25 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 animate-pulse-slow"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="text-white" size={26} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    TradeMetrics Pro
                  </div>
                  <div className="text-xs text-purple-400 font-semibold">AI-Powered Trading</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onLoginClick}
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center gap-2"
                >
                  <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                  Login
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm animate-fade-in-up">
                <Sparkles size={18} className="text-purple-400 animate-pulse" />
                <span className="text-white font-semibold text-sm">World's First AI-Powered Trading Psychology Platform</span>
              </div>

              {/* Headline */}
              <div className="space-y-6 animate-fade-in-up animation-delay-200">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white leading-[1.1] tracking-tight">
                  Master Your
                  <br />
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 blur-2xl opacity-50"></span>
                    <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      Trading Mind
                    </span>
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                  Transform your trading performance with AI psychology coaching, advanced analytics, and automated trade tracking
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6 animate-fade-in-up animation-delay-400">
                <a
                  href="#early-access"
                  className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg transition-all hover:scale-105 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 flex items-center gap-3"
                  style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                  Get Early Access
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                </a>
                <button
                  onClick={onLoginClick}
                  className="px-10 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 backdrop-blur-sm"
                >
                  Login to Dashboard
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-10 text-slate-300 text-sm animate-fade-in-up animation-delay-600">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Early access program</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Limited spots</span>
                </div>
              </div>
            </div>

            {/* Enhanced Dashboard Preview */}
            <div className="mt-24 relative animate-fade-in-up animation-delay-800">
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-blue-600/30 blur-3xl opacity-75 animate-pulse-slow"></div>

              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border-2 border-white/10 p-6 shadow-2xl backdrop-blur-xl">
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
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-2xl p-6 backdrop-blur-sm animate-float">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-green-400 text-sm font-semibold uppercase tracking-wide">Total Profit</div>
                          <TrendingUp size={20} className="text-green-400" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">$12,450</div>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <TrendingUp size={14} />
                          <span>+23.5% this month</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm animate-float-delayed">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-blue-400 text-sm font-semibold uppercase tracking-wide">Win Rate</div>
                          <Target size={20} className="text-blue-400" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">68.4%</div>
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                          <TrendingUp size={14} />
                          <span>+12.1% improvement</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm animate-float-slow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-purple-400 text-sm font-semibold uppercase tracking-wide">Total Trades</div>
                          <BarChart3 size={20} className="text-purple-400" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">247</div>
                        <div className="text-purple-400 text-sm font-medium">This month</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-slate-950/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-slate-300 font-semibold">Performance Over Time</div>
                      <LineChart size={18} className="text-slate-500" />
                    </div>
                    <div className="h-40 flex items-end gap-3">
                      {[30, 55, 40, 75, 50, 85, 65, 90, 55, 95, 70, 88].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-600 via-pink-500 to-blue-500 rounded-t-xl animate-bar-grow relative group"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${i * 0.08}s`
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                            ${(height * 100).toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exclusive Access Spot Counter */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-5xl mx-auto">
            <SpotCounter
              onWaitlistClick={() => setShowWaitlist(true)}
              onApplyClick={() => setShowApplication(true)}
            />
          </div>
        </section>

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
                <div key={idx} className="text-center space-y-4 group">
                  <div className={`inline-flex p-4 bg-${stat.color}-500/10 rounded-2xl border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`text-${stat.color}-400`} size={32} />
                  </div>
                  <div className="text-5xl font-bold text-white">{stat.value}</div>
                  <div className="text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-5 mb-20">
              <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-semibold mb-4">
                FEATURES
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold text-white">
                Everything You Need
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  To Trade Better
                </span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Cutting-edge tools designed to give you an unfair advantage
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative p-8 bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/5 rounded-3xl hover:border-white/20 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
                  onMouseEnter={() => setActiveFeature(idx)}
                >
                  {/* Badge */}
                  <div className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg">
                    {feature.highlight}
                  </div>

                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 ${feature.iconBg} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                      <feature.icon className="text-white" size={28} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-3 transition-all">
                    <span>Learn more</span>
                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center space-y-5 mb-20">
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
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/5 rounded-3xl p-8 hover:border-white/20 transition-all hover:scale-105 backdrop-blur-sm"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Early Access */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative" id="early-access">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-5 mb-16">
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
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-blue-600/30 blur-3xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-white/10 rounded-3xl p-10 backdrop-blur-xl">
                {submitted ? (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                      <CheckCircle size={40} className="text-green-400" />
                    </div>
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

                    <button
                      type="submit"
                      className="w-full px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg hover:scale-105 transition-all shadow-2xl shadow-purple-500/50 flex items-center justify-center gap-3 group"
                    >
                      <Send size={22} />
                      Request Early Access
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
                    </button>

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
                      <div key={idx} className="text-center space-y-3">
                        <div className="inline-flex p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <benefit.icon className="text-purple-400" size={24} />
                        </div>
                        <div className="text-white font-bold">{benefit.title}</div>
                        <div className="text-slate-400 text-sm">{benefit.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"></div>
          <div className="max-w-4xl mx-auto text-center space-y-10 relative">
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
              <a
                href="#early-access"
                className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg transition-all hover:scale-105 shadow-2xl shadow-purple-500/50 flex items-center gap-3"
              >
                Get Early Access
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
              </a>
              <button
                onClick={onLoginClick}
                className="px-10 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/20 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 backdrop-blur-sm"
              >
                Login to Dashboard
              </button>
            </div>
          </div>
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

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 30px) rotate(-7deg); }
          66% { transform: translate(25px, -25px) rotate(7deg); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, -20px) scale(1.05); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bar-grow {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0) rotate(-180deg);
          }
          to {
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 30s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .animate-bar-grow {
          animation: bar-grow 1.2s ease-out forwards;
          transform-origin: bottom;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .animate-fade-in {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
