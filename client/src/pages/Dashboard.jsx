import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Receipt,
  Scale,
  Bike as BikeIcon,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Wallet,
  Landmark,
  QrCode,
  Banknote,
  Coins,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#FF5500', '#38BDF8', '#34D399', '#FBBF24', '#A78BFA', '#F43F5E', '#94A3B8'];

export default function Dashboard({ onNavigate, onTriggerAction, refreshKey }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [showHoldings, setShowHoldings] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [timeframe, refreshKey]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardData({ timeframe });
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading THROTTLEX financial telemetry...</p>
        </div>
      </div>
    );
  }

  const { summary = {}, cashFlow = null, analytics = {}, bikeCards = [], partnerSummary = {}, recentTransactions = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome & Quick Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-brand-card via-brand-surface to-brand-card border border-brand-border">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-orange">
            THROTTLEX • OWN THE ROAD.
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-0.5">
            Good day, {user?.name?.split(' ')[0] || 'Partner'} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rental business operations are healthy. Here is your unified revenue & partner settlement position.
          </p>
        </div>

        {/* Quick Action Pill Row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTriggerAction('new_rental')}
            className="px-3.5 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm transition-all"
          >
            + New Rental
          </button>
          <button
            onClick={() => onTriggerAction('add_expense')}
            className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl transition-all"
          >
            + Add Expense
          </button>
          <button
            onClick={() => onTriggerAction('record_settlement')}
            className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl transition-all"
          >
            Settle Partners
          </button>
        </div>
      </div>

      {/* Top 7 Financial Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatINR(summary.totalRevenue)}
          subtitle={`${summary.totalRentalCount || 0} Total Trips`}
          icon={IndianRupee}
          accent="orange"
        />
        <MetricCard
          title="Total Expenses"
          value={formatINR(summary.totalExpenses)}
          subtitle="Fuel, service, parts"
          icon={Receipt}
          accent="rose"
        />
        <MetricCard
          title="Net Profit"
          value={formatINR(summary.netProfit)}
          subtitle={`${summary.profitMargin || 0}% Net Margin`}
          trend={`${summary.profitMargin}%`}
          trendPositive={summary.netProfit >= 0}
          icon={TrendingUp}
          accent="emerald"
        />
        <MetricCard
          title="Receivable"
          value={formatINR(summary.totalReceivable)}
          subtitle="Customer balance"
          icon={IndianRupee}
          accent="blue"
        />
        <MetricCard
          title="Partner Debt"
          value={formatINR(summary.amountPayable)}
          subtitle="Needs settlement"
          icon={Scale}
          accent="orange"
          onClick={() => onNavigate('settlements')}
        />
        <MetricCard
          title="Active Rentals"
          value={summary.activeRentals || 0}
          subtitle="Currently on road"
          icon={CalendarCheck}
          accent="orange"
          onClick={() => onNavigate('rentals')}
        />
        <MetricCard
          title="Available Fleet"
          value={summary.availableBikes || 0}
          subtitle={`of ${summary.totalBikes || 0} motorcycles`}
          icon={BikeIcon}
          accent="emerald"
          onClick={() => onNavigate('bikes')}
        />
      </div>

      {/* Real-Time Cash Flow & Liquidity Position */}
      {cashFlow && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4 shadow-card-dark">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  Cash Flow & Real-Time Liquidity
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTUAL CASH POSITION
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Actual liquid money available across channels vs customer receivables and partner liabilities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="text-left sm:text-right pr-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-mono">Total Liquid Capital</span>
                <span className="text-lg font-bold font-display text-emerald-400">
                  {formatINR(cashFlow.totalLiquidCash || 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHoldings(!showHoldings)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-brand-border flex items-center gap-1.5 transition-all"
              >
                <span>{showHoldings ? 'Hide Holdings' : 'Who Holds What?'}</span>
                {showHoldings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 5 Core Cash Position Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Cash in Hand */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" /> Cash in Hand
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.cashInHand || 0)}
              </p>
              <p className="text-[10px] text-slate-500">Physical currency held</p>
            </div>

            {/* 2. UPI Balance */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-400" /> UPI Accounts
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-400" />
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.upi || 0)}
              </p>
              <p className="text-[10px] text-slate-500">PhonePe / GPay / Paytm</p>
            </div>

            {/* 3. Bank Account */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-purple-400" /> Bank Balance
                </span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.bank || 0)}
              </p>
              <p className="text-[10px] text-slate-500">Current & IMPS accounts</p>
            </div>

            {/* 4. Customer Pending (Receivable) */}
            <div className="p-4 rounded-xl bg-brand-surface border border-amber-500/20 bg-amber-500/[0.03] space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> Customer Pending
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p className="text-xl font-bold font-display text-amber-400">
                {formatINR(cashFlow.customerPending || 0)}
              </p>
              <p className="text-[10px] text-amber-300/70">Uncollected booking balance</p>
            </div>

            {/* 5. Partner Payable */}
            <div className="p-4 rounded-xl bg-brand-surface border border-rose-500/20 bg-rose-500/[0.03] space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-400" /> Partner Payable
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
              <p className="text-xl font-bold font-display text-rose-400">
                {formatINR(cashFlow.partnerPayable || 0)}
              </p>
              <p className="text-[10px] text-rose-300/70">Owed for settlements & outlays</p>
            </div>
          </div>

          {/* Expandable "Who is holding what cash?" breakdown */}
          {showHoldings && cashFlow.partnerHoldings && (
            <div className="p-4 rounded-xl bg-brand-dark/90 border border-brand-border space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-orange" /> Partner-Wise Real Cash Holdings
                </h4>
                <span className="text-[11px] text-slate-500">Breakdown of who currently holds physical cash vs UPI balance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cashFlow.partnerHoldings.map((h) => (
                  <div key={h.partnerId} className="p-3 rounded-lg bg-brand-surface border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{h.name}</span>
                      <span className="font-bold font-display text-xs text-emerald-400">{formatINR(h.total)} Total</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <div>Cash: <strong className="text-white block font-mono">{formatINR(h.cash)}</strong></div>
                      <div>UPI: <strong className="text-sky-300 block font-mono">{formatINR(h.upi)}</strong></div>
                      <div>Bank: <strong className="text-purple-300 block font-mono">{formatINR(h.bank)}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partner Balance & Splitwise Settlement Recommendation Box */}
      {partnerSummary.recommendations && partnerSummary.recommendations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-orange/15 via-brand-card to-brand-card border border-brand-orange/40 shadow-glow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-brand-orange/20 text-brand-orange shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-orange text-white">
                  Splitwise Settlement Recommendation
                </span>
                <span className="text-xs text-slate-400">
                  Realized Cash Profit: <strong className="text-white">{formatINR(partnerSummary.realizedProfit)}</strong>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-display text-white mt-1">
                {partnerSummary.recommendations[0]?.label}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically calculated based on actual cash collected, out-of-pocket expenses, and profit-sharing ratio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onTriggerAction('record_settlement', partnerSummary.recommendations[0])}
              className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Settled
            </button>
            <button
              onClick={() => onNavigate('settlements')}
              className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-brand-border"
            >
              View Full Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timeline Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-brand-card dark:bg-brand-card border border-brand-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold font-display text-white">Revenue & Expenses Overview</h3>
              <p className="text-xs text-slate-400">Net profitability trend across operations</p>
            </div>

            {/* Timeframe filters */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-surface border border-brand-border text-xs">
              {['today', 'week', 'month', 'year'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg font-semibold uppercase text-[11px] transition-all ${
                    timeframe === tf
                      ? 'bg-brand-orange text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeSeries || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5500" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5500" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2942" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => formatDate(val)}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E131F',
                    borderColor: '#1F2942',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [formatINR(val)]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5500"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-brand-card dark:bg-brand-card border border-brand-border flex flex-col">
          <h3 className="text-base font-bold font-display text-white">Expense Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Outflow categorized by service and fuel</p>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(summary.expenseByCategory || {}).map(([name, value]) => ({
                    name: name.toUpperCase(),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {Object.keys(summary.expenseByCategory || {}).map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E131F',
                    borderColor: '#1F2942',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [formatINR(val)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-32 text-xs">
            {Object.entries(summary.expenseByCategory || {}).map(([cat, amt], idx) => (
              <div key={cat} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2 capitalize">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {cat}
                </span>
                <span className="font-semibold text-white">{formatINR(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Bike Cards Section (Section 27 of prompt) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Your Motorcycles</h3>
            <p className="text-xs text-slate-400">Current fleet status, rates, and this month's earnings</p>
          </div>
          <button
            onClick={() => onNavigate('bikes')}
            className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
          >
            View All Bikes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bikeCards.map((bike) => (
            <div
              key={bike.id}
              className="rounded-2xl bg-brand-card dark:bg-brand-card border border-brand-border overflow-hidden hover:border-brand-orange/40 transition-all shadow-card-dark group"
            >
              {/* Bike Image & Status */}
              <div className="relative h-44 bg-brand-surface overflow-hidden">
                <img
                  src={bike.imageUrl}
                  alt={bike.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={bike.status} />
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight drop-shadow-md">
                      {bike.name}
                    </h4>
                    <p className="text-xs text-slate-300 font-mono drop-shadow">
                      {bike.registrationNumber}
                    </p>
                  </div>
                  <div className="text-right bg-black/75 px-2 py-0.5 rounded-lg border border-brand-orange/30 backdrop-blur-sm">
                    <span className="font-display font-extrabold text-brand-orange text-sm block leading-tight">
                      {formatINR(bike.defaultDailyRate)}/day
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono block">
                      {formatINR(bike.defaultHourlyRate || Math.round(bike.defaultDailyRate / 8))}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">This Month</p>
                    <p className="font-bold text-white mt-0.5">{bike.thisMonthRentals} Trips</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Revenue</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{formatINR(bike.thisMonthRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Net Profit</p>
                    <p className="font-bold text-brand-orange mt-0.5">{formatINR(bike.allTimeProfit)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Odometer: <strong className="text-slate-200">{bike.currentOdometer} km</strong></span>
                  <span>Total Days: <strong className="text-slate-200">{bike.totalRentalDays || 0}</strong></span>
                </div>

                <button
                  onClick={() => onNavigate('bikes', bike.id)}
                  className="w-full py-2 text-xs font-bold text-white bg-white/5 hover:bg-brand-orange rounded-xl border border-white/10 hover:border-brand-orange transition-all"
                >
                  View Bike Profile & History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Partner Balances & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner Balances Snapshot */}
        <div className="p-5 rounded-2xl bg-brand-card dark:bg-brand-card border border-brand-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-white">Partner Balances</h3>
              <p className="text-xs text-slate-400">Splitwise-style group settlement</p>
            </div>
            <button
              onClick={() => onNavigate('partners')}
              className="text-xs text-brand-orange hover:underline font-semibold"
            >
              Details
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {(partnerSummary.partners || []).map((p) => (
              <div
                key={p.partnerId}
                className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={p.name}
                    className="w-8 h-8 rounded-full object-cover border border-brand-border"
                  />
                  <div>
                    <p className="font-bold text-white">{p.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Share: {p.sharePercentage}% • Held: {formatINR(p.netCashHeld)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold font-display text-sm ${
                      p.balance > 0
                        ? 'text-emerald-400'
                        : p.balance < 0
                        ? 'text-orange-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {p.balance > 0 ? `+${formatINR(p.balance)}` : formatINR(p.balance)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    {p.balance > 0 ? 'To Receive' : p.balance < 0 ? 'To Pay' : 'Settled'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onTriggerAction('record_settlement')}
            className="mt-4 w-full py-2 text-xs font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange hover:text-white rounded-xl border border-brand-orange/20 transition-all text-center"
          >
            Record Partner Settlement
          </button>
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-brand-card dark:bg-brand-card border border-brand-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-white">Recent Financial Ledger</h3>
              <p className="text-xs text-slate-400">Latest money movements in the business</p>
            </div>
            <button
              onClick={() => onNavigate('ledger')}
              className="text-xs text-brand-orange hover:underline font-semibold"
            >
              Full Ledger
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-3 rounded-xl bg-brand-surface border border-brand-border/60 flex items-center justify-between text-xs hover:border-brand-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {formatDate(tx.date)}
                    </span>
                    <div>
                      <p className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {tx.paidByPartner ? `Paid by ${tx.paidByPartner.name}` : ''}
                        {tx.receivedByPartner ? `Received by ${tx.receivedByPartner.name}` : ''}
                        {tx.paymentMethod ? ` • ${tx.paymentMethod.toUpperCase()}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-bold font-display text-sm whitespace-nowrap ml-2 ${
                      tx.balanceImpact === 'credit'
                        ? 'text-emerald-400'
                        : tx.balanceImpact === 'debit'
                        ? 'text-rose-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {tx.balanceImpact === 'credit'
                      ? `+${formatINR(tx.amount)}`
                      : tx.balanceImpact === 'debit'
                      ? `-${formatINR(tx.amount)}`
                      : formatINR(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
