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
  Users,
  X,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  ArrowDownLeft,
  Clock,
  Plus
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
  const [activeCashModal, setActiveCashModal] = useState(null); // 'cash' | 'upi' | 'bank' | 'customer_pending' | 'partner_payable'
  const [cashModalTab, setCashModalTab] = useState('inflows'); // 'inflows' | 'outflows'
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [timeframe, refreshKey]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await api.getDashboardData({ timeframe });
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setLoadError(err.message || 'Failed to retrieve telemetry data');
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

  if (loadError && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 max-w-md">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="font-bold text-white text-base">Dashboard Telemetry Error</p>
          <p className="text-xs text-slate-300 mt-1">{loadError}</p>
        </div>
        <button
          onClick={loadDashboard}
          className="px-5 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all shadow-glow-sm"
        >
          Retry Connection
        </button>
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

      {/* Top 7 Financial Summary Metrics (Spacious responsive grid preventing any truncation on laptops) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
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
          subtitle={`${summary.profitMargin != null ? summary.profitMargin : 0}% Net Margin`}
          trend={summary.profitMargin != null ? `${summary.profitMargin}%` : undefined}
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

      {/* Bike Kamayi vs Kharcha Hisab (Earnings, Expenses & Remaining Cash Tracker) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-brand-card to-brand-card border border-emerald-500/30 shadow-card-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">
                  Bike Kamayi vs Kharcha Hisab (Net Cash Balance)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  LIVE BALANCE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bike se total kamaye hue paise, usme se kiye gaye kharche, aur bache hue paise ka pura hisab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onTriggerAction('add_expense')}
              className="px-3.5 py-2 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-glow-sm"
            >
              <Receipt className="w-4 h-4 text-rose-400" /> + Kharcha Daalein
            </button>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="px-3.5 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-brand-border transition-all"
            >
              Kharcha History
            </button>
          </div>
        </div>

        {/* 3 Step Financial Ledger Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Bike Kamayi */}
          <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                💰 1. Kul Bike Kamayi
              </span>
              <span className="text-[10px] text-slate-500">Rental Revenue</span>
            </div>
            <p className="text-2xl font-bold font-display text-white">
              {formatINR(summary.totalRevenue || 0)}
            </p>
            <p className="text-[10px] text-slate-400">
              {summary.totalRentalCount || 0} Trips se aaya rent
            </p>
          </div>

          {/* 2. Bike Kharcha */}
          <div className="p-3.5 rounded-xl bg-brand-surface border border-rose-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                🔻 2. Bike Kharcha
              </span>
              <span className="text-[10px] text-rose-400/80 font-mono">DEDUCTED</span>
            </div>
            <p className="text-2xl font-bold font-display text-rose-400">
              -{formatINR(summary.totalExpenses || 0)}
            </p>
            <p className="text-[10px] text-slate-400">
              Petrol, Service, Puncture, Repair, Parts
            </p>
          </div>

          {/* 3. Bacha Hua Paisa */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                ✨ 3. Bacha Hua Paisa
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">NET IN-HAND</span>
            </div>
            <p className="text-2xl font-extrabold font-display text-emerald-400">
              {formatINR(summary.netProfit || 0)}
            </p>
            <p className="text-[10px] text-emerald-300/80">
              Kharcha nikal kar bachi hui shuddh kamayi ({summary.profitMargin || 0}% margin)
            </p>
          </div>
        </div>
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
            <div
              onClick={() => {
                setActiveCashModal('cash');
                setCashModalTab('inflows');
              }}
              className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 hover:border-emerald-500/60 hover:bg-emerald-500/[0.04] space-y-1.5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" /> Cash in Hand
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 font-medium flex items-center gap-0.5 transition-colors">
                  Details <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.cashInHand || 0)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Physical currency held</span>
                <span className="text-[9px] text-emerald-400/90 font-mono font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">TAP FOR INFO</span>
              </div>
            </div>

            {/* 2. UPI Balance */}
            <div
              onClick={() => {
                setActiveCashModal('upi');
                setCashModalTab('inflows');
              }}
              className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 hover:border-sky-500/60 hover:bg-sky-500/[0.04] space-y-1.5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-400" /> UPI Accounts
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-sky-400 font-medium flex items-center gap-0.5 transition-colors">
                  Details <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.upi || 0)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>PhonePe / GPay / Paytm</span>
                <span className="text-[9px] text-sky-400/90 font-mono font-semibold bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">TAP FOR INFO</span>
              </div>
            </div>

            {/* 3. Bank Account */}
            <div
              onClick={() => {
                setActiveCashModal('bank');
                setCashModalTab('inflows');
              }}
              className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 hover:border-purple-500/60 hover:bg-purple-500/[0.04] space-y-1.5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-purple-400" /> Bank Balance
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-purple-400 font-medium flex items-center gap-0.5 transition-colors">
                  Details <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xl font-bold font-display text-white">
                {formatINR(cashFlow.bank || 0)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Current & IMPS accounts</span>
                <span className="text-[9px] text-purple-400/90 font-mono font-semibold bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">TAP FOR INFO</span>
              </div>
            </div>

            {/* 4. Customer Pending (Receivable) */}
            <div
              onClick={() => {
                setActiveCashModal('customer_pending');
              }}
              className="p-4 rounded-xl bg-brand-surface border border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/60 hover:bg-amber-500/[0.06] space-y-1.5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> Customer Pending
                </span>
                <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 font-medium flex items-center gap-0.5 transition-colors">
                  Remind <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xl font-bold font-display text-amber-400">
                {formatINR(cashFlow.customerPending || 0)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-amber-300/70">
                <span>Uncollected balance</span>
                <span className="text-[9px] text-amber-400 font-mono font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">TAP TO COLLECT</span>
              </div>
            </div>

            {/* 5. Partner Payable */}
            <div
              onClick={() => {
                setActiveCashModal('partner_payable');
              }}
              className="p-4 rounded-xl bg-brand-surface border border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/60 hover:bg-rose-500/[0.06] space-y-1.5 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-400" /> Partner Payable
                </span>
                <span className="text-[10px] text-rose-400/80 group-hover:text-rose-300 font-medium flex items-center gap-0.5 transition-colors">
                  Settle <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-xl font-bold font-display text-rose-400">
                {formatINR(cashFlow.partnerPayable || 0)}
              </p>
              <div className="flex items-center justify-between text-[10px] text-rose-300/70">
                <span>Settlements owed</span>
                <span className="text-[9px] text-rose-400 font-mono font-semibold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">TAP TO SETTLE</span>
              </div>
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

              {/* Financial Stats: Kamayi, Kharcha & Bacha Paisa */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-brand-surface border border-brand-border text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Kamayi</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{formatINR(bike.thisMonthRevenue)}</p>
                    <span className="text-[9px] text-slate-500 font-mono">{bike.thisMonthRentals} trips</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-rose-400 uppercase font-semibold">Kharcha</p>
                    <p className="font-bold text-rose-400 mt-0.5">-{formatINR(bike.thisMonthExpenses || 0)}</p>
                    <span className="text-[9px] text-slate-500 font-mono">fuel/service</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-orange uppercase font-semibold">Bacha Paisa</p>
                    <p className={`font-bold mt-0.5 ${(bike.thisMonthProfit ?? 0) >= 0 ? 'text-brand-orange' : 'text-rose-400'}`}>
                      {formatINR(bike.thisMonthProfit ?? (bike.thisMonthRevenue - (bike.thisMonthExpenses || 0)))}
                    </p>
                    <span className="text-[9px] text-emerald-400/90 font-mono font-semibold">Net Profit</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Odometer: <strong className="text-slate-200">{bike.currentOdometer} km</strong></span>
                  <span>All-Time Kamayi: <strong className="text-slate-200">{formatINR(bike.allTimeRevenue || 0)}</strong></span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onTriggerAction('add_expense_for_bike', bike.id)}
                    className="flex-1 py-2 text-xs font-bold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 rounded-xl border border-rose-500/30 transition-all text-center flex items-center justify-center gap-1 shadow-glow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kharcha Daalein
                  </button>
                  <button
                    onClick={() => onNavigate('bikes', bike.id)}
                    className="flex-1 py-2 text-xs font-bold text-slate-200 bg-white/5 hover:bg-brand-orange hover:text-white rounded-xl border border-white/10 hover:border-brand-orange transition-all text-center"
                  >
                    View History
                  </button>
                </div>
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

      {/* Interactive Cash Flow Deep-Dive Drill-Down Modal */}
      {activeCashModal && cashFlow && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCashModal(null);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-slate-900/95 sm:bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-t-3xl sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden my-0 sm:my-6 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Mobile Pull Indicator */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-white/[0.04]">
              <div className="w-12 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.04] shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  activeCashModal === 'upi' ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' :
                  activeCashModal === 'cash' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                  activeCashModal === 'bank' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
                  activeCashModal === 'customer_pending' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                  'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}>
                  {activeCashModal === 'upi' && <QrCode className="w-5 h-5" />}
                  {activeCashModal === 'cash' && <Banknote className="w-5 h-5" />}
                  {activeCashModal === 'bank' && <Landmark className="w-5 h-5" />}
                  {activeCashModal === 'customer_pending' && <Coins className="w-5 h-5" />}
                  {activeCashModal === 'partner_payable' && <Scale className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-display text-white">
                      {activeCashModal === 'upi' && 'UPI Accounts & QR Payments'}
                      {activeCashModal === 'cash' && 'Physical Cash in Hand'}
                      {activeCashModal === 'bank' && 'Bank Accounts & IMPS Balance'}
                      {activeCashModal === 'customer_pending' && 'Customer Pending & Receivables'}
                      {activeCashModal === 'partner_payable' && 'Partner Payable & Settlements'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold uppercase">
                      {activeCashModal === 'upi' && 'PhonePe / GPay / Paytm'}
                      {activeCashModal === 'cash' && 'Shop Counter Cash'}
                      {activeCashModal === 'bank' && 'Company Bank'}
                      {activeCashModal === 'customer_pending' && `${cashFlow.pendingCustomersList?.length || 0} Riders`}
                      {activeCashModal === 'partner_payable' && 'Splitwise Settlements'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCashModal === 'upi' && 'Complete breakdown of QR scans, customer GPay/PhonePe payments, and UPI expenses'}
                    {activeCashModal === 'cash' && 'Breakdown of physical currency received from riders vs cash operational expenses'}
                    {activeCashModal === 'bank' && 'Direct IMPS, bank transfers, and partner capital investments in company accounts'}
                    {activeCashModal === 'customer_pending' && 'Uncollected rental balances with direct 1-tap WhatsApp reminder'}
                    {activeCashModal === 'partner_payable' && 'Internal settlements between partners for bike repairs and collections'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCashModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Plain-English / Hinglish Educational Explain Box */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                activeCashModal === 'upi' ? 'bg-sky-500/10 border-sky-500/30' :
                activeCashModal === 'cash' ? 'bg-emerald-500/10 border-emerald-500/30' :
                activeCashModal === 'bank' ? 'bg-purple-500/10 border-purple-500/30' :
                activeCashModal === 'customer_pending' ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  <span>
                    {activeCashModal === 'upi' && 'Yeh Paisa Kahan Se Aaya & Kahan Gaya?'}
                    {activeCashModal === 'cash' && 'Cash Flow Kaise Calculate Hota Hai?'}
                    {activeCashModal === 'bank' && 'Bank Balance Kaise Calculate Hota Hai?'}
                    {activeCashModal === 'customer_pending' && 'Customer Pending Kya Hai?'}
                    {activeCashModal === 'partner_payable' && 'Partner Payable Ka Matlab Kya Hai?'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {activeCashModal === 'upi' && (
                    <>
                      Customer jab bhi bike rental ka payment <strong>PhonePe, Google Pay ya Shop QR code</strong> se pay karta hai, wo paisa sidha yahan <strong>+ Inflows</strong> me add hota hai. Jab koi partner bike servicing ya petrol ke liye UPI se pay karta hai, wo yahan se <strong>− Outflows</strong> me minus hota hai. Bacha hua amount aapka actual digital balance hai.
                    </>
                  )}
                  {activeCashModal === 'cash' && (
                    <>
                      Customer se physical currency (notes/coins) me jo payment aayi, wo <strong>+ Inflow</strong> bani. Usme se petrol ya repair ke cash kharche minus huye. Bacha hua cash counter ya partners ke paas physically maujood hai.
                    </>
                  )}
                  {activeCashModal === 'bank' && (
                    <>
                      Direct bank transfers, IMPS/NEFT customer deposits aur partners dwara invest kiya gaya capital jo company bank account me jama hai minus bank se kiye gaye kharche.
                    </>
                  )}
                  {activeCashModal === 'customer_pending' && (
                    <>
                      Yeh wo booking balance hai jo customers ne ride shuru karne ke baad abhi tak pura pay nahi kiya hai. Aap direct neeche se <strong>WhatsApp Reminder</strong> bhej kar ya direct call karke remaining payment collect kar sakte hain.
                    </>
                  )}
                  {activeCashModal === 'partner_payable' && (
                    <>
                      Jab koi partner apni personal jeb se bike repair/fuel me kharch karta hai ya kisi partner ke account me customer ka zyada paisa jama ho jata hai, tab system calculated settlement recommendation banata hai taaki sabhi partners ka hisaab 100% barabar ho sake.
                    </>
                  )}
                </p>
              </div>

              {/* Financial Summary Strip */}
              {['upi', 'cash', 'bank'].includes(activeCashModal) && (
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Total Inflows (+)</span>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      +{formatINR(
                        activeCashModal === 'upi' ? ((cashFlow.breakdown?.inflows?.payments?.upi || 0) + (cashFlow.breakdown?.inflows?.capital?.upi || 0)) :
                        activeCashModal === 'cash' ? ((cashFlow.breakdown?.inflows?.payments?.cash || 0) + (cashFlow.breakdown?.inflows?.capital?.cash || 0)) :
                        ((cashFlow.breakdown?.inflows?.payments?.bank || 0) + (cashFlow.breakdown?.inflows?.capital?.bank || 0))
                      )}
                    </p>
                    <span className="text-[9px] text-slate-500">Payments & Capital</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-semibold block uppercase">Total Outflows (−)</span>
                    <p className="text-base font-bold font-mono text-rose-400 mt-0.5">
                      −{formatINR(
                        activeCashModal === 'upi' ? (cashFlow.breakdown?.outflows?.expenses?.upi || 0) :
                        activeCashModal === 'cash' ? (cashFlow.breakdown?.outflows?.expenses?.cash || 0) :
                        (cashFlow.breakdown?.outflows?.expenses?.bank || 0)
                      )}
                    </p>
                    <span className="text-[9px] text-slate-500">Expenses & Fuel</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white font-semibold block uppercase">Net Liquid Balance</span>
                    <p className="text-base font-bold font-mono text-white mt-0.5">
                      {formatINR(
                        activeCashModal === 'upi' ? (cashFlow.upi || 0) :
                        activeCashModal === 'cash' ? (cashFlow.cashInHand || 0) :
                        (cashFlow.bank || 0)
                      )}
                    </p>
                    <span className="text-[9px] text-sky-400 font-semibold">Available Now</span>
                  </div>
                </div>
              )}

              {/* Partner Distribution Box: Who is holding this currency right now? */}
              {['upi', 'cash', 'bank'].includes(activeCashModal) && cashFlow.partnerHoldings && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-orange" />
                    Yeh {activeCashModal.toUpperCase()} Balance Kis Partner Ke Paas Hai?
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cashFlow.partnerHoldings.map((h) => {
                      const amount = activeCashModal === 'upi' ? h.upi : activeCashModal === 'cash' ? h.cash : h.bank;
                      return (
                        <div key={h.partnerId} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white text-xs">{h.name}</p>
                            <p className="text-[10px] text-slate-400">Personal holding</p>
                          </div>
                          <span className={`text-xs font-bold font-mono ${amount >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                            {formatINR(amount || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabs for Inflows vs Outflows */}
              {['upi', 'cash', 'bank'].includes(activeCashModal) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <button
                      type="button"
                      onClick={() => setCashModalTab('inflows')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        cashModalTab === 'inflows'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      Customer Payments (+ Inflows)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashModalTab('outflows')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        cashModalTab === 'outflows'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                      Business Expenses (− Outflows)
                    </button>
                  </div>

                  {/* Transaction List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cashModalTab === 'inflows' ? (
                      (() => {
                        const list =
                          activeCashModal === 'upi' ? (cashFlow.breakdown?.recentUPIPayments || []) :
                          activeCashModal === 'cash' ? (cashFlow.breakdown?.recentCashPayments || []) :
                          (cashFlow.breakdown?.recentBankPayments || []);
                        if (list.length === 0) {
                          return (
                            <p className="text-xs text-slate-400 text-center py-6 bg-white/[0.02] rounded-xl border border-white/10">
                              No customer payments recorded in this channel yet.
                            </p>
                          );
                        }
                        return list.map((item) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="text-white">{item.customerName}</strong>
                                {item.rentalNumber && (
                                  <span className="text-[10px] text-slate-400 font-mono">#{item.rentalNumber}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.bikeName} {item.bikeReg && `(${item.bikeReg})`} • Received by: <span className="text-slate-300 font-semibold">{item.partnerName}</span> • {formatDate(item.date)}
                              </p>
                            </div>
                            <span className="font-bold font-mono text-emerald-400 text-sm">
                              +{formatINR(item.amount)}
                            </span>
                          </div>
                        ));
                      })()
                    ) : (
                      (() => {
                        const list =
                          activeCashModal === 'upi' ? (cashFlow.breakdown?.recentUPIExpenses || []) :
                          activeCashModal === 'cash' ? (cashFlow.breakdown?.recentCashExpenses || []) :
                          (cashFlow.breakdown?.recentBankExpenses || []);
                        if (list.length === 0) {
                          return (
                            <p className="text-xs text-slate-400 text-center py-6 bg-white/[0.02] rounded-xl border border-white/10">
                              No expenses recorded in this channel yet.
                            </p>
                          );
                        }
                        return list.map((item) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {item.category}
                                </span>
                                <strong className="text-white">{item.description}</strong>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.bikeName} • Paid by: <span className="text-slate-300 font-semibold">{item.partnerName}</span> • {formatDate(item.date)}
                              </p>
                            </div>
                            <span className="font-bold font-mono text-rose-400 text-sm">
                              −{formatINR(item.amount)}
                            </span>
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* Customer Pending List with Direct WhatsApp and Call Reminder */}
              {activeCashModal === 'customer_pending' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Unpaid Customer Bookings ({cashFlow.pendingCustomersList?.length || 0})
                    </h4>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      Total: {formatINR(cashFlow.customerPending || 0)}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(!cashFlow.pendingCustomersList || cashFlow.pendingCustomersList.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-8 bg-white/[0.02] rounded-xl border border-white/10">
                        🎉 Great! All customers have cleared their rental dues. Zero pending!
                      </p>
                    ) : (
                      cashFlow.pendingCustomersList.map((item) => {
                        const cleanPhone = (item.customerPhone || '').replace(/\D/g, '').slice(-10);
                        const waMsg = encodeURIComponent(
                          `Namaste ${item.customerName}, this is a gentle reminder from THROTTLEX regarding your rental #${item.rentalNumber} for ${item.bikeName}. Your remaining balance is ₹${item.remainingAmount}. Kindly clear the payment at the earliest. Thank you!`
                        );
                        return (
                          <div key={item.rentalId} className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-amber-500/40 transition-all">
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-white text-sm">{item.customerName}</strong>
                                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  #{item.rentalNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                                📞 {item.customerPhone || 'No Phone'} • 🏍️ {item.bikeName} {item.bikeReg && `(${item.bikeReg})`}
                              </p>
                              {item.expectedEndDate && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Return Due: {formatDate(item.expectedEndDate)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <div className="text-right pr-2">
                                <span className="text-[10px] text-slate-400 block">Pending</span>
                                <span className="text-sm font-bold font-mono text-amber-400">
                                  {formatINR(item.remainingAmount)}
                                </span>
                              </div>
                              {cleanPhone && (
                                <>
                                  <a
                                    href={`https://wa.me/91${cleanPhone}?text=${waMsg}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                  </a>
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all"
                                    title="Call Customer"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Partner Payable Breakdown */}
              {activeCashModal === 'partner_payable' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-rose-400" /> Active Settlement Recommendations
                    </h4>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      Total: {formatINR(cashFlow.partnerPayable || 0)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(!cashFlow.breakdown?.partnerPayableList || cashFlow.breakdown.partnerPayableList.length === 0) ? (
                      <p className="text-xs text-slate-400 text-center py-8 bg-white/[0.02] rounded-xl border border-white/10">
                        🎉 All partner accounts are 100% balanced! No pending settlements.
                      </p>
                    ) : (
                      cashFlow.breakdown.partnerPayableList.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{item.fromName}</span>
                              <span className="text-rose-400 font-bold">➔ PAYS ➔</span>
                              <span className="font-bold text-emerald-400 text-sm">{item.toName}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.reason}</p>
                          </div>
                          <span className="text-base font-bold font-mono text-rose-400">
                            {formatINR(item.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCashModal(null);
                        onNavigate('partners');
                      }}
                      className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 mx-auto transition-all shadow-glow-sm"
                    >
                      Open Full Partner Settlement & Wallets <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
