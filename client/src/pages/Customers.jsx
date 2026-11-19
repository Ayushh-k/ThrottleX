import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Calendar,
  Lock,
  Unlock,
  Check,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';

export default function Customers({ onTriggerAction, refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'risk' | 'blocked' | 'expiring'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [updatingRisk, setUpdatingRisk] = useState(false);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [activeDocViewer, setActiveDocViewer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [search, refreshKey]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search });
      setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (c) => {
    try {
      setSelectedCustomer(c);
      const res = await api.getCustomerById(c._id);
      setProfileData(res);
      setBlockReasonInput(res.customer.blockedReason || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRiskStatus = async (newStatus) => {
    if (!profileData?.customer?._id) return;
    try {
      setUpdatingRisk(true);
      const updatedReason = newStatus === 'blocked' ? (blockReasonInput || 'Blocked by administrator') : '';
      const res = await api.updateCustomer(profileData.customer._id, {
        riskStatus: newStatus,
        blockedReason: updatedReason
      });
      setProfileData((prev) => ({
        ...prev,
        customer: res.customer
      }));
      // update list state
      setCustomers((prev) =>
        prev.map((c) => (c._id === res.customer._id ? { ...c, ...res.customer } : c))
      );
    } catch (err) {
      alert(err.message || 'Error updating customer risk status.');
    } finally {
      setUpdatingRisk(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'expiring') return c.isExpiringSoon || c.isDlExpired;
    return (c.riskStatus || 'verified') === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-white">Customer KYC Vault</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange font-semibold font-mono">
              {customers.length} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Secure digital vault for driving licences, Aadhaar/ID, live photos, DL expiry alerts, and risk management
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_customer')}
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" /> Add Verified Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or DL number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 bg-brand-card p-1 rounded-xl border border-brand-border overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Riders' },
            { id: 'verified', label: '🟢 Verified' },
            { id: 'pending', label: '🟡 Pending KYC' },
            { id: 'risk', label: '🟠 High Risk' },
            { id: 'blocked', label: '🔴 Blocked' },
            { id: 'expiring', label: '⚠️ DL Alerts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-brand-orange text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading KYC Vault directory...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No customers match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Rider / Photo</th>
                  <th className="py-3 px-3">Risk Status</th>
                  <th className="py-3 px-3">DL Number & Expiry</th>
                  <th className="py-3 px-3">Vault Documents</th>
                  <th className="py-3 px-3">Total Rentals</th>
                  <th className="py-3 px-3">Lifetime Spend</th>
                  <th className="py-3 px-3">Outstanding</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredCustomers.map((c) => {
                  const risk = c.riskStatus || 'verified';
                  return (
                    <tr key={c._id} className="hover:bg-brand-surface/70 transition-colors">
                      {/* Rider & Photo */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {c.photoUrl ? (
                            <img
                              src={c.photoUrl}
                              alt={c.name}
                              className="w-9 h-9 rounded-xl object-cover border border-brand-orange/40 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                              {c.name ? c.name[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Risk Status */}
                      <td className="py-3.5 px-3">
                        {risk === 'verified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {risk === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                            <AlertCircle className="w-3 h-3" /> Pending KYC
                          </span>
                        )}
                        {risk === 'risk' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> High Risk
                          </span>
                        )}
                        {risk === 'blocked' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold">
                            <Lock className="w-3 h-3" /> Blocked
                          </span>
                        )}
                      </td>

                      {/* DL & Expiry Alert */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="text-white text-xs font-semibold">{c.dlNumber || 'Verified on file'}</div>
                        {c.isDlExpired ? (
                          <span className="inline-block text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded mt-0.5">
                            🔴 Expired {Math.abs(c.daysToDlExpiry || 0)}d ago
                          </span>
                        ) : c.isExpiringSoon ? (
                          <span className="inline-block text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5">
                            🟠 Expires in {c.daysToDlExpiry} days
                          </span>
                        ) : c.dlExpiryDate ? (
                          <span className="inline-block text-[10px] text-slate-400">
                            Valid till {formatDate(c.dlExpiryDate)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Expiry not set</span>
                        )}
                      </td>

                      {/* Vault Documents Badges */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            title={c.photoUrl ? 'Rider photo uploaded' : 'Photo missing'}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                              c.photoUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-600'
                            }`}
                          >
                            📷
                          </span>
                          <span
                            title={c.dlPhotoUrl ? 'DL photo uploaded' : 'DL photo missing'}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                              c.dlPhotoUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-600'
                            }`}
                          >
                            DL
                          </span>
                          <span
                            title={c.aadhaarPhotoUrl ? 'Aadhaar/ID proof uploaded' : 'ID proof missing'}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                              c.aadhaarPhotoUrl ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-600'
                            }`}
                          >
                            ID
                          </span>
                        </div>
                      </td>

                      {/* Rentals Count */}
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {c.totalRentals || 0} trips
                      </td>

                      {/* Spend & Balance */}
                      <td className="py-3.5 px-3 font-bold font-display text-emerald-400">
                        {formatINR(c.totalSpent)}
                      </td>
                      <td className="py-3.5 px-3 font-bold font-display text-amber-400">
                        {formatINR(c.outstanding)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenProfile(c)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-orange" /> KYC Vault
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Customer Profile & KYC Vault Modal with Glassmorphism */}
      {selectedCustomer && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0c1322]/85 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Glassmorphic Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
              <div className="flex items-center gap-3">
                {profileData.customer.photoUrl ? (
                  <img
                    src={profileData.customer.photoUrl}
                    alt={profileData.customer.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-brand-orange shrink-0 shadow-glow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-brand-orange font-bold text-lg shrink-0">
                    {profileData.customer.name ? profileData.customer.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display text-white">{profileData.customer.name}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      profileData.customer.riskStatus === 'blocked'
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                        : profileData.customer.riskStatus === 'risk'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    }`}>
                      {profileData.customer.riskStatus || 'verified'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Phone: <span className="font-mono text-white font-semibold">{profileData.customer.phone}</span> • Father: {profileData.customer.fatherName || 'On Record'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setProfileData(null);
                  setActiveDocViewer(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Blocked Alert Banner if blocked */}
              {profileData.customer.riskStatus === 'blocked' && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 backdrop-blur-md border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <strong className="text-rose-100">BLOCKED RIDER:</strong> {profileData.customer.blockedReason || 'Flagged by administrator.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={updatingRisk}
                    onClick={() => handleUpdateRiskStatus('verified')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 transition-colors shadow-sm"
                  >
                    Unblock Rider
                  </button>
                </div>
              )}

              {/* Glass Risk Control Manager Bar */}
              <div className="p-4 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-orange" /> Update Risk Status & Security Clearance
                  </span>
                  {updatingRisk && <span className="text-[11px] text-brand-orange animate-pulse">Updating...</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'verified', label: '🟢 Verified', color: 'hover:border-emerald-500 hover:bg-emerald-500/10' },
                    { id: 'pending', label: '🟡 Pending KYC', color: 'hover:border-amber-500 hover:bg-amber-500/10' },
                    { id: 'risk', label: '🟠 High Risk', color: 'hover:border-orange-500 hover:bg-orange-500/10' },
                    { id: 'blocked', label: '🔴 Block Customer', color: 'hover:border-rose-500 hover:bg-rose-500/10' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={updatingRisk}
                      onClick={() => {
                        if (s.id === 'blocked') {
                          const reason = prompt('Enter reason for blocking this customer:', profileData.customer.blockedReason || 'Unpaid damage / Late return');
                          if (reason !== null) {
                            setBlockReasonInput(reason);
                            handleUpdateRiskStatus('blocked');
                          }
                        } else {
                          handleUpdateRiskStatus(s.id);
                        }
                      }}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                        profileData.customer.riskStatus === s.id
                          ? s.id === 'blocked'
                            ? 'border-rose-500 bg-rose-500/25 text-rose-200 font-bold shadow-sm'
                            : 'border-brand-orange bg-brand-orange/25 text-white font-bold shadow-glow-sm'
                          : `border-white/10 bg-white/[0.03] text-slate-300 ${s.color}`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass KYC Vault Document Gallery */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-orange" /> KYC Digital Document Vault
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* DL Front */}
                  <div
                    onClick={() => profileData.customer.dlPhotoUrl && setActiveDocViewer(profileData.customer.dlPhotoUrl)}
                    className={`p-3 rounded-xl border transition-all text-center flex flex-col justify-between ${
                      profileData.customer.dlPhotoUrl
                        ? 'border-white/15 bg-white/[0.04] backdrop-blur-md hover:border-brand-orange cursor-pointer hover:bg-white/[0.08]'
                        : 'border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-white/30'
                    }`}
                  >
                    <p className="text-[10px] text-slate-300 uppercase font-semibold mb-1">DL Front</p>
                    {profileData.customer.dlPhotoUrl ? (
                      <img src={profileData.customer.dlPhotoUrl} alt="DL Front" className="h-16 w-full object-cover rounded-lg" />
                    ) : (
                      <div className="h-16 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[11px] text-slate-300">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[10px] text-brand-orange mt-1.5 block font-mono font-semibold">
                      {profileData.customer.dlNumber || 'DL on file'}
                    </span>
                  </div>

                  {/* DL Back */}
                  <div
                    onClick={() => profileData.customer.dlBackPhotoUrl && setActiveDocViewer(profileData.customer.dlBackPhotoUrl)}
                    className={`p-3 rounded-xl border transition-all text-center flex flex-col justify-between ${
                      profileData.customer.dlBackPhotoUrl
                        ? 'border-white/15 bg-white/[0.04] backdrop-blur-md hover:border-brand-orange cursor-pointer hover:bg-white/[0.08]'
                        : 'border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-white/30'
                    }`}
                  >
                    <p className="text-[10px] text-slate-300 uppercase font-semibold mb-1">DL Back</p>
                    {profileData.customer.dlBackPhotoUrl ? (
                      <img src={profileData.customer.dlBackPhotoUrl} alt="DL Back" className="h-16 w-full object-cover rounded-lg" />
                    ) : (
                      <div className="h-16 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[11px] text-slate-300">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-200 mt-1.5 block">
                      {profileData.customer.dlExpiryDate ? `Exp: ${formatDate(profileData.customer.dlExpiryDate)}` : 'No Expiry Set'}
                    </span>
                  </div>

                  {/* Aadhaar Front */}
                  <div
                    onClick={() => profileData.customer.aadhaarPhotoUrl && setActiveDocViewer(profileData.customer.aadhaarPhotoUrl)}
                    className={`p-3 rounded-xl border transition-all text-center flex flex-col justify-between ${
                      profileData.customer.aadhaarPhotoUrl
                        ? 'border-white/15 bg-white/[0.04] backdrop-blur-md hover:border-brand-orange cursor-pointer hover:bg-white/[0.08]'
                        : 'border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-white/30'
                    }`}
                  >
                    <p className="text-[10px] text-slate-300 uppercase font-semibold mb-1">Aadhaar Front</p>
                    {profileData.customer.aadhaarPhotoUrl ? (
                      <img src={profileData.customer.aadhaarPhotoUrl} alt="Aadhaar Front" className="h-16 w-full object-cover rounded-lg" />
                    ) : (
                      <div className="h-16 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[11px] text-slate-300">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-200 mt-1.5 block font-mono">
                      {profileData.customer.idProofNumber || 'ID on file'}
                    </span>
                  </div>

                  {/* Aadhaar Back */}
                  <div
                    onClick={() => profileData.customer.aadhaarBackPhotoUrl && setActiveDocViewer(profileData.customer.aadhaarBackPhotoUrl)}
                    className={`p-3 rounded-xl border transition-all text-center flex flex-col justify-between ${
                      profileData.customer.aadhaarBackPhotoUrl
                        ? 'border-white/15 bg-white/[0.04] backdrop-blur-md hover:border-brand-orange cursor-pointer hover:bg-white/[0.08]'
                        : 'border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md hover:border-white/30'
                    }`}
                  >
                    <p className="text-[10px] text-slate-300 uppercase font-semibold mb-1">Aadhaar Back</p>
                    {profileData.customer.aadhaarBackPhotoUrl ? (
                      <img src={profileData.customer.aadhaarBackPhotoUrl} alt="Aadhaar Back" className="h-16 w-full object-cover rounded-lg" />
                    ) : (
                      <div className="h-16 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[11px] text-slate-300">Not Uploaded</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-200 mt-1.5 block">Address Proof</span>
                  </div>
                </div>
              </div>

              {/* Fullscreen Document Viewer Preview */}
              {activeDocViewer && (
                <div className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-brand-orange space-y-2 shadow-2xl">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-brand-orange">🔍 Full Document Inspection</span>
                    <button
                      type="button"
                      onClick={() => setActiveDocViewer(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close Viewer ✕
                    </button>
                  </div>
                  <img src={activeDocViewer} alt="Document" className="max-h-72 w-auto mx-auto rounded-lg shadow-lg" />
                </div>
              )}

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block font-semibold">Completed Trips</span>
                  <p className="text-xl font-bold text-white mt-0.5">{profileData.stats.totalRentals}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block font-semibold">Lifetime Spend</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatINR(profileData.stats.totalPaid)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 uppercase block font-semibold">Outstanding Balance</span>
                  <p className="text-xl font-bold text-amber-400 mt-0.5">{formatINR(profileData.stats.outstanding)}</p>
                </div>
              </div>

              {/* Guarantor Details */}
              {profileData.customer.guarantor?.name && (
                <div className="p-3.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" /> Emergency Guarantor Record
                  </div>
                  <p className="text-slate-300">
                    Name: <strong className="text-white">{profileData.customer.guarantor.name}</strong> ({profileData.customer.guarantor.relation}) • Phone: <span className="font-mono text-white">{profileData.customer.guarantor.phone}</span> • ID: <span className="font-mono text-white">{profileData.customer.guarantor.idProofNumber || 'On Record'}</span>
                  </p>
                </div>
              )}

              {/* Rental History */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Previous Rental History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {profileData.rentals?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/10">
                      No past rentals found for this customer.
                    </p>
                  ) : (
                    profileData.rentals.map((r) => (
                      <div key={r._id} className="p-3 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-between text-xs hover:border-brand-orange/40 hover:bg-white/[0.07] transition-all">
                        <div>
                          <p className="font-semibold text-white">#{r.rentalNumber} • {r.bike?.name}</p>
                          <p className="text-[10px] text-slate-300 font-mono">
                            {r.bike?.registrationNumber} • {r.rentalType === 'hourly' ? `${r.totalHours} hrs` : `${r.totalDays} days`} • {formatDate(r.startDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{formatINR(r.totalAmount)}</p>
                          <span className={`text-[10px] uppercase font-semibold ${
                            r.status === 'active' ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
