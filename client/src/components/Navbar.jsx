import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Menu,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { formatINR } from '../utils/formatters';

export default function Navbar({
  onOpenSearch,
  onOpenQuickAction,
  onOpenNotifications,
  onToggleMobileSidebar,
  partnerBalance = null
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-brand-surface/90 dark:bg-brand-surface/90 backdrop-blur-md border-b border-brand-border px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu + Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Pill */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-brand-card/90 dark:bg-brand-card/90 border border-brand-border hover:border-brand-orange/40 text-slate-400 hover:text-slate-200 transition-all text-xs w-48 sm:w-72 shadow-sm"
        >
          <Search className="w-4 h-4 text-brand-orange shrink-0" />
          <span className="truncate">Search bikes, riders, expenses...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Partner Pill, Quick Action, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Partner Balance Pill (if available) */}
        {partnerBalance && (
          <div
            title="Your current net balance in the business"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              partnerBalance.balance > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : partnerBalance.balance < 0
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>
              {partnerBalance.balance > 0
                ? `To Receive ${formatINR(partnerBalance.balance)}`
                : partnerBalance.balance < 0
                ? `To Pay ${formatINR(Math.abs(partnerBalance.balance))}`
                : 'Balance Settled'}
            </span>
          </div>
        )}

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold shadow-glow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Action</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-brand-border/60 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-brand-border/60 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover border border-brand-border"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Ayush'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {user?.role === 'owner' ? 'Owner / Admin' : 'Partner'}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-brand-card dark:bg-brand-card border border-brand-border rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-brand-border/60">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                  {user?.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
