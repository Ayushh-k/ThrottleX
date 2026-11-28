import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Bike,
  Users,
  Receipt,
  Wrench,
  Fuel,
  UserCheck,
  Scale,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rentals', label: 'Rentals', icon: CalendarDays },
  { id: 'bikes', label: 'Bikes Fleet', icon: Bike },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
  { id: 'partners', label: 'Partners', icon: UserCheck },
  { id: 'settlements', label: 'Settlements', icon: Scale },
  { id: 'ledger', label: 'Ledger Flow', icon: BookOpen },
  { id: 'calendar', label: 'Rental Calendar', icon: Calendar },
  { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ currentTab, onSelectTab, isMobileOpen, onCloseMobile }) {
  const content = (
    <div className="flex flex-col h-full bg-brand-surface dark:bg-brand-surface border-r border-brand-border">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <img
            src="/logo-full.png"
            alt="THROTTLEX — OWN THE ROAD."
            className="h-8 max-w-[185px] object-contain drop-shadow"
          />
        </div>

        {isMobileOpen && (
          <button onClick={onCloseMobile} className="lg:hidden p-1.5 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobileOpen && onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-brand-orange text-white shadow-glow-sm translate-x-1'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Business Status Pill in Footer */}
      <div className="p-3.5 m-3 rounded-xl bg-brand-card dark:bg-brand-card border border-brand-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Fleet Systems Active
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Turnkey rental operations & partner settlement engine
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full z-40">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
