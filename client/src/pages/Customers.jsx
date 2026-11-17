import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, FileText, ArrowRight, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function Customers({ onTriggerAction, refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileData, setProfileData] = useState(null);

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
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Customer Profiles & KYC</h1>
          <p className="text-xs text-slate-400">
            Maintain customer rental records, driving licences, contact info, and lifetime spend
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_customer')}
          className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name, phone, or DL number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
        />
      </div>

      {/* Customers Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading customer directory...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">DL Number</th>
                  <th className="py-3 px-3">Total Rentals</th>
                  <th className="py-3 px-3">Lifetime Spend</th>
                  <th className="py-3 px-3">Outstanding</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-surface/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.address || 'Address on file'}</p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono">{c.phone}</td>
                    <td className="py-3.5 px-3 text-slate-400">{c.email || '-'}</td>
                    <td className="py-3.5 px-3 font-mono text-white">{c.dlNumber || 'Verified'}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">
                      {c.totalRentals || 0} trips
                    </td>
                    <td className="py-3.5 px-3 font-bold font-display text-emerald-400">
                      {formatINR(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-3 font-bold font-display text-amber-400">
                      {formatINR(c.outstanding)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenProfile(c)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Modal with Full Rental History */}
      {selectedCustomer && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-brand-border">
              <div>
                <h3 className="text-xl font-bold font-display text-white">{profileData.customer.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phone: {profileData.customer.phone} • DL: {profileData.customer.dlNumber || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setProfileData(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-xl bg-brand-surface border border-brand-border text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Total Trips</span>
                <p className="text-lg font-bold text-white mt-0.5">{profileData.stats.totalRentals}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Total Paid</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatINR(profileData.stats.totalPaid)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Outstanding</span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{formatINR(profileData.stats.outstanding)}</p>
              </div>
            </div>

            {/* Rentals History */}
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Previous Rental History</h4>
            <div className="space-y-2">
              {profileData.rentals?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No rentals recorded.</p>
              ) : (
                profileData.rentals.map((r) => (
                  <div key={r._id} className="p-3 rounded-xl bg-brand-surface border border-brand-border/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">#{r.rentalNumber} • {r.bike?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.bike?.registrationNumber} • {r.totalDays} days</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatINR(r.totalAmount)}</p>
                      <span className="text-[10px] uppercase font-semibold text-brand-orange">{r.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
