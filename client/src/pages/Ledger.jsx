import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { exportToCSV } from '../utils/csvExport';

export default function Ledger({ refreshKey }) {
  const [transactions, setTransactions] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [bikeFilter, setBikeFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [typeFilter, bikeFilter, partnerFilter, paymentMethodFilter, search, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, bikeRes, partRes] = await Promise.all([
        api.getTransactions({
          type: typeFilter,
          bikeId: bikeFilter,
          partnerId: partnerFilter,
          paymentMethod: paymentMethodFilter,
          search
        }),
        api.getBikes(),
        api.getPartners()
      ]);

      setTransactions(txRes.transactions || []);
      setBikes(bikeRes.bikes || []);
      setPartners(partRes.partners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = transactions.map((t) => ({
      Transaction_No: t.transactionNumber,
      Date: formatDate(t.date),
      Type: t.type.toUpperCase(),
      Description: t.description,
      Bike: t.bike ? `${t.bike.name} (${t.bike.registrationNumber})` : 'General',
      Paid_By: t.paidByPartner?.name || '',
      Received_By: t.receivedByPartner?.name || '',
      Payment_Method: t.paymentMethod ? t.paymentMethod.toUpperCase() : '',
      Amount: t.amount,
      Impact: t.balanceImpact
    }));

    exportToCSV(exportData, `THROTTLEX-Ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Financial Ledger & Money Flow</h1>
          <p className="text-xs text-slate-400">
            Immutable audit record of every rupee flowing in and out of the business
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Download className="w-4 h-4 text-brand-orange" /> Export Ledger CSV
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-brand-orange absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- All Types --</option>
          <option value="customer_payment">Customer Rental Payment</option>
          <option value="expense">Business Expense</option>
          <option value="partner_settlement">Partner Settlement</option>
        </select>

        <select
          value={bikeFilter}
          onChange={(e) => setBikeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- All Fleet Bikes --</option>
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
          <option value="all">-- All Partners --</option>
          {partners.map((p) => (
            <option key={p.partnerId || p._id} value={p.partnerId || p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={paymentMethodFilter}
          onChange={(e) => setPaymentMethodFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-border bg-brand-card text-xs text-white"
        >
          <option value="all">-- All Payment Modes --</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            No ledger transactions matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Txn #</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Motorcycle</th>
                  <th className="py-3 px-3">Paid By</th>
                  <th className="py-3 px-3">Received By</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-brand-surface/70 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300">{formatDate(t.date)}</td>
                    <td className="py-3 px-3 font-mono text-slate-400 font-semibold">{t.transactionNumber}</td>
                    <td className="py-3 px-3 uppercase font-semibold text-white">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                        {t.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">{t.description}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {t.bike ? (
                        <span>
                          {t.bike.name} <span className="text-[10px] text-slate-500 font-mono block">{t.bike.registrationNumber}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{t.paidByPartner?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-300">{t.receivedByPartner?.name || '-'}</td>
                    <td className="py-3 px-3 uppercase text-slate-400">{t.paymentMethod}</td>
                    <td className="py-3 px-3 font-bold font-display text-sm text-right">
                      <span
                        className={
                          t.balanceImpact === 'credit'
                            ? 'text-emerald-400'
                            : t.balanceImpact === 'debit'
                            ? 'text-rose-400'
                            : 'text-sky-400'
                        }
                      >
                        {t.balanceImpact === 'credit'
                          ? `+${formatINR(t.amount)}`
                          : t.balanceImpact === 'debit'
                          ? `-${formatINR(t.amount)}`
                          : formatINR(t.amount)}
                      </span>
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
