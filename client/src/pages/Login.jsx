import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Bike,
  KeyRound,
  TrendingUp,
  X,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('throttlex_remember_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('throttlex_remember_email')));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await login(trimmedEmail, password);
      if (rememberMe) {
        localStorage.setItem('throttlex_remember_email', trimmedEmail);
      } else {
        localStorage.removeItem('throttlex_remember_email');
      }
    } catch (err) {
      const rawMsg = err?.message || '';
      if (
        rawMsg.toLowerCase().includes('password') ||
        rawMsg.toLowerCase().includes('credentials') ||
        rawMsg.toLowerCase().includes('invalid') ||
        rawMsg.toLowerCase().includes('user not found')
      ) {
        setError('Invalid email or password.');
      } else if (rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('connect')) {
        setError('Unable to reach server. Please check your network connection.');
      } else {
        setError(rawMsg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-brand-orange selection:text-white">
      {/* Subtle Ambient Lighting Effects (Non-distracting, dark & automotive) */}
      <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-brand-orange/[0.04] rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[38rem] h-[38rem] bg-[#1F2942]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[28rem] h-[28rem] bg-brand-orange/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Automotive Carbon/Speedline Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Split-Screen Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:grid lg:grid-cols-12">
        {/* =========================================================================
            LEFT COLUMN (DESKTOP: ~58% split, Hidden on Mobile/Tablet)
           ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-brand-border/40 relative bg-gradient-to-br from-[#0B0F17]/80 via-[#080A0F]/60 to-transparent">
          {/* Top Brand Identity: Directly on Background (No surrounding box container) */}
          <div className="flex items-center gap-3.5">
            <img
              src="/logo-x.png"
              alt="THROTTLEX"
              className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,85,0,0.35)]"
            />
            <div>
              <div className="text-2xl font-black font-display tracking-wider text-white flex items-center leading-none">
                THROTTLE<span className="text-brand-orange">X</span>
              </div>
              <p className="text-[9px] tracking-[0.25em] text-slate-400 font-bold uppercase mt-1">
                OWN THE ROAD.
              </p>
            </div>
          </div>

          {/* Center Showcase: Headline & Sleek Visual Dashboard Telemetry */}
          <div className="my-auto py-8 max-w-xl space-y-7">
            {/* Enterprise Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-semibold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
              FLEET & RENTAL MANAGEMENT
            </div>

            {/* Hero Headings */}
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-black font-display tracking-tight text-white uppercase leading-[1.12]">
                RENTAL BUSINESS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  MANAGEMENT
                </span>
              </h1>
              <p className="text-slate-400 text-base xl:text-lg leading-relaxed max-w-lg font-normal">
                Manage your fleet, rentals, customers and revenue from one place.
              </p>
            </div>

            {/* Subtle Dashboard-Style Preview (Visual Only, Minimal & Automotive) */}
            <div className="pt-2">
              <div className="bg-brand-surface/75 border border-brand-border/80 rounded-2xl p-5 shadow-card-dark backdrop-blur-sm max-w-lg space-y-4">
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Fleet Telemetry Active
                  </div>
                  <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500">
                    HUB: UP-11 READY
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-brand-dark/80 border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Fleet</span>
                      <Bike className="w-3.5 h-3.5 text-brand-orange" />
                    </div>
                    <p className="text-lg font-bold font-display text-white">12 Bikes</p>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-dark/80 border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Active</span>
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-lg font-bold font-display text-white">08 Rented</p>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-dark/80 border border-white/[0.05] space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Revenue</span>
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-lg font-bold font-display text-white">₹24K</p>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Fleet Utilization Rate</span>
                    <span className="font-semibold text-slate-200 font-mono">67% Active</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-dark overflow-hidden border border-white/[0.05]">
                    <div className="h-full bg-gradient-to-r from-brand-orange to-amber-500 rounded-full w-[67%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>© 2026 THROTTLEX. All rights reserved.</span>
            <span className="font-mono text-slate-600">v2.4.0 • Enterprise Security</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (LOGIN FORM SECTION: Desktop ~42%, Full on Mobile)
           ========================================================================= */}
        <div className="flex-1 lg:col-span-5 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-12 relative z-20">
          {/* Mobile / Tablet Header (Visible only on < lg screens) */}
          <div className="lg:hidden text-center mb-8 space-y-2">
            <img
              src="/logo-x.png"
              alt="THROTTLEX"
              className="w-14 h-14 object-contain mx-auto drop-shadow-[0_0_14px_rgba(255,85,0,0.35)]"
            />
            <div className="text-3xl font-black font-display tracking-wider text-white">
              THROTTLE<span className="text-brand-orange">X</span>
            </div>
            <p className="text-[10px] tracking-[0.25em] text-slate-400 font-bold uppercase">
              OWN THE ROAD.
            </p>
          </div>

          {/* Clean, Premium Login Card */}
          <div className="w-full max-w-[420px] bg-brand-surface/90 border border-brand-border rounded-2xl p-7 sm:p-9 shadow-2xl backdrop-blur-md space-y-6">
            {/* Header Text */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-normal">
                Sign in to manage your THROTTLEX rental operations.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="text-xs font-semibold text-slate-300 block"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="name@throttlex.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-brand-dark/90 text-sm text-white placeholder-slate-500 hover:border-slate-600 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-300 block"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-brand-border bg-brand-dark/90 text-sm text-white placeholder-slate-500 hover:border-slate-600 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  {/* Password Visibility Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-brand-orange p-1 rounded-md transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border bg-brand-dark text-brand-orange focus:ring-1 focus:ring-brand-orange/40 accent-brand-orange cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-slate-400 hover:text-brand-orange transition-colors font-medium hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign-In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 text-xs font-bold font-display uppercase tracking-wider bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow hover:shadow-[0_0_25px_rgba(255,85,0,0.45)] transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Portal Badge */}
            <div className="pt-3 border-t border-white/[0.06] text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Authorized Partner & Fleet Access Portal</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Information Dialog Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-white font-bold font-display">
                <HelpCircle className="w-5 h-5 text-brand-orange" />
                <h3>Password Assistance</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              THROTTLEX is an internal rental fleet system. For security, accounts and credentials are administered by business owners and managing partners.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please contact your managing partner or system administrator to reset or re-issue your login credentials.
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
