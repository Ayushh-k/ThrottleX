import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, ArrowRight, IndianRupee, Clock, ShieldCheck, Plus } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';

export default function Settlements({ onTriggerAction, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const { partners = [], recommendations = [], realizedProfit = 0 } = balances;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Partner Settlements Engine</h1>
          <p className="text-xs text-slate-400">
            Splitwise / PhonePe style simplified debt resolution between business partners
          </p>
        </div>

        <button
          onClick={() => onTriggerAction('record_settlement')}
          className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Record Settlement
        </button>
      </div>

      {/* Current Balances Card (Section 17 of Prompt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-4">
          <h3 className="text-base font-bold font-display text-white">Current Partner Positions</h3>
          <p className="text-xs text-slate-400">
            Realized Net Profit across all partner cash collections and expenses: <strong className="text-white">{formatINR(realizedProfit)}</strong>
          </p>

          <div className="space-y-3">
            {partners.map((p) => {
              const isPositive = p.balance > 0;
              const isNegative = p.balance < 0;
              return (
                <div
                  key={p.partnerId}
                  className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-brand-border"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      <p className="text-slate-400">
                        {p.sharePercentage}% Share • Cash held: {formatINR(p.netCashHeld)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold font-display ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-orange-400' : 'text-slate-300'
                      }`}
                    >
                      {isPositive ? `+${formatINR(p.balance)}` : formatINR(p.balance)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {isPositive ? 'Receivable' : isNegative ? 'Payable' : 'Settled'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Settlement Recommendations */}
        <div className="p-6 rounded-2xl bg-brand-card border border-brand-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold font-display text-white">Settlement Recommendations</h3>
            <p className="text-xs text-slate-400">
              Clear transfers recommended by the algorithm to achieve zero outstanding debt
            </p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {recommendations.length === 0 ? (
              <div className="py-8 text-center p-4 rounded-xl bg-brand-surface border border-brand-border text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-white">All partner accounts are fully settled!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No pending debts or transfers are required at this time.
                </p>
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-r from-brand-orange/15 to-brand-surface border border-brand-orange/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-orange text-white">
                      Recommended Transfer #{idx + 1}
                    </span>
                    <span className="text-base font-bold font-display text-brand-orange">
                      {formatINR(rec.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-bold text-white">
                    <span>{rec.senderName}</span>
                    <ArrowRight className="w-4 h-4 text-brand-orange shrink-0" />
                    <span>{rec.receiverName}</span>
                  </div>

                  <button
                    onClick={() => onTriggerAction('record_settlement', rec)}
                    className="w-full py-2.5 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Settled ({formatINR(rec.amount)})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border space-y-4">
        <h3 className="font-bold font-display text-white text-base">Completed Settlement History</h3>

        {history.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">No previous settlements recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Settlement #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Paid By (Sender)</th>
                  <th className="py-3 px-3">Received By</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / Notes</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {history.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-surface/70">
                    <td className="py-3.5 px-3 font-mono font-bold text-white">#{s.settlementNumber}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{formatDate(s.settlementDate)}</td>
                    <td className="py-3.5 px-3 font-semibold text-rose-400">{s.senderPartner?.name}</td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-400">{s.receiverPartner?.name}</td>
                    <td className="py-3.5 px-3 uppercase text-slate-300">{s.paymentMethod}</td>
                    <td className="py-3.5 px-3 text-slate-400">{s.reference || s.notes || '-'}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    </td>
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
