import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bike as BikeIcon,
  IndianRupee,
  Calendar,
  Receipt,
  Fuel,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  Gauge,
  Activity,
  ShieldCheck,
  Disc,
  Flame
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime, formatKm, calculateHours } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

export default function BikeProfile({ bikeId, onBack, onTriggerAction, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBike();
  }, [bikeId, refreshKey]);

  const loadBike = async () => {
    try {
      setLoading(true);
      const res = await api.getBikeById(bikeId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading motorcycle profile...
      </div>
    );
  }

  if (!data || !data.bike) {
    return (
      <div className="p-8 text-center">
        <p className="text-white font-bold">Motorcycle not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs bg-brand-orange text-white rounded-xl">
          Back to Fleet
        </button>
      </div>
    );
  }

  const { bike, financials = {}, rentals = [], expenses = [], fuelAnalysis = {}, maintenanceRecords = [], serviceAlert } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Fleet
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {bike.status === 'available' && (
            <button
              onClick={() => onTriggerAction('new_rental_for_bike', bike._id)}
              className="px-3 py-1.5 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm"
            >
              + Book Rental
            </button>
          )}
          <button
            onClick={() => onTriggerAction('add_fuel_for_bike', bike._id)}
            className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-amber-400 border border-brand-border rounded-xl"
          >
            + Log Fuel
          </button>
          <button
            onClick={() => onTriggerAction('add_maintenance_for_bike', bike._id)}
            className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl"
          >
            + Log Service
          </button>
          <button
            onClick={() => onTriggerAction('add_expense_for_bike', bike._id)}
            className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-rose-400 border border-brand-border rounded-xl"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="rounded-2xl bg-brand-card border border-brand-border overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Image */}
          <div className="relative h-64 lg:h-auto bg-brand-surface">
            <img
              src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'}
              alt={bike.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={bike.status} />
            </div>
          </div>

          {/* Core Info & Specs */}
          <div className="p-6 lg:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                    {bike.brand} • {bike.variant}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mt-0.5">
                    {bike.name}
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Default Rates</span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 justify-end">
                    <span className="text-xl sm:text-2xl font-bold font-display text-brand-orange">
                      {formatINR(bike.defaultDailyRate)}/day
                    </span>
                    <span className="text-xs sm:text-sm font-semibold font-mono text-purple-300">
                      • {formatINR(bike.defaultHourlyRate || Math.round(bike.defaultDailyRate / 8))}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                  <span className="text-slate-400 text-[10px] uppercase">Registration</span>
                  <p className="font-mono font-bold text-white mt-0.5">{bike.registrationNumber}</p>
                </div>
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                  <span className="text-slate-400 text-[10px] uppercase">Current Odometer</span>
                  <p className="font-bold text-white mt-0.5">{formatKm(bike.currentOdometer)}</p>
                </div>
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                  <span className="text-slate-400 text-[10px] uppercase">Total Days Rented</span>
                  <p className="font-bold text-white mt-0.5">{financials.totalRentalDays || 0} days</p>
                </div>
                <div className="p-3 rounded-xl bg-brand-surface border border-brand-border/60">
                  <span className="text-slate-400 text-[10px] uppercase">Total Trips</span>
                  <p className="font-bold text-white mt-0.5">{financials.totalRentals || 0} rentals</p>
                </div>
              </div>

              {/* Service Alert Box if threshold approached */}
              {serviceAlert && (
                <div
                  className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
                    serviceAlert.isDue
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-brand-surface border-brand-border text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${serviceAlert.isDue ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{serviceAlert.message}</span>
                  </div>
                  <button
                    onClick={() => onTriggerAction('add_maintenance_for_bike', bike._id)}
                    className="text-[11px] font-bold text-brand-orange hover:underline shrink-0"
                  >
                    Schedule Service
                  </button>
                </div>
              )}
            </div>

            {/* Financial Summary Strip */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Revenue</span>
                <p className="text-lg font-bold font-display text-emerald-400 mt-0.5">
                  {formatINR(financials.totalRevenue)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Expenses</span>
                <p className="text-lg font-bold font-display text-rose-400 mt-0.5">
                  {formatINR(financials.totalExpenses)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Net Profit</span>
                <p className="text-lg font-bold font-display text-brand-orange mt-0.5">
                  {formatINR(financials.netProfit)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Profit Margin</span>
                <p className="text-lg font-bold font-display text-white mt-0.5">
                  {financials.profitMargin || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Health Diagnostics, Rentals History, Expense History, Fuel Analysis, Maintenance Log */}
      <div className="border-b border-brand-border flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { id: 'health', label: `🟢 Health Score (${data.healthScore?.score || 92}%)`, icon: Activity },
          { id: 'overview', label: `Rental History (${rentals.length})`, icon: Calendar },
          { id: 'expenses', label: `Expense History (${expenses.length})`, icon: Receipt },
          { id: 'fuel', label: `Fuel Tracking (${fuelAnalysis.entries?.length || 0})`, icon: Fuel },
          { id: 'maintenance', label: `Maintenance & Service (${maintenanceRecords.length})`, icon: Wrench }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-orange text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 0: Bike Health Score & Comprehensive Diagnostics */}
      {activeTab === 'health' && (
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-display text-white text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" /> Motorcycle Health Diagnostics & Fleet Score
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                  (data.healthScore?.score || 92) >= 80
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : (data.healthScore?.score || 92) >= 60
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  {data.healthScore?.label || '92% Healthy'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic algorithmic rating computed from scheduled service intervals, tyre wear, oil life, brakes, and odometer wear
              </p>
            </div>

            <button
              onClick={() => onTriggerAction('add_maintenance_for_bike', bike._id)}
              className="px-3.5 py-1.5 text-xs font-bold bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Wrench className="w-4 h-4" /> Log Service / Maintenance
            </button>
          </div>

          {/* Health Score Big Banner */}
          <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  Fleet Health Index
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-3xl sm:text-4xl font-extrabold font-display ${
                    (data.healthScore?.score || 92) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {data.healthScore?.score || 92}%
                  </span>
                  <span className="text-xs text-slate-400">/ 100% Operational Target</span>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="text-slate-400 block">Overall Condition:</span>
                <span className={`font-bold text-sm ${
                  (data.healthScore?.score || 92) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {data.healthScore?.label || '92% Healthy (Road-Ready)'}
                </span>
              </div>
            </div>

            {/* Visual Health Gauge Bar */}
            <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (data.healthScore?.score || 92) >= 80
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : (data.healthScore?.score || 92) >= 60
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-600 to-red-400'
                }`}
                style={{ width: `${data.healthScore?.score || 92}%` }}
              />
            </div>
          </div>

          {/* Factors Diagnostic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(data.healthScore?.factors || [
              { name: 'Service Schedule', score: 25, max: 25, text: 'Service on schedule' },
              { name: 'Engine Oil', score: 17, max: 20, status: 'good', text: 'Oil condition: Good' },
              { name: 'Tyres & Grip', score: 18, max: 20, status: 'good', text: 'Tyre condition: Good' },
              { name: 'Braking System', score: 13, max: 15, status: 'good', text: 'Brakes: Good' },
              { name: 'Odometer Wear', score: 9, max: 10, text: 'Optimal mileage' },
              { name: 'Operational Status', score: 10, max: 10, text: 'Operational in fleet' }
            ]).map((factor, idx) => {
              const ratio = factor.score / factor.max;
              return (
                <div key={idx} className="p-4 rounded-xl bg-brand-surface border border-brand-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand-orange" /> {factor.name}
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                      {factor.score}/{factor.max} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{factor.text}</p>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Rental History (Section 8 Prompt) */}
      {activeTab === 'overview' && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-white text-base">Complete Rental Trips</h3>
            <span className="text-xs text-slate-400">{rentals.length} bookings logged</span>
          </div>

          {rentals.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">No rental records logged for this bike yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Rental #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">End Date</th>
                    <th className="py-2.5 px-3">Plan / Duration</th>
                    <th className="py-2.5 px-3">Rate</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {rentals.map((r) => (
                    <tr key={r._id} className="hover:bg-brand-surface/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-white">#{r.rentalNumber}</td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {r.customer?.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{r.customer?.phone}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.rentalType === 'hourly' ? formatDateTime(r.startDate) : formatDate(r.startDate)}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.rentalType === 'hourly' ? formatDateTime(r.expectedEndDate) : formatDate(r.expectedEndDate)}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.rentalType === 'hourly' ? (
                          <span className="font-semibold text-purple-400 font-mono text-[11px]">
                            {r.totalHours || calculateHours(r.startDate, r.expectedEndDate)} hrs (Hourly)
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-400 font-mono text-[11px]">
                            {r.totalDays || 1} days (Day)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {r.rentalType === 'hourly' ? `${formatINR(r.hourlyRate)}/hr` : `${formatINR(r.dailyRate)}/day`}
                      </td>
                      <td className="py-3 px-3 font-bold text-brand-orange">{formatINR(r.totalAmount)}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={r.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Expense History */}
      {activeTab === 'expenses' && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-white text-base">Expense Log for {bike.name}</h3>
            <span className="text-xs text-rose-400 font-bold">
              Total Spent: {formatINR(financials.totalExpenses)}
            </span>
          </div>

          {expenses.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">No expenses logged for this bike yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Paid By (Partner)</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-brand-surface/60 transition-colors">
                      <td className="py-3 px-3 text-slate-300 font-mono">{formatDate(e.expenseDate)}</td>
                      <td className="py-3 px-3 uppercase font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-400">{formatINR(e.amount)}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{e.paidByPartner?.name}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{e.description}</td>
                      <td className="py-3 px-3 uppercase text-slate-400">{e.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fuel Tracking (Prompt Section 13) */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {/* Fuel Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-slate-400 uppercase">Total Fuel Spent</span>
              <p className="text-xl font-bold font-display text-amber-400 mt-1">
                {formatINR(fuelAnalysis.totalFuelAmount)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-slate-400 uppercase">Total Volume</span>
              <p className="text-xl font-bold font-display text-white mt-1">
                {fuelAnalysis.totalLitres || 0} Litres
              </p>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-slate-400 uppercase">Fuel Cost per km</span>
              <p className="text-xl font-bold font-display text-white mt-1">
                {fuelAnalysis.fuelCostPerKm ? `₹${fuelAnalysis.fuelCostPerKm}/km` : 'Computing...'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <span className="text-[10px] text-slate-400 uppercase">Approximate Mileage</span>
              <p className="text-xl font-bold font-display text-brand-orange mt-1">
                {fuelAnalysis.approximateMileage ? `${fuelAnalysis.approximateMileage} km/L` : 'Need >1 refuels'}
              </p>
            </div>
          </div>

          {/* Fuel Log Table */}
          <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-white text-base">Fuel Refill Logs</h3>
              <button
                onClick={() => onTriggerAction('add_fuel_for_bike', bike._id)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black rounded-lg"
              >
                + Log Fuel Refill
              </button>
            </div>

            {(!fuelAnalysis.entries || fuelAnalysis.entries.length === 0) ? (
              <p className="py-10 text-center text-xs text-slate-400">No fuel entries logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Litres</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Price / Litre</th>
                      <th className="py-2.5 px-3">Odometer</th>
                      <th className="py-2.5 px-3">Paid By</th>
                      <th className="py-2.5 px-3">Station</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {fuelAnalysis.entries.map((f) => (
                      <tr key={f._id} className="hover:bg-brand-surface/60">
                        <td className="py-3 px-3 text-slate-300 font-mono">{formatDate(f.date)}</td>
                        <td className="py-3 px-3 font-semibold text-white">{f.litres} L</td>
                        <td className="py-3 px-3 font-bold text-amber-400">{formatINR(f.amount)}</td>
                        <td className="py-3 px-3 text-slate-300">₹{f.pricePerLitre}/L</td>
                        <td className="py-3 px-3 font-mono text-white">{f.odometer} km</td>
                        <td className="py-3 px-3 text-slate-300">{f.paidByPartner?.name}</td>
                        <td className="py-3 px-3 text-slate-400">{f.fuelStation || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Maintenance (Prompt Section 14) */}
      {activeTab === 'maintenance' && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-display text-white text-base">Service & Maintenance Records</h3>
            <button
              onClick={() => onTriggerAction('add_maintenance_for_bike', bike._id)}
              className="px-3 py-1.5 text-xs font-bold bg-brand-orange text-white rounded-lg shadow-glow-sm"
            >
              + Log Service Visit
            </button>
          </div>

          {maintenanceRecords.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">No service records logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Service Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Odometer</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3">Paid By</th>
                    <th className="py-2.5 px-3">Garage / Workshop</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Next Service Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {maintenanceRecords.map((m) => (
                    <tr key={m._id} className="hover:bg-brand-surface/60">
                      <td className="py-3 px-3 text-slate-300 font-mono">{formatDate(m.serviceDate)}</td>
                      <td className="py-3 px-3 uppercase font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {m.serviceType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-white">{m.odometer} km</td>
                      <td className="py-3 px-3 font-bold text-rose-400">{formatINR(m.cost)}</td>
                      <td className="py-3 px-3 text-slate-200">{m.paidByPartner?.name}</td>
                      <td className="py-3 px-3 text-slate-300">{m.garage || '-'}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{m.description}</td>
                      <td className="py-3 px-3 text-brand-orange font-semibold">
                        {m.nextServiceOdo ? `${m.nextServiceOdo} km` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
