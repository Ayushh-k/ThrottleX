import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  IndianRupee,
  RotateCcw,
  ArrowRight,
  Calendar,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime, calculateHours } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import RentalAgreementModal from '../components/modals/RentalAgreementModal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Rentals({ onNavigate, onTriggerAction, refreshKey }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [agreementRentalId, setAgreementRentalId] = useState(null);

  useEffect(() => {
    loadRentals();
  }, [statusFilter, rentalTypeFilter, paymentFilter, search, refreshKey]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const res = await api.getRentals({
        status: statusFilter,
        rentalType: rentalTypeFilter,
        paymentStatus: paymentFilter,
        search
      });
      setRentals(res.rentals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Rental Bookings</h1>
          <p className="text-xs text-slate-400">
            Track active trips, schedules, automated duration charges, and customer payments
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('new_rental')}
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Rental
        </button>
      </div>

      {/* Controls & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by rental #, customer name, phone, or bike..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Plan Filter (All, Day-Wise, Hourly) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-card border border-brand-border text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Plans' },
              { id: 'daily', label: '📅 Daily' },
              { id: 'hourly', label: '⏱️ Hourly' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setRentalTypeFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all ${
                  rentalTypeFilter === item.id
                    ? 'bg-purple-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Filter Bars: Trip Status & Payment Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Trip Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-card border border-brand-border text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Trips' },
              { id: 'active', label: '🟢 Active' },
              { id: 'overdue', label: '⚠️ Time Overdue' },
              { id: 'returned', label: '✅ Returned' },
              { id: 'upcoming', label: '📅 Upcoming' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all ${
                  statusFilter === st.id
                    ? 'bg-brand-orange text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Payment Status Filter (Pending / Due vs Paid) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-card border border-brand-border text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'pending', label: '🔴 Payment Due' },
              { id: 'paid', label: '🟢 Fully Paid' }
            ].map((pt) => (
              <button
                key={pt.id}
                onClick={() => setPaymentFilter(pt.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all ${
                  paymentFilter === pt.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <SkeletonLoader type="rentals" count={5} />
        ) : rentals.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="font-bold text-white text-base">No rentals found</h3>
            <p className="text-xs text-slate-400 mt-1">Your rental activity will appear here.</p>
            <button
              onClick={() => onTriggerAction('new_rental')}
              className="mt-4 px-4 py-2 text-xs font-bold bg-brand-orange text-white rounded-xl shadow-glow-sm"
            >
              Create First Rental
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (<640px) */}
            <div className="sm:hidden space-y-3">
              {rentals.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3 shadow-sm"
                >
                  {/* Top Bar: Rental # & Badges */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                    <span className="font-mono font-bold text-white text-sm">
                      #{r.rentalNumber}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <StatusBadge status={r.displayStatus || r.status} size="xs" />
                      <StatusBadge status={r.paymentStatus} size="xs" />
                    </div>
                  </div>

                  {/* Bike & Customer Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Motorcycle</p>
                      <p className="font-bold text-white mt-0.5 truncate">{r.bike?.name || 'Bike'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.bike?.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Customer</p>
                      <p className="font-bold text-white mt-0.5 truncate">{r.customer?.name || 'Rider'}</p>
                      <p className="text-[10px] text-slate-400">{r.customer?.phone}</p>
                    </div>
                  </div>

                  {/* Window & Plan */}
                  <div className="p-2.5 rounded-lg bg-brand-card/80 border border-brand-border/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Rental Window</p>
                      <p className="text-slate-200 text-[11px]">
                        {formatDate(r.startDate)} → {formatDate(r.expectedEndDate)}
                      </p>
                    </div>
                    <div>
                      {r.rentalType === 'hourly' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-purple-400" />
                          {r.totalHours || calculateHours(r.startDate, r.expectedEndDate)}h
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          {r.totalDays || 1}d
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financials Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/25 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Total Rent</p>
                      <p className="font-bold font-display text-white mt-0.5">{formatINR(r.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Paid</p>
                      <p className="font-bold font-display text-emerald-400 mt-0.5">{formatINR(r.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Due</p>
                      <p className="font-bold font-display text-amber-400 mt-0.5">{formatINR(r.remainingAmount)}</p>
                    </div>
                  </div>

                  {/* Touch Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {r.status !== 'returned' && r.status !== 'cancelled' && (
                      <button
                        onClick={() => onTriggerAction('return_bike', r)}
                        className="flex-1 py-2.5 min-h-[44px] text-xs font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 rounded-xl border border-emerald-500/30 text-center transition-all"
                      >
                        Return Bike
                      </button>
                    )}
                    {r.remainingAmount > 0 && (
                      <button
                        onClick={() => onTriggerAction('record_payment_for_rental', r)}
                        className="flex-1 py-2.5 min-h-[44px] text-xs font-bold text-brand-orange bg-brand-orange/15 hover:bg-brand-orange/25 active:scale-95 rounded-xl border border-brand-orange/30 text-center transition-all"
                      >
                        + Record Pay
                      </button>
                    )}
                    <button
                      onClick={() => setAgreementRentalId(r._id)}
                      className="px-3 py-2.5 min-h-[44px] text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/10 flex items-center justify-center gap-1 transition-all"
                      title="Rental Agreement"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-orange" /> Agr
                    </button>
                    <button
                      onClick={() => onNavigate('rental-detail', r._id)}
                      className="flex-1 py-2.5 min-h-[44px] text-xs font-bold text-white bg-brand-orange hover:bg-orange-600 active:scale-95 rounded-xl shadow-glow-sm text-center transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>=640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Rental #</th>
                    <th className="py-3 px-3">Motorcycle</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Rental Window</th>
                    <th className="py-3 px-3">Plan & Duration</th>
                    <th className="py-3 px-3">Total Rent</th>
                    <th className="py-3 px-3 text-emerald-400">Paid Amount</th>
                    <th className="py-3 px-3 text-amber-400">Balance</th>
                    <th className="py-3 px-3">Rental Status</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {rentals.map((r) => (
                    <tr key={r._id} className="hover:bg-brand-surface/70 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        #{r.rentalNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-white">{r.bike?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.bike?.registrationNumber}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-white">{r.customer?.name}</p>
                        <p className="text-[10px] text-slate-400">{r.customer?.phone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {r.rentalType === 'hourly' ? (
                          <div className="space-y-0.5 text-[11px]">
                            <p>{formatDateTime(r.startDate)}</p>
                            <p className="text-slate-400">→ {formatDateTime(r.expectedEndDate)}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>{formatDate(r.startDate)}</span>
                            <span className="text-slate-500">→</span>
                            <span>{formatDate(r.expectedEndDate)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {r.rentalType === 'hourly' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {r.totalHours || calculateHours(r.startDate, r.expectedEndDate)} hrs
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            {r.totalDays || 1} d
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold font-display text-white">
                        {formatINR(r.totalAmount)}
                      </td>
                      <td className="py-3.5 px-3 font-bold font-display text-emerald-400">
                        {formatINR(r.amountPaid)}
                      </td>
                      <td className="py-3.5 px-3 font-bold font-display text-amber-400">
                        {formatINR(r.remainingAmount)}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={r.status} size="xs" />
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={r.paymentStatus} size="xs" />
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {r.status !== 'returned' && r.status !== 'cancelled' && (
                          <button
                            onClick={() => onTriggerAction('return_bike', r)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20"
                          >
                            Return
                          </button>
                        )}
                        {r.remainingAmount > 0 && (
                          <button
                            onClick={() => onTriggerAction('record_payment_for_rental', r)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 rounded-lg border border-brand-orange/20"
                          >
                            + Pay
                          </button>
                        )}
                        <button
                          onClick={() => setAgreementRentalId(r._id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-brand-orange bg-brand-orange/15 hover:bg-brand-orange/25 rounded-lg border border-brand-orange/30"
                          title="View & Print Official Rental Agreement"
                        >
                          Agr 📄
                        </button>
                        <button
                          onClick={() => onNavigate('rental-detail', r._id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Rental Agreement & Contract Modal */}
      <RentalAgreementModal
        isOpen={Boolean(agreementRentalId)}
        onClose={() => setAgreementRentalId(null)}
        rentalId={agreementRentalId}
        onAgreementUpdated={loadRentals}
      />
    </div>
  );
}
