import React, { useState, useEffect } from 'react';
import { Fuel as FuelIcon, Plus, IndianRupee, Gauge } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatKm } from '../utils/formatters';

export default function FuelPage({ onTriggerAction, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bikeFilter, setBikeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [bikeFilter, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, bRes] = await Promise.all([
        api.getFuelEntries({ bikeId: bikeFilter }),
        api.getBikes()
      ]);
      setEntries(fRes.entries || []);
      setBikes(bRes.bikes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalFuelCost = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalLitres = entries.reduce((sum, e) => sum + (e.litres || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Fuel Tracking</h1>
          <p className="text-xs text-slate-400">
            Monitor petrol consumption, average cost per litre, mileage, and cost per kilometre
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_fuel')}
          className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Fuel Refill
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Total Fuel Spend</span>
          <p className="text-2xl font-bold font-display text-amber-400 mt-1">
            {formatINR(totalFuelCost)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Total Volume Pumped</span>
          <p className="text-2xl font-bold font-display text-white mt-1">
            {totalLitres.toFixed(1)} Litres
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
          <span className="text-xs text-slate-400">Average Petrol Price</span>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-1">
            {totalLitres > 0 ? `₹${(totalFuelCost / totalLitres).toFixed(1)} / L` : '₹100 / L'}
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

      {/* Fuel Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading fuel records...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FuelIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No fuel refills logged.
          </div>
        ) : (
          <>
            {/* Mobile Fuel Cards (<640px) */}
            <div className="sm:hidden space-y-3">
              {entries.map((f) => (
                <div
                  key={f._id}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                        {f.litres} Litres
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{formatDate(f.date)}</span>
                    </div>
                    <span className="font-bold text-amber-400 font-display text-sm">
                      {formatINR(f.amount)}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{f.bike?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{f.bike?.registrationNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-brand-card/80 border border-brand-border/60 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Odo & Rate</p>
                      <p className="text-white font-mono text-[11px] mt-0.5">{formatKm(f.odometer)}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">₹{f.pricePerLitre}/L</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Paid By</p>
                      <p className="text-brand-orange font-bold text-[11px] mt-0.5">{f.paidByPartner?.name || 'Partner'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{f.fuelStation || 'Station'}</p>
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
                    <th className="py-3 px-3">Volume</th>
                    <th className="py-3 px-3">Price / Litre</th>
                    <th className="py-3 px-3">Odometer</th>
                    <th className="py-3 px-3">Paid By (Partner)</th>
                    <th className="py-3 px-3">Fuel Station</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {entries.map((f) => (
                    <tr key={f._id} className="hover:bg-brand-surface/70">
                      <td className="py-3 px-3 font-mono text-slate-300">{formatDate(f.date)}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white">{f.bike?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{f.bike?.registrationNumber}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">{f.litres} L</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">₹{f.pricePerLitre}/L</td>
                      <td className="py-3 px-3 font-mono text-white">{formatKm(f.odometer)}</td>
                      <td className="py-3 px-3 font-bold text-brand-orange">{f.paidByPartner?.name}</td>
                      <td className="py-3 px-3 text-slate-400">{f.fuelStation || '-'}</td>
                      <td className="py-3 px-3 font-bold text-amber-400 font-display text-sm text-right">
                        {formatINR(f.amount)}
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
