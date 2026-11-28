import React, { useState, useEffect } from 'react';
import { X, Scale, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export default function RecordSettlementModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledRecommendation = null
}) {
  const [partners, setPartners] = useState([]);
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [settlementType, setSettlementType] = useState('rent');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      api.getPartners().then((res) => {
        setPartners(res.partners || []);
        if (prefilledRecommendation) {
          setSenderId(prefilledRecommendation.senderPartnerId);
          setReceiverId(prefilledRecommendation.receiverPartnerId);
          setAmount(prefilledRecommendation.amount);
          if (prefilledRecommendation.settlementType) {
            setSettlementType(prefilledRecommendation.settlementType);
          }
        } else if (res.partners?.length >= 2) {
          setSenderId(res.partners[0].partnerId || res.partners[0]._id);
          setReceiverId(res.partners[1].partnerId || res.partners[1]._id);
        }
      });
    }
  }, [isOpen, prefilledRecommendation]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!senderId || !receiverId) {
      setError('Please select both sender and receiver partners.');
      return;
    }
    if (senderId === receiverId) {
      setError('Sender and receiver partners cannot be the same person.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Settlement amount must be greater than ₹0.');
      return;
    }

    try {
      setLoading(true);
      await api.recordSettlement({
        senderPartnerId: senderId,
        receiverPartnerId: receiverId,
        amount: Number(amount),
        settlementType,
        paymentMethod,
        reference: reference.trim(),
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error executing settlement.');
    } finally {
      setLoading(false);
    }
  };

  const senderObj = partners.find((p) => (p.partnerId || p._id) === senderId);
  const receiverObj = partners.find((p) => (p.partnerId || p._id) === receiverId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-modal-backdrop">
      <div className="relative w-full max-w-lg bg-brand-card dark:bg-brand-card border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-mac-modal">
        {/* Mobile Pull/Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-brand-surface">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border bg-brand-surface shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-orange" /> Mark Partner Settlement Complete
            </h3>
            <p className="text-xs text-slate-400">Rebalance cash distribution and reset outstanding debt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Live Settlement Banner */}
        {senderObj && receiverObj && amount && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="text-slate-300">{senderObj.name}</span>
              <ArrowRight className="w-4 h-4 text-brand-orange shrink-0" />
              <span className="text-slate-300">{receiverObj.name}</span>
            </div>
            <span className="text-sm font-bold font-display text-brand-orange">
              {formatINR(amount)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-28 sm:pb-6">
          {/* Settlement Category Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Settlement Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettlementType('rent')}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all min-h-[46px] flex items-center justify-center gap-1.5 ${
                  settlementType === 'rent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-brand-surface border-brand-border text-slate-400 hover:text-white'
                }`}
              >
                <span>🟢</span> Rent Income Split
              </button>
              <button
                type="button"
                onClick={() => setSettlementType('expense')}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all min-h-[46px] flex items-center justify-center gap-1.5 ${
                  settlementType === 'expense'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm ring-1 ring-rose-500'
                    : 'bg-brand-surface border-brand-border text-slate-400 hover:text-white'
                }`}
              >
                <span>🔴</span> Expense Reimbursement
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {settlementType === 'rent'
                ? 'Distribute rental revenue received from customers.'
                : 'Reimburse partner for out-of-pocket bike repairs, fuel, or maintenance.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paying Partner (Sender) *
              </label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
                required
              >
                {partners.map((p) => (
                  <option key={p.partnerId || p._id} value={p.partnerId || p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Receiving Partner *
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Settlement Amount (₹) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-lg font-bold border border-brand-border bg-brand-surface text-brand-orange focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="bank_transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="cash">Cash Settlement</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Payment Reference (UPI ID or Txn Ref)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI/SETTLE/98127394"
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Month-end profit settlement"
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Sticky Bottom Action Bar for Mobile & Desktop */}
          <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border flex items-center justify-end gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 min-h-[46px] text-sm font-semibold text-slate-300 hover:text-white rounded-xl bg-white/5 active:scale-95 transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 min-h-[46px] text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Recording...' : 'Mark as Settled'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
