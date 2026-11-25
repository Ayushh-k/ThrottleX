import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Filter, Trash2, IndianRupee, ArrowDownRight } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';

export default function Expenses({ onTriggerAction, refreshKey }) {
  const [expenses, setExpenses] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bikeFilter, setBikeFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [categoryFilter, bikeFilter, partnerFilter, search, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, bikeRes, partRes] = await Promise.all([
        api.getExpenses({
          category: categoryFilter,
          bikeId: bikeFilter,
          partnerId: partnerFilter,
          search
        }),
        api.getBikes(),
        api.getPartners()
      ]);

      setExpenses(expRes.expenses || []);
      setBikes(bikeRes.bikes || []);
      setPartners(partRes.partners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense? All partner balances and financial totals will automatically recalculate.')) {
      return;
    }
    try {
      await api.deleteExpense(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Error deleting expense.');
    }
  };

  const totalFilteredExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Business Expenses</h1>
          <p className="text-xs text-slate-400">
            Track out-of-pocket costs, fuel, maintenance, and partner-wise financial outlays
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('add_expense')}
          className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Strip */}
      <div className="p-4 rounded-xl bg-brand-card border border-brand-border flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Total Filtered Outflow</p>
          <p className="text-xl font-bold font-display text-rose-400">{formatINR(totalFilteredExpense)}</p>
        </div>
        <span className="text-xs text-slate-400">{expenses.length} expense records</span>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-brand-orange absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- All Categories --</option>
          <option value="petrol">Petrol / Fuel</option>
          <option value="service">Routine Service</option>
          <option value="repair">Repair & Spares</option>
          <option value="engine_oil">Engine Oil</option>
          <option value="tyres">Tyres & Tubes</option>
          <option value="insurance">Insurance Renewal</option>
          <option value="cleaning">Washing & Detailing</option>
          <option value="accessories">Accessories</option>
          <option value="miscellaneous">Miscellaneous</option>
        </select>

        <select
          value={bikeFilter}
          onChange={(e) => setBikeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- All Motorcycles --</option>
          {bikes.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.registrationNumber})
            </option>
          ))}
        </select>

        <select
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- Paid by Any Partner --</option>
          {partners.map((p) => (
            <option key={p.partnerId || p._id} value={p.partnerId || p._id}>
              Paid by {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="font-bold text-white text-base">No expenses found</h3>
            <p className="text-xs text-slate-400 mt-1">Record business outlays to keep accounts accurate.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (<640px) */}
            <div className="sm:hidden space-y-3">
              {expenses.map((e) => (
                <div
                  key={e._id}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white">
                        {e.category}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{formatDate(e.expenseDate)}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(e._id)}
                      className="p-2 text-slate-400 hover:text-rose-400 active:scale-95 rounded-lg bg-white/5 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Delete expense"
                      aria-label="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-white text-sm flex-1">{e.description}</p>
                    <p className="font-bold font-display text-rose-400 text-base shrink-0">
                      -{formatINR(e.amount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-brand-card/80 border border-brand-border/60 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Motorcycle</p>
                      <p className="text-slate-200 mt-0.5 font-medium truncate">
                        {e.bike ? e.bike.name : 'General Business'}
                      </p>
                      {e.bike && (
                        <p className="text-[10px] text-slate-400 font-mono">{e.bike.registrationNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Paid By</p>
                      <p className="text-brand-orange font-bold mt-0.5 truncate">
                        {e.paidByPartner?.name || 'Partner'}
                      </p>
                      <p className="text-[10px] uppercase text-slate-400 font-mono">{e.paymentMethod}</p>
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
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Motorcycle</th>
                    <th className="py-3 px-3">Paid By (Partner)</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-brand-surface/70 transition-colors">
                      <td className="py-3 px-3 text-slate-300 font-mono">{formatDate(e.expenseDate)}</td>
                      <td className="py-3 px-3 uppercase font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">{e.description}</td>
                      <td className="py-3 px-3 text-slate-300">
                        {e.bike ? (
                          <span>
                            {e.bike.name} <span className="text-[10px] text-slate-500 font-mono block">{e.bike.registrationNumber}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">General Business</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-brand-orange">
                        {e.paidByPartner?.name || 'Partner'}
                      </td>
                      <td className="py-3 px-3 uppercase text-slate-400 text-[11px]">{e.paymentMethod}</td>
                      <td className="py-3 px-3 font-bold font-display text-rose-400 text-sm text-right">
                        -{formatINR(e.amount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(e._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
