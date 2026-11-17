import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  Receipt,
  CalendarDays,
  Plus,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';

export default function Settlements({ onTriggerAction, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rent'); // 'rent' | 'expense' | 'combined'
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getSettlements();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { balances = {}, history = [] } = data || {};
  const {
    partners = [],
    totalRevenueCollected = 0,
    totalExpensesPaid = 0,
    realizedProfit = 0,
    rentRecommendations = [],
    expenseRecommendations = [],
    recommendations = []
  } = balances;

  const filteredHistory = history.filter((s) => {
    if (historyFilter === 'all') return true;
    return s.settlementType === historyFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Partner Settlements Engine</h1>
          <p className="text-xs text-slate-400">
            Independent settlement accounting: Rent collections and business expenses are kept completely separate
          </p>
        </div>

        <button
          onClick={() =>
            onTriggerAction('record_settlement', {
              settlementType: activeTab === 'expense' ? 'expense' : 'rent'
            })
          }
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Record Settlement
        </button>
      </div>

      {/* Primary Category Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-brand-card border border-brand-border">
        <button
          onClick={() => setActiveTab('rent')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'rent'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Rent Revenue Settlement</span>
          {rentRecommendations.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
              {rentRecommendations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expense Reimbursement Settlement</span>
          {expenseRecommendations.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {expenseRecommendations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('combined')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'combined'
              ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Combined Financial Overview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RENT REVENUE SETTLEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'rent' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-emerald-400 text-sm">Rent Revenue Distribution Pool</p>
              <p className="text-slate-300">
                Total rent money collected from riders across all bikes: <strong className="text-white">{formatINR(totalRevenueCollected)}</strong>
              </p>
            </div>
            <div className="text-slate-400 text-[11px]">
              Tracks only cash & UPI rent collections vs each partner's profit share.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Rent Positions by Partner */}
            <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                Partner Rent Collections
              </h3>

              <div className="space-y-3">
                {partners.map((p) => {
                  const r = p.rent || {};
                  const isPositive = r.balance > 0.01;
                  const isNegative = r.balance < -0.01;
                  return (
                    <div
                      key={p.partnerId}
                      className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-brand-border"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{p.name}</p>
                            <p className="text-slate-400">{p.sharePercentage}% Share</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-base font-bold font-display ${
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-orange-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {isPositive
                              ? `+${formatINR(r.balance)}`
                              : isNegative
                              ? formatINR(r.balance)
                              : '₹0 (Settled)'}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">
                            {isPositive
                              ? 'Receivable (Rent Share)'
                              : isNegative
                              ? 'Payable (Owes Rent)'
                              : 'Balanced'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/40 text-[11px]">
                        <div>
                          <span className="text-slate-400">Rent Collected by {p.name}:</span>{' '}
                          <strong className="text-white">{formatINR(r.collected)}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400">Entitled Rent Share:</span>{' '}
                          <strong className="text-emerald-400">{formatINR(r.entitled)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rent Transfer Recommendations */}
            <div className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Rent Settlement Recommendations
                </h3>
                <p className="text-xs text-slate-400">
                  Transfers required between partners to balance rental income collections
                </p>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {rentRecommendations.length === 0 ? (
                  <div className="py-8 text-center p-4 rounded-xl bg-brand-surface border border-brand-border text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                    <p className="font-semibold text-white">All rent collections are fully balanced!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No pending rent transfers between partners.
                    </p>
                  </div>
                ) : (
                  rentRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-brand-surface border border-emerald-500/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500 text-black">
                          Rent Transfer #{idx + 1}
                        </span>
                        <span className="text-base font-bold font-display text-emerald-400">
                          {formatINR(rec.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm font-bold text-white">
                        <span>{rec.senderName}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{rec.receiverName}</span>
                      </div>

                      <button
                        onClick={() =>
                          onTriggerAction('record_settlement', {
                            ...rec,
                            settlementType: 'rent'
                          })
                        }
                        className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Settle Rent Share ({formatINR(rec.amount)})
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPENSE REIMBURSEMENT SETTLEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'expense' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-rose-400 text-sm">Business Expense Reimbursement Pool</p>
              <p className="text-slate-300">
                Total out-of-pocket money spent on fuel, service, and repairs: <strong className="text-white">{formatINR(totalExpensesPaid)}</strong>
              </p>
            </div>
            <div className="text-slate-400 text-[11px]">
              Calculates who paid for bikes out of pocket vs who owes reimbursement.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Expense Positions by Partner */}
            <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                Partner Out-of-Pocket Outlays
              </h3>

              <div className="space-y-3">
                {partners.map((p) => {
                  const e = p.expense || {};
                  const isPositive = e.balance > 0.01; // Overpaid -> Needs reimbursement
                  const isNegative = e.balance < -0.01; // Underpaid -> Owes reimbursement
                  return (
                    <div
                      key={p.partnerId}
                      className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-brand-border"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{p.name}</p>
                            <p className="text-slate-400">{p.sharePercentage}% Share</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-base font-bold font-display ${
                              isPositive
                                ? 'text-emerald-400'
                                : isNegative
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {isPositive
                              ? `+${formatINR(e.balance)}`
                              : isNegative
                              ? formatINR(e.balance)
                              : '₹0 (Settled)'}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">
                            {isPositive
                              ? 'Reimbursement Owed (To Receive)'
                              : isNegative
                              ? 'Reimbursement Due (To Pay)'
                              : 'Balanced'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/40 text-[11px]">
                        <div>
                          <span className="text-slate-400">Paid by {p.name}:</span>{' '}
                          <strong className="text-white">{formatINR(e.paid)}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400">Fair Expense Share:</span>{' '}
                          <strong className="text-rose-400">{formatINR(e.fairShare)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expense Transfer Recommendations */}
            <div className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  Expense Reimbursement Recommendations
                </h3>
                <p className="text-xs text-slate-400">
                  Reimbursements to pay partners who covered maintenance and petrol out-of-pocket
                </p>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-center">
                {expenseRecommendations.length === 0 ? (
                  <div className="py-8 text-center p-4 rounded-xl bg-brand-surface border border-brand-border text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                    <p className="font-semibold text-white">All business expenses are fully reimbursed!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No pending expense reimbursements between partners.
                    </p>
                  </div>
                ) : (
                  expenseRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-r from-rose-500/15 to-brand-surface border border-rose-500/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                          Expense Transfer #{idx + 1}
                        </span>
                        <span className="text-base font-bold font-display text-rose-400">
                          {formatINR(rec.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm font-bold text-white">
                        <span>{rec.senderName}</span>
                        <ArrowRight className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{rec.receiverName}</span>
                      </div>

                      <button
                        onClick={() =>
                          onTriggerAction('record_settlement', {
                            ...rec,
                            settlementType: 'expense'
                          })
                        }
                        className="w-full py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Pay Reimbursement ({formatINR(rec.amount)})
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMBINED OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'combined' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-brand-orange text-sm">Consolidated Net Profit & Cash Position</p>
              <p className="text-slate-300">
                Net Business Profit: <strong className="text-white">{formatINR(realizedProfit)}</strong> (Rent: {formatINR(totalRevenueCollected)} &minus; Expenses: {formatINR(totalExpensesPaid)})
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
            <h3 className="text-base font-bold font-display text-white">Consolidated Partner Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partners.map((p) => (
                <div
                  key={p.partnerId}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      <p className="text-slate-400">{p.sharePercentage}% Profit Entitlement</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-base font-bold font-display ${
                          p.balance > 0.01 ? 'text-emerald-400' : p.balance < -0.01 ? 'text-orange-400' : 'text-slate-300'
                        }`}
                      >
                        {p.balance > 0.01 ? `+${formatINR(p.balance)}` : formatINR(p.balance)}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        {p.balance > 0.01 ? 'Net Receivable' : p.balance < -0.01 ? 'Net Payable' : 'Settled'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/40 text-[11px]">
                    <div>
                      <span className="text-slate-400">Rent Collected:</span>{' '}
                      <strong className="text-emerald-400">{formatINR(p.rent?.collected || 0)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Expenses Paid:</span>{' '}
                      <strong className="text-rose-400">{formatINR(p.expense?.paid || 0)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settlement History Table with Category Filter */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold font-display text-white text-base">Completed Settlement History</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter:</span>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-brand-border bg-brand-surface text-xs text-white"
            >
              <option value="all">All Settlements</option>
              <option value="rent">🟢 Rent Revenue Settlements</option>
              <option value="expense">🔴 Expense Reimbursements</option>
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">No previous settlements found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Settlement #</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Paid By (Sender)</th>
                  <th className="py-3 px-3">Received By</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / Notes</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredHistory.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-surface/70">
                    <td className="py-3.5 px-3 font-mono font-bold text-white">#{s.settlementNumber}</td>
                    <td className="py-3.5 px-3">
                      {s.settlementType === 'expense' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Expense
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Rent
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{formatDate(s.settlementDate)}</td>
                    <td className="py-3.5 px-3 font-semibold text-rose-400">{s.senderPartner?.name}</td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-400">{s.receiverPartner?.name}</td>
                    <td className="py-3.5 px-3 uppercase text-slate-300">{s.paymentMethod}</td>
                    <td className="py-3.5 px-3 text-slate-400">{s.reference || s.notes || '-'}</td>
                    <td className="py-3.5 px-3 font-bold font-display text-brand-orange text-sm text-right">
                      {formatINR(s.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
