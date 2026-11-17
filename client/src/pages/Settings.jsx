import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Shield, Clock, IndianRupee, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage({ refreshKey }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    businessName: 'THROTTLEX',
    tagline: 'OWN THE ROAD.',
    currency: '₹',
    defaultDailyRate: 900,
    gracePeriodHours: 2,
    hourlyLateFee: 100,
    extraDayFee: 1000
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res?.settings) {
        setSettings(res.settings);
      }
      setLoading(false);
    });
  }, [refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || 'Error updating settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Business Settings & Rules</h1>
        <p className="text-xs text-slate-400">
          Configure business identity, automated late fees, rental duration rules, and theme
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Settings updated successfully. All subsequent automated fee calculations will reflect these rules.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Identity */}
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <h3 className="text-base font-bold font-display text-white">Brand Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-surface text-white font-bold"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-surface text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Automated Late Fees & Return Rules */}
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-orange" />
            <h3 className="text-base font-bold font-display text-white">Automated Late Fee Rules</h3>
          </div>
          <p className="text-xs text-slate-400">
            When a bike is returned past the scheduled return time, the system applies these rules automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Grace Period (Hours)
              </label>
              <input
                type="number"
                value={settings.gracePeriodHours}
                onChange={(e) => setSettings({ ...settings, gracePeriodHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-surface text-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                No penalty applied within this window.
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Hourly Late Fee (₹/hr)
              </label>
              <input
                type="number"
                value={settings.hourlyLateFee}
                onChange={(e) => setSettings({ ...settings, hourlyLateFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-surface text-white font-bold text-amber-400"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Applied for late returns &lt; 12 hours.
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Extra Full Day Late Fee (₹/day)
              </label>
              <input
                type="number"
                value={settings.extraDayFee}
                onChange={(e) => setSettings({ ...settings, extraDayFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-brand-surface text-white font-bold text-rose-400"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Applied if delayed by half-day or more.
              </span>
            </div>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-white">Visual Appearance</h3>
            <p className="text-xs text-slate-400">Toggle between Dark Motorcycle Charcoal and Clean Light mode</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-brand-border hover:bg-white/10 text-white flex items-center gap-2"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        {user?.role === 'owner' && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Business Configuration
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
