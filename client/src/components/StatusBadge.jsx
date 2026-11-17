import React from 'react';

const badgeStyles = {
  // Bikes
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rented: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

  // Rentals
  active: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  upcoming: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  returned: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',

  // Payment Status
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  partially_paid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

  // Partner status
  receivable: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  payable: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  settled: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
};

const dotColors = {
  available: 'bg-emerald-400',
  rented: 'bg-orange-400 animate-pulse',
  maintenance: 'bg-amber-400',
  inactive: 'bg-slate-400',
  active: 'bg-orange-400',
  upcoming: 'bg-sky-400',
  returned: 'bg-emerald-400',
  overdue: 'bg-rose-400 animate-pulse',
  cancelled: 'bg-slate-400',
  paid: 'bg-emerald-400',
  partially_paid: 'bg-amber-400',
  pending: 'bg-rose-400',
  receivable: 'bg-emerald-400',
  payable: 'bg-orange-400',
  settled: 'bg-blue-400'
};

const labels = {
  available: 'Available',
  rented: 'Rented',
  maintenance: 'Maintenance',
  inactive: 'Inactive',
  active: 'Active',
  upcoming: 'Upcoming',
  returned: 'Returned',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  pending: 'Pending',
  receivable: 'To Receive',
  payable: 'To Pay',
  settled: 'Settled'
};

export default function StatusBadge({ status, label, showDot = true, size = 'sm' }) {
  const normalized = (status || '').toLowerCase().replace(' ', '_');
  const style = badgeStyles[normalized] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const dot = dotColors[normalized] || 'bg-slate-400';
  const text = label || labels[normalized] || status;

  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style} ${sizeClass}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {text}
    </span>
  );
}
