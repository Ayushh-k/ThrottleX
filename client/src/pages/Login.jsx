import React, { useState } from 'react';
import { Flame, Lock, Mail, ArrowRight, User, Phone, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }

    try {
      setLoading(true);
      // Register new owner account
      await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role: 'owner'
      });

      // Automatically log in
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-brand-card/90 backdrop-blur-xl border border-brand-border rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 mx-auto flex items-center justify-center shadow-glow">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-wider text-white">
            THROTTLE<span className="text-brand-orange">X</span>
          </h1>
          <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase">
            OWN THE ROAD. • RENTAL BUSINESS MANAGER
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Create Owner Account */}
        <div className="flex p-1 rounded-xl bg-brand-surface border border-brand-border text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
            }}
            className={`flex-1 py-2 font-bold rounded-lg transition-all ${
              !isRegisterMode
                ? 'bg-brand-orange text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
            }}
            className={`flex-1 py-2 font-bold rounded-lg transition-all ${
              isRegisterMode
                ? 'bg-brand-orange text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Owner Account
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Sign In Form */}
        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Register Owner Account Form */
          <form onSubmit={handleRegister} className="space-y-3.5 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Owner Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourdomain.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-border bg-brand-surface text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border text-[11px] text-slate-400">
              <span className="font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Owner / Admin Privileges
              </span>
              This account will have full access to add partner profiles, fleet bikes, manage settlements, and view all financial ledgers.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Owner Profile...' : 'Complete Setup & Launch Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
