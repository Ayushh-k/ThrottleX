import React, { useState, useEffect } from 'react';
import { X, Receipt, AlertCircle, IndianRupee, Coins } from 'lucide-react';
import { api } from '../../services/api';

export default function AddExpenseModal({ isOpen, onClose, onSuccess, preselectedBikeId = null }) {
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bikeId, setBikeId] = useState(preselectedBikeId || 'general');
  const [expenseSource, setExpenseSource] = useState('rent_income'); // 'rent_income' | 'general_fleet'
  const [category, setCategory] = useState('petrol');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidByPartnerId, setPaidByPartnerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [description, setDescription] = useState('');
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [bikesRes, partnersRes] = await Promise.all([api.getBikes(), api.getPartners()]);
      setBikes(bikesRes.bikes || []);
      setPartners(partnersRes.partners || []);
      
      const storedUser = localStorage.getItem('throttlex_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (currentUser?.partnerId) {
        setPaidByPartnerId(currentUser.partnerId);
      } else if (partnersRes.partners?.length > 0) {
        setPaidByPartnerId(partnersRes.partners[0].partnerId || partnersRes.partners[0]._id);
      }
      if (preselectedBikeId) {
        setBikeId(preselectedBikeId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than ₹0.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description.');
      return;
    }
    if (!paidByPartnerId) {
      setError('Please select which partner paid for this expense.');
      return;
    }

    try {
      setLoading(true);
      await api.createExpense({
        bikeId: bikeId === 'general' ? null : bikeId,
        category,
        amount: Number(amount),
        expenseDate,
        expenseSource,
        paidFromRent: expenseSource === 'rent_income',
        paidByPartnerId,
        paymentMethod,
        description: description.trim(),
        odometer: odometer ? Number(odometer) : undefined,
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop overflow-hidden">
      <div className="relative w-full max-w-lg bg-brand-card dark:bg-brand-card border-t sm:border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-mac-modal">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border bg-brand-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Add Business Expense
              </h3>
              <p className="text-[11px] text-slate-400">Record fuel, service & out-of-pocket costs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 active:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            aria-label="Close"
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
          <div className="p-4 sm:p-6 space-y-4 pb-28 sm:pb-6 flex-1">
            {/* Category & Motorcycle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Funding Source / Expense Nature */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Expense Type / Funding Source *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setExpenseSource('rent_income')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      expenseSource === 'rent_income'
                        ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold shadow-glow-sm'
                        : 'border-brand-border bg-brand-surface text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Coins className="w-3.5 h-3.5" /> Paid from Rent Income
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Deducted from trip rent cash</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseSource('general_fleet')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      expenseSource === 'general_fleet'
                        ? 'border-brand-orange bg-brand-orange/15 text-white font-bold shadow-glow-sm'
                        : 'border-brand-border bg-brand-surface text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-brand-orange">
                      <Receipt className="w-3.5 h-3.5" /> Fleet Capital Expense
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Paid from partner capital</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange transition-all"
                  required
                >
                  <option value="petrol">Petrol / Fuel</option>
                  <option value="service">Routine Service</option>
                  <option value="repair">Repair & Spares</option>
                  <option value="engine_oil">Engine Oil</option>
                  <option value="tyres">Tyres & Tubes</option>
                  <option value="insurance">Insurance Renewal</option>
                  <option value="cleaning">Washing & Detailing</option>
                  <option value="accessories">Accessories / Helmets</option>
                  <option value="parking">Parking / Toll</option>
                  <option value="challan">Traffic Challan / Fine</option>
                  <option value="transportation">Logistics / Transport</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Associated Motorcycle
                </label>
                <select
                  value={bikeId}
                  onChange={(e) => setBikeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange transition-all"
                >
                  <option value="general">-- General Business Expense --</option>
                  {bikes.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 700"
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-base font-bold border border-brand-border bg-brand-surface text-rose-400 placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange transition-all"
                  required
                />
              </div>
            </div>

            {/* Paid By Partner - Mobile Responsive Button Cards */}
            <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
              <label className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
                Paid By (Which Partner paid out-of-pocket?) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {partners.map((p) => {
                  const pId = p.partnerId || p._id;
                  const isSelected = paidByPartnerId === pId;
                  const storedUser = localStorage.getItem('throttlex_user');
                  const currentUser = storedUser ? JSON.parse(storedUser) : null;
                  const isCurrentPartner = currentUser?.partnerId === pId;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => setPaidByPartnerId(pId)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all min-h-[46px] flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-orange bg-brand-orange/20 text-white shadow-glow-sm ring-1 ring-brand-orange'
                          : 'border-brand-border bg-brand-card text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isCurrentPartner && (
                        <span className="text-[10px] text-emerald-400 font-mono ml-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          You
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method & Odometer */}
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
                  Odometer (Optional)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="Current km reading"
                  className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fuel refill"
                className="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-all"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Garage name, receipt bill # or remarks"
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
              className="flex-1 sm:flex-initial px-6 py-2.5 text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl shadow-glow-sm min-h-[46px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
