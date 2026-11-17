import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Scale, IndianRupee, ArrowRight, ShieldCheck, Mail, Phone, Key, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Partners({ onNavigate, onTriggerAction, refreshKey }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Partner form modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerShare, setNewPartnerShare] = useState('50');
  const [newPartnerPassword, setNewPartnerPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manage Login Access Modal state
  const [loginModalPartner, setLoginModalPartner] = useState(null);
  const [loginModalEmail, setLoginModalEmail] = useState('');
  const [loginModalPassword, setLoginModalPassword] = useState('');
  const [loginModalLoading, setLoginModalLoading] = useState(false);
  const [loginModalSuccess, setLoginModalSuccess] = useState('');
  const [loginModalError, setLoginModalError] = useState('');

  useEffect(() => {
    loadPartners();
  }, [refreshKey]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await api.getPartners();
      setData(res);
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
        password: newPartnerPassword.trim()
      });
      setIsAddOpen(false);
      setNewPartnerName('');
      setNewPartnerEmail('');
      setNewPartnerPhone('');
      setNewPartnerPassword('');
      loadPartners();
    } catch (err) {
      alert(err.message || 'Error adding partner.');
    } finally {
      setSubmitting(false);
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
        loadPartners();
      }, 1200);
    } catch (err) {
      setLoginModalError(err.message || 'Error saving login credentials.');
    } finally {
      setLoginModalLoading(false);
    }
  };

  const { partners = [], realizedProfit = 0, totalRevenueCollected = 0, totalExpensesPaid = 0, recommendations = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Business Partners & Profit Sharing</h1>
          <p className="text-xs text-slate-400">
            Track individual cash collections, out-of-pocket expenses, net balances, and settlements
          </p>
        </div>

        {user?.role === 'owner' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Partner
          </button>
        )}
      </div>

      {/* Realized Profit & Settlement Header */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-slate-400">Total Cash Collected</span>
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
          <span className="text-xs text-slate-400">Realized Cash Profit</span>
          <p className="text-xl font-bold font-display text-white mt-1">
            {formatINR(realizedProfit)}
          </p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Active Settlements</span>
          <p className="text-xl font-bold font-display text-brand-orange mt-1">
            {recommendations.length > 0 ? `${recommendations.length} Pending` : 'All Settled'}
          </p>
        </div>
      </div>

      {/* Partner Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((partner) => {
          const isCreditor = partner.balance > 0;
          const isDebtor = partner.balance < 0;

          return (
            <div
              key={partner.partnerId}
              className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col justify-between space-y-6 shadow-card-dark"
            >
              {/* Partner Identity */}
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
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {partner.sharePercentage}% Profit Share
                    </span>
                  </div>
                </div>

                <StatusBadge status={partner.status} />
              </div>

              {/* Numbers Breakdown Separating Rent and Expenses */}
              <div className="space-y-3">
                {/* 1. Rent Section */}
                <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Rent Revenue Share
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
                    <span>Rent Collected: <strong className="text-white">{formatINR(partner.rent?.collected || 0)}</strong></span>
                    <span>Entitled Share: <strong className="text-emerald-400">{formatINR(partner.rent?.entitled || 0)}</strong></span>
                  </div>
                </div>

                {/* 2. Expense Section */}
                <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> Expense Outlay Share
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

              {/* Status explanation */}
              <div className="text-xs text-slate-400">
                <button
                  onClick={() => onNavigate('settlements')}
                  className="w-full py-2 px-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-orange/40 text-brand-orange text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Scale className="w-3.5 h-3.5" /> View Independent Settlements
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Partner Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold font-display text-white text-lg mb-1">Add Business Partner</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add another equity partner with configurable profit-sharing percentage.
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

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Profit Share Percentage (%)</label>
                <input
                  type="number"
                  value={newPartnerShare}
                  onChange={(e) => setNewPartnerShare(e.target.value)}
                  placeholder="33"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Portal Login Password (Optional)
                </label>
                <input
                  type="text"
                  value={newPartnerPassword}
                  onChange={(e) => setNewPartnerPassword(e.target.value)}
                  placeholder="e.g. partner@tx123 (defaults to name@tx123)"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Partner can sign in using this email & password to record their own expenses and rentals.
                </p>
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
            {/* Header */}
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
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-1 text-slate-300">
                <p>
                  Setting credentials gives <strong>{loginModalPartner.name}</strong> access to:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px] mt-1">
                  <li>Sign in at <strong>throttlex-nine.vercel.app</strong></li>
                  <li>Record out-of-pocket expenses (tracked to their reimbursement)</li>
                  <li>Rent motorcycles to customers & receive advance rent payments</li>
                  <li>Add new motorcycles to the fleet</li>
                  <li>View fleet analytics dashboard & independent settlement ledger</li>
                </ul>
              </div>

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
