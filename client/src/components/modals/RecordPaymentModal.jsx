import React, { useState, useEffect } from 'react';
import { X, CreditCard, IndianRupee, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export default function RecordPaymentModal({ isOpen, onClose, rental, onSuccess }) {
  const [partners, setPartners] = useState([]);
  const [amount, setAmount] = useState(rental?.remainingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [receivedByPartnerId, setReceivedByPartnerId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rental) {
      setAmount(rental.remainingAmount || 0);
    }
  }, [rental]);

  useEffect(() => {
    if (isOpen) {
      api.getPartners().then((res) => {
        setPartners(res.partners || []);
        if (res.partners?.length > 0) {
          setReceivedByPartnerId(res.partners[0].partnerId || res.partners[0]._id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen || !rental) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payVal = Number(amount);
    if (!payVal || payVal <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }
    if (payVal > rental.remainingAmount) {
      setError(`Payment cannot exceed outstanding balance (${formatINR(rental.remainingAmount)}).`);
      return;
    }

    try {
      setLoading(true);
      await api.recordRentalPayment(rental._id, {
        amount: payVal,
        paymentMethod,
        receivedByPartnerId,
        transactionReference: reference,
        notes
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-md bg-brand-card dark:bg-brand-card border-t sm:border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        {/* Mobile Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border bg-brand-surface shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Record Rental Payment
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Rental #{rental.rentalNumber} • {rental.customer?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-6 space-y-4 pb-28 sm:pb-6 flex-1 overscroll-contain">
            <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Outstanding:</span>
              <span className="text-base font-bold text-amber-400 font-display">
                {formatINR(rental.remainingAmount)}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-lg font-bold border border-brand-border bg-brand-surface text-emerald-400 focus:outline-none focus:border-brand-orange transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange transition-all"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Received By (Partner) *
                </label>
                <select
                  value={receivedByPartnerId}
                  onChange={(e) => setReceivedByPartnerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange transition-all"
                  required
                >
                  {partners.map((p) => (
                    <option key={p.partnerId || p._id} value={p.partnerId || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Transaction Reference / UPI Ref No.
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UPI/6192837491"
                className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Balance settlement on return"
                className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-all"
              />
            </div>
          </div>

          {/* Sticky Mobile & Desktop Action Bar */}
          <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border flex items-center justify-end gap-2.5 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 min-h-[46px] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 sm:flex-initial flex-1 px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl shadow-glow-sm min-h-[46px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
