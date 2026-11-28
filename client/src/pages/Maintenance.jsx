import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Filter, AlertTriangle, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatKm } from '../utils/formatters';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Maintenance({ onTriggerAction, refreshKey }) {
  const [records, setRecords] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bikeFilter, setBikeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [bikeFilter, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, bRes] = await Promise.all([
        api.getMaintenance({ bikeId: bikeFilter }),
        api.getBikes()
      ]);
      setRecords(mRes.records || []);
      setBikes(bRes.bikes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalMaintenanceCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Service & Maintenance</h1>
          <p className="text-xs text-slate-400">
            Log periodic services, repairs, workshop invoices, and next service alerts
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_maintenance')}
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Service
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Total Workshop Spend</span>
          <p className="text-2xl font-bold font-display text-rose-400 mt-1">
            {formatINR(totalMaintenanceCost)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Services Completed</span>
          <p className="text-2xl font-bold font-display text-white mt-1">
            {records.length} Records
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Fleet Health</span>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-1">
            All Bikes Maintained
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={bikeFilter}
          onChange={(e) => setBikeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white max-w-xs"
        >
          <option value="all">-- All Fleet Motorcycles --</option>
          {bikes.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.registrationNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <SkeletonLoader type="list" count={4} />
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No service records found.
          </div>
        ) : (
          <>
            {/* Mobile Maintenance Cards (<640px) */}
            <div className="sm:hidden space-y-3">
              {records.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white">
                        {r.serviceType}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{formatDate(r.serviceDate)}</span>
                    </div>
                    <span className="font-bold text-rose-400 font-display text-sm">
                      {formatINR(r.cost)}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{r.bike?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{r.bike?.registrationNumber}</p>
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-300">{r.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-brand-card/80 border border-brand-border/60 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Odometer</p>
                      <p className="text-white font-mono text-[11px] mt-0.5">{formatKm(r.odometer)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Garage: {r.garage || 'Authorized'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Paid By</p>
                      <p className="text-brand-orange font-bold text-[11px] mt-0.5">{r.paidByPartner?.name || 'Partner'}</p>
                      {r.nextServiceOdo && (
                        <p className="text-[10px] text-amber-400 mt-1 font-semibold">Next: {formatKm(r.nextServiceOdo)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>=640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Motorcycle</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Odometer</th>
                    <th className="py-3 px-3">Garage / Workshop</th>
                    <th className="py-3 px-3">Work Summary</th>
                    <th className="py-3 px-3">Paid By (Partner)</th>
                    <th className="py-3 px-3">Next Due</th>
                    <th className="py-3 px-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-brand-surface/70">
                      <td className="py-3 px-3 font-mono text-slate-300">{formatDate(r.serviceDate)}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white">{r.bike?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.bike?.registrationNumber}</p>
                      </td>
                      <td className="py-3 px-3 uppercase font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {r.serviceType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-white">{formatKm(r.odometer)}</td>
                      <td className="py-3 px-3 text-slate-300">{r.garage || 'Authorized RE'}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{r.description || '-'}</td>
                      <td className="py-3 px-3 font-bold text-brand-orange">{r.paidByPartner?.name}</td>
                      <td className="py-3 px-3 text-amber-400 font-semibold">
                        {r.nextServiceOdo ? formatKm(r.nextServiceOdo) : '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-400 font-display text-sm text-right">
                        {formatINR(r.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
