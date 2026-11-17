import React, { useState, useEffect } from 'react';
import { Bike as BikeIcon, Plus, Search, Filter, ArrowRight, Gauge, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

export default function Bikes({ onNavigate, onTriggerAction, refreshKey }) {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBikes();
  }, [statusFilter, search, refreshKey]);

  const loadBikes = async () => {
    try {
      setLoading(true);
      const res = await api.getBikes({
        status: statusFilter,
        search
      });
      setBikes(res.bikes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Motorcycles Fleet</h1>
          <p className="text-xs text-slate-400">
            {bikes.length} bikes in garage • Track rates, revenue, expenses, and profit per bike
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_bike')}
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Bike
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bike by name, model, registration (e.g. DL 01 AB 1234)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-card border border-brand-border text-xs">
          {['all', 'available', 'rented', 'maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-all ${
                statusFilter === st
                  ? 'bg-brand-orange text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bike Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading bikes...
        </div>
      ) : bikes.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-brand-card border border-brand-border p-8">
          <BikeIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-white text-base">No bikes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search filter or add your first bike to the fleet.
          </p>
          <button
            onClick={() => onTriggerAction('add_bike')}
            className="mt-4 px-4 py-2 text-xs font-bold bg-brand-orange text-white rounded-xl"
          >
            + Add New Bike
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bikes.map((bike) => {
            const fin = bike.financials || {};
            return (
              <div
                key={bike._id}
                className="rounded-2xl bg-brand-card border border-brand-border overflow-hidden hover:border-brand-orange/50 transition-all shadow-card-dark group flex flex-col"
              >
                {/* Image & Status */}
                <div className="relative h-48 bg-brand-surface overflow-hidden">
                  <img
                    src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'}
                    alt={bike.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={bike.status} />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold font-display text-white text-lg leading-tight">
                        {bike.name}
                      </h3>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        {bike.registrationNumber} • {bike.variant || bike.model}
                      </p>
                    </div>
                    <div className="text-right bg-black/75 px-2.5 py-1 rounded-xl border border-brand-orange/30 backdrop-blur-sm">
                      <span className="font-display font-extrabold text-brand-orange text-sm block leading-tight">
                        {formatINR(bike.defaultDailyRate)}/day
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono block">
                        {formatINR(bike.defaultHourlyRate || Math.round(bike.defaultDailyRate / 8))}/hr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Metrics: Section 6 of Prompt */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/60">
                      <p className="text-[10px] text-slate-400 uppercase">Total Rentals</p>
                      <p className="font-bold text-white text-base mt-0.5">
                        {fin.totalRentals || 0} <span className="text-xs font-normal text-slate-400">trips ({fin.totalRentalDays || 0} days)</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/60">
                      <p className="text-[10px] text-slate-400 uppercase">Odometer</p>
                      <p className="font-bold text-white text-base mt-0.5">
                        {bike.currentOdometer?.toLocaleString('en-IN') || 0} <span className="text-xs font-normal text-slate-400">km</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial Overview Cards */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-brand-surface border border-brand-border text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Revenue</p>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">
                        {formatINR(fin.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Expenses</p>
                      <p className="font-bold text-rose-400 text-sm mt-0.5">
                        {formatINR(fin.totalExpenses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Net Profit</p>
                      <p className="font-bold text-brand-orange text-sm mt-0.5">
                        {formatINR(fin.netProfit)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onNavigate('bike-profile', bike._id)}
                      className="flex-1 py-2 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl shadow-glow-sm transition-all text-center"
                    >
                      View Bike Profile
                    </button>
                    {bike.status === 'available' && (
                      <button
                        onClick={() => onTriggerAction('new_rental_for_bike', bike._id)}
                        className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-brand-border"
                        title="Book Rental"
                      >
                        Rent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
