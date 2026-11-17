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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Record Rental Payment
            </h3>
            <p className="text-xs text-slate-400">
              Rental #{rental.rentalNumber} • {rental.customer?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Outstanding Balance:</span>
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-lg font-bold border border-brand-border bg-brand-surface text-emerald-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              >
                <option value="upi">UPI</option>
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Final balance settlement on bike return"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-glow-sm"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
