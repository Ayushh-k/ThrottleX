import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Scale,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Wallet,
  Landmark,
  Coins,
  History,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bike as BikeIcon,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Partners({ onNavigate, onTriggerAction, refreshKey }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [capitalData, setCapitalData] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Partner form modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerShare, setNewPartnerShare] = useState('50');
  const [newPartnerInitialCapital, setNewPartnerInitialCapital] = useState('0');
  const [newPartnerPassword, setNewPartnerPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Record Capital Investment modal state
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [investPartnerId, setInvestPartnerId] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [investType, setInvestType] = useState('bike_purchase');
  const [investBikeId, setInvestBikeId] = useState('');
  const [investMethod, setInvestMethod] = useState('bank_transfer');
  const [investNotes, setInvestNotes] = useState('');
  const [syncShareOnInvest, setSyncShareOnInvest] = useState(true);
  const [investLoading, setInvestLoading] = useState(false);
  const [investError, setInvestError] = useState('');

  // Virtual Ledger Modal state
  const [ledgerModalPartner, setLedgerModalPartner] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);

  // Manage Login Access Modal state
  const [loginModalPartner, setLoginModalPartner] = useState(null);
  const [loginModalEmail, setLoginModalEmail] = useState('');
  const [loginModalPassword, setLoginModalPassword] = useState('');
  const [loginModalLoading, setLoginModalLoading] = useState(false);
  const [loginModalSuccess, setLoginModalSuccess] = useState('');
  const [loginModalError, setLoginModalError] = useState('');

  // Sync ownership state
  const [syncingOwnership, setSyncingOwnership] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadAllData();
  }, [refreshKey]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [partnersRes, capitalRes, bikesRes] = await Promise.all([
        api.getPartners(),
        api.getCapital().catch(() => null),
        api.getBikes().catch(() => ({ bikes: [] }))
      ]);
      setData(partnersRes);
      setCapitalData(capitalRes);
      setBikes(bikesRes.bikes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    try {
      setSubmitting(true);
      await api.createPartner({
        name: newPartnerName.trim(),
        email: newPartnerEmail.trim(),
        phone: newPartnerPhone.trim(),
        sharePercentage: Number(newPartnerShare),
        initialCapital: Number(newPartnerInitialCapital) || 0,
        password: newPartnerPassword.trim()
      });
      setIsAddOpen(false);
      setNewPartnerName('');
      setNewPartnerEmail('');
      setNewPartnerPhone('');
      setNewPartnerPassword('');
      setNewPartnerInitialCapital('0');
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error adding partner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInvestment = async (e) => {
    e.preventDefault();
    if (!investPartnerId || !investAmount || Number(investAmount) <= 0) {
      setInvestError('Please select a partner and enter a valid investment amount.');
      return;
    }

    try {
      setInvestLoading(true);
      setInvestError('');
      await api.createInvestment({
        partnerId: investPartnerId,
        amount: Number(investAmount),
        type: investType,
        bikeId: investBikeId || null,
        paymentMethod: investMethod,
        notes: investNotes,
        syncProfitShare: syncShareOnInvest
      });
      setIsInvestOpen(false);
      setInvestAmount('');
      setInvestNotes('');
      setInvestBikeId('');
      loadAllData();
    } catch (err) {
      setInvestError(err.message || 'Error recording capital investment.');
    } finally {
      setInvestLoading(false);
    }
  };

  const handleSyncOwnership = async () => {
    if (!window.confirm('Apply dynamic capital ownership percentage to partner profit-sharing ratios? All future and current profit/expense splits will update accordingly.')) {
      return;
    }

    try {
      setSyncingOwnership(true);
      const res = await api.syncOwnershipToShare();
      setSyncMessage(res.message || 'Ownership ratios successfully synced!');
      setTimeout(() => setSyncMessage(''), 3500);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to sync ownership ratios.');
    } finally {
      setSyncingOwnership(false);
    }
  };

  const handleOpenVirtualLedger = async (partner) => {
    try {
      setLedgerModalPartner(partner);
      setLedgerLoading(true);
      const res = await api.getPartnerWallet(partner.partnerId);
      setLedgerData(res);
    } catch (err) {
      console.error(err);
      alert('Unable to load virtual ledger.');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSavePartnerLogin = async (e) => {
    e.preventDefault();
    if (!loginModalPartner) return;
    if (!loginModalPassword || loginModalPassword.trim().length < 6) {
      setLoginModalError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoginModalLoading(true);
      setLoginModalError('');
      await api.setPartnerLoginAccess(loginModalPartner.partnerId, {
        email: loginModalEmail.trim(),
        password: loginModalPassword.trim()
      });
      setLoginModalSuccess('Login access saved! Partner can now log in.');
      setTimeout(() => {
        setLoginModalPartner(null);
        setLoginModalSuccess('');
        setLoginModalPassword('');
        loadAllData();
      }, 1200);
    } catch (err) {
      setLoginModalError(err.message || 'Error saving login credentials.');
    } finally {
      setLoginModalLoading(false);
    }
  };

  const {
    partners = [],
    realizedProfit = 0,
    totalRevenueCollected = 0,
    totalExpensesPaid = 0,
    totalCapitalInvested = 0,
    recommendations = []
  } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Business Partners & Capital Tracking</h1>
          <p className="text-xs text-slate-400">
            Track capital equity, individual partner virtual wallets, cash positions, and profit distributions
          </p>
        </div>

        {user?.role === 'owner' && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                if (partners.length > 0) setInvestPartnerId(partners[0].partnerId);
                setIsInvestOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 transition-all"
            >
              <Coins className="w-4 h-4" /> + Record Capital Investment
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-3.5 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>
        )}
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* 8. Capital & Dynamic Ownership Tracking Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-brand-card border border-brand-border space-y-5 shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                Investment & Capital Ownership
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  EQUITY CONTROL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dynamic ownership calculated from capital invested in bikes and working reserves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Total Capital Invested</span>
              <span className="text-xl font-bold font-display text-white">
                {formatINR(capitalData?.totalCapital || totalCapitalInvested || 0)}
              </span>
            </div>

            {user?.role === 'owner' && (
              <button
                type="button"
                onClick={handleSyncOwnership}
                disabled={syncingOwnership}
                title="Sync dynamic ownership percentages into profit-sharing ratios"
                className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${syncingOwnership ? 'animate-spin' : ''}`} />
                <span>Apply Ratios to Profit Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Ownership Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Capital Ownership Ratio</span>
            <div className="flex items-center gap-3">
              {(capitalData?.partners || partners).map((p, idx) => (
                <span key={p.partnerId || idx} className="text-[11px] font-mono">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${idx === 0 ? 'bg-brand-orange' : 'bg-purple-400'}`} />
                  {p.name}: <strong className="text-white">{p.ownershipPercentage || p.sharePercentage}%</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Dual / multi segmented bar */}
          <div className="w-full h-3 rounded-full bg-brand-dark border border-white/5 overflow-hidden flex">
            {(capitalData?.partners || partners).map((p, idx) => {
              const pct = Number(p.ownershipPercentage || p.sharePercentage || 50);
              return (
                <div
                  key={p.partnerId || idx}
                  style={{ width: `${pct}%` }}
                  className={`h-full transition-all duration-500 ${
                    idx === 0 ? 'bg-gradient-to-r from-brand-orange to-amber-500' : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                  }`}
                  title={`${p.name}: ${pct}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Partner Capital Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(capitalData?.partners || partners).map((cp) => (
            <div
              key={cp.partnerId}
              className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{cp.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {cp.ownershipPercentage || cp.sharePercentage}% Equity
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                <div>
                  <span className="text-slate-400 block text-[10px]">Capital Invested</span>
                  <span className="font-bold text-white text-sm font-display">
                    {formatINR(cp.totalCapital || cp.wallet?.invested || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Profit Share Ratio</span>
                  <span className="font-semibold text-brand-orange text-sm font-mono">
                    {cp.configuredSharePercentage || cp.sharePercentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Realized Profit & Financial Totals Header */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-slate-400">Total Revenue Collected</span>
          <p className="text-xl font-bold font-display text-emerald-400 mt-1">
            {formatINR(totalRevenueCollected)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Total Expenses Paid Out</span>
          <p className="text-xl font-bold font-display text-rose-400 mt-1">
            {formatINR(totalExpensesPaid)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Realized Business Profit</span>
          <p className="text-xl font-bold font-display text-white mt-1">
            {formatINR(realizedProfit)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Active Debt Recommendations</span>
          <p className="text-xl font-bold font-display text-brand-orange mt-1">
            {recommendations.length > 0 ? `${recommendations.length} Pending` : 'All Settled'}
          </p>
        </div>
      </div>

      {/* Partner Profiles & 7. Virtual Wallet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {partners.map((partner) => {
          const w = partner.wallet || {};
          const isCreditor = w.currentBalance > 0;
          const isDebtor = w.currentBalance < 0;

          return (
            <div
              key={partner.partnerId}
              className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col justify-between space-y-6 shadow-card-dark"
            >
              {/* Partner Identity Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={partner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={partner.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-border"
                  />
                  <div>
                    <h3 className="font-bold font-display text-white text-lg">{partner.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{partner.email}</span>
                      <span>•</span>
                      <span>{partner.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                        {partner.sharePercentage}% Profit Share
                      </span>
                      {partner.ownershipPercentage && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                          {partner.ownershipPercentage}% Capital Ownership
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <StatusBadge status={partner.status} />
              </div>

              {/* 7. Partner Virtual Wallet (Exact Real Position) */}
              <div className="p-4 rounded-xl bg-brand-surface/90 border border-brand-border space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Virtual Wallet & Ledger
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenVirtualLedger(partner)}
                    className="text-[11px] font-bold text-brand-orange hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Virtual Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* The 5 Core Ledger Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-brand-dark/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Invested Capital</span>
                    <span className="font-bold font-display text-white text-sm">
                      {formatINR(w.invested || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand-dark/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Expenses Paid</span>
                    <span className="font-bold font-display text-rose-400 text-sm">
                      {formatINR(w.expensesPaid || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand-dark/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Revenue Collected</span>
                    <span className="font-bold font-display text-sky-400 text-sm">
                      {formatINR(w.revenueCollected || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand-dark/80 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Profit Share</span>
                    <span className="font-bold font-display text-purple-400 text-sm">
                      {formatINR(w.profitShare || 0)}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg col-span-2 sm:col-span-2 border ${
                    isCreditor
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isDebtor
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-brand-dark/80 border-white/5'
                  }`}>
                    <span className="text-[10px] text-slate-400 block">Current Balance</span>
                    <span className={`font-bold font-display text-sm ${
                      isCreditor ? 'text-emerald-400' : isDebtor ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {w.currentBalance > 0.01
                        ? `+${formatINR(w.currentBalance)} (To Receive)`
                        : w.currentBalance < -0.01
                        ? `${formatINR(w.currentBalance)} (To Pay)`
                        : 'Settled (₹0)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Numbers Breakdown Separating Rent and Expenses */}
              <div className="space-y-2.5">
                {/* 1. Rent Section */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-brand-border/40">
                    <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Rent Revenue Share
                    </span>
                    <span
                      className={`font-bold font-display text-xs ${
                        (partner.rent?.balance || 0) > 0.01
                          ? 'text-emerald-400'
                          : (partner.rent?.balance || 0) < -0.01
                          ? 'text-orange-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {(partner.rent?.balance || 0) > 0.01
                        ? `+${formatINR(partner.rent?.balance)} (Receivable)`
                        : (partner.rent?.balance || 0) < -0.01
                        ? `${formatINR(partner.rent?.balance)} (Payable)`
                        : 'Settled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Rent In Hand: <strong className="text-white">{formatINR(partner.rent?.collected || 0)}</strong></span>
                    <span>Entitled: <strong className="text-emerald-400">{formatINR(partner.rent?.entitled || 0)}</strong></span>
                  </div>
                </div>

                {/* 2. Expense Section */}
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-brand-border/40">
                    <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Expense Outlay Share
                    </span>
                    <span
                      className={`font-bold font-display text-xs ${
                        (partner.expense?.balance || 0) > 0.01
                          ? 'text-emerald-400'
                          : (partner.expense?.balance || 0) < -0.01
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {(partner.expense?.balance || 0) > 0.01
                        ? `+${formatINR(partner.expense?.balance)} (To Receive)`
                        : (partner.expense?.balance || 0) < -0.01
                        ? `${formatINR(partner.expense?.balance)} (To Reimburse)`
                        : 'Settled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Out of Pocket Paid: <strong className="text-white">{formatINR(partner.expense?.paid || 0)}</strong></span>
                    <span>Fair Share: <strong className="text-rose-400">{formatINR(partner.expense?.fairShare || 0)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Portal Login Credentials Bar */}
              <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">Portal Login Access</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {partner.hasLoginAccess ? (
                        <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Enabled ({partner.loginEmail || partner.email})
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          No password set
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {user?.role === 'owner' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalPartner(partner);
                      setLoginModalEmail(partner.loginEmail || partner.email || '');
                      setLoginModalPassword('');
                      setLoginModalError('');
                      setLoginModalSuccess('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600/15 text-purple-300 border border-purple-500/30 hover:bg-purple-600/25 transition-all shrink-0"
                  >
                    {partner.hasLoginAccess ? 'Reset Password' : 'Set Password'}
                  </button>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenVirtualLedger(partner)}
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-orange/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <History className="w-3.5 h-3.5 text-emerald-400" /> Virtual Ledger
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('settlements')}
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-orange/40 text-brand-orange text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Scale className="w-3.5 h-3.5" /> Settle Balances
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          Virtual Ledger Timeline Modal
         ========================================================================= */}
      {ledgerModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-border bg-brand-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {ledgerModalPartner.name} — Virtual Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive chronological ledger of capital, rent collections, expenses, and profit share
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLedgerModalPartner(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Summary Strip */}
            {ledgerData?.wallet && (
              <div className="p-4 bg-brand-surface/70 border-b border-brand-border grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs text-center">
                <div className="p-2 rounded-lg bg-brand-dark/70">
                  <span className="text-[10px] text-slate-400 block">Invested</span>
                  <span className="font-bold font-display text-white">{formatINR(ledgerData.wallet.invested || 0)}</span>
                </div>
                <div className="p-2 rounded-lg bg-brand-dark/70">
                  <span className="text-[10px] text-slate-400 block">Expenses Paid</span>
                  <span className="font-bold font-display text-rose-400">{formatINR(ledgerData.wallet.expensesPaid || 0)}</span>
                </div>
                <div className="p-2 rounded-lg bg-brand-dark/70">
                  <span className="text-[10px] text-slate-400 block">Revenue Collected</span>
                  <span className="font-bold font-display text-sky-400">{formatINR(ledgerData.wallet.revenueCollected || 0)}</span>
                </div>
                <div className="p-2 rounded-lg bg-brand-dark/70">
                  <span className="text-[10px] text-slate-400 block">Profit Share</span>
                  <span className="font-bold font-display text-purple-400">{formatINR(ledgerData.wallet.profitShare || 0)}</span>
                </div>
                <div className="p-2 rounded-lg bg-brand-dark/70 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Current Balance</span>
                  <span className={`font-bold font-display ${ledgerData.wallet.currentBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ledgerData.wallet.currentBalance >= 0 ? `+${formatINR(ledgerData.wallet.currentBalance)}` : formatINR(ledgerData.wallet.currentBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Ledger Transactions List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {ledgerLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading chronological ledger events...
                </div>
              ) : !ledgerData?.events || ledgerData.events.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No recorded ledger transactions for this partner yet.
                </div>
              ) : (
                ledgerData.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{ev.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                          {ev.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{ev.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{formatDateTime(ev.date)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold font-display block ${
                        ev.direction === 'credit' ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {ev.direction === 'credit' ? `+${formatINR(ev.amount)}` : `-${formatINR(ev.amount)}`}
                      </span>
                      <span className="text-[9px] uppercase font-mono text-slate-500">
                        {ev.direction === 'credit' ? 'Credit / Reimbursable' : 'Debit / In Hand'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-brand-border bg-brand-surface flex justify-end">
              <button
                type="button"
                onClick={() => setLedgerModalPartner(null)}
                className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/15 text-white rounded-xl"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Record Capital Investment Modal
         ========================================================================= */}
      {isInvestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Capital Investment</h3>
                  <p className="text-xs text-slate-400">Add partner capital for bike purchase or working reserves</p>
                </div>
              </div>
              <button
                onClick={() => setIsInvestOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {investError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {investError}
              </div>
            )}

            <form onSubmit={handleCreateInvestment} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Investing Partner *</label>
                <select
                  value={investPartnerId}
                  onChange={(e) => setInvestPartnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                  required
                >
                  <option value="">-- Select Partner --</option>
                  {partners.map((p) => (
                    <option key={p.partnerId} value={p.partnerId}>
                      {p.name} ({p.sharePercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Investment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white text-base font-bold font-display"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Investment Purpose</label>
                  <select
                    value={investType}
                    onChange={(e) => setInvestType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                  >
                    <option value="bike_purchase">Bike Purchase</option>
                    <option value="working_capital">Working Capital</option>
                    <option value="expansion">Business Expansion</option>
                    <option value="equipment">Equipment / Accessories</option>
                    <option value="other">Other Capital</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payment Method</label>
                  <select
                    value={investMethod}
                    onChange={(e) => setInvestMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              {investType === 'bike_purchase' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Specific Motorcycle (Optional)</label>
                  <select
                    value={investBikeId}
                    onChange={(e) => setInvestBikeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                  >
                    <option value="">-- Fleet General (No specific bike) --</option>
                    {bikes.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.registrationNumber}) - Purchase Price: {formatINR(b.purchasePrice || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={investNotes}
                  onChange={(e) => setInvestNotes(e.target.value)}
                  placeholder="e.g. Contributed for Hunter 350 down payment"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                />
              </div>

              {/* Automatic Ownership Sync Checkbox */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-slate-300 space-y-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncShareOnInvest}
                    onChange={(e) => setSyncShareOnInvest(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-brand-border bg-brand-surface text-purple-600 focus:ring-purple-500 accent-purple-600"
                  />
                  <div>
                    <span className="font-semibold text-white block">Auto-Sync Profit Share Ratio</span>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Automatically calculate and update partners' profit-sharing % based on total capital ownership (e.g. ₹1L vs ₹50k → 66.67% / 33.33%).
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsInvestOpen(false)}
                  className="px-3.5 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-glow-sm disabled:opacity-50"
                >
                  {investLoading ? 'Recording...' : 'Record Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Partner Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold font-display text-white text-lg mb-1">Add Business Partner</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add another equity partner with initial capital and profit-sharing ratio.
            </p>

            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Partner Name *</label>
                <input
                  type="text"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  value={newPartnerEmail}
                  onChange={(e) => setNewPartnerEmail(e.target.value)}
                  placeholder="partner@throttlex.com"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Phone</label>
                <input
                  type="tel"
                  value={newPartnerPhone}
                  onChange={(e) => setNewPartnerPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Initial Capital (₹)</label>
                  <input
                    type="number"
                    value={newPartnerInitialCapital}
                    onChange={(e) => setNewPartnerInitialCapital(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Profit Share (%)</label>
                  <input
                    type="number"
                    value={newPartnerShare}
                    onChange={(e) => setNewPartnerShare(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Portal Login Password (Optional)
                </label>
                <input
                  type="text"
                  value={newPartnerPassword}
                  onChange={(e) => setNewPartnerPassword(e.target.value)}
                  placeholder="e.g. partner@tx123"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-orange text-white font-bold rounded-xl"
                >
                  {submitting ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Partner Login Access Modal */}
      {loginModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Partner Portal Login</h3>
                  <p className="text-xs text-slate-400">Configure login for {loginModalPartner.name}</p>
                </div>
              </div>
              <button
                onClick={() => setLoginModalPartner(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginModalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {loginModalError}
              </div>
            )}

            {loginModalSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {loginModalSuccess}
              </div>
            )}

            <form onSubmit={handleSavePartnerLogin} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Login Email Address *</label>
                <input
                  type="email"
                  value={loginModalEmail}
                  onChange={(e) => setLoginModalEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Set New Password *</label>
                <input
                  type="text"
                  value={loginModalPassword}
                  onChange={(e) => setLoginModalPassword(e.target.value)}
                  placeholder="e.g. akshit@tx123 (minimum 6 characters)"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-mono text-sm"
                  required
                />
              </div>

              <div className="pt-2 border-t border-brand-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLoginModalPartner(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white rounded-lg bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginModalLoading}
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-glow-sm transition-all disabled:opacity-50"
                >
                  {loginModalLoading ? 'Saving...' : 'Save & Enable Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
