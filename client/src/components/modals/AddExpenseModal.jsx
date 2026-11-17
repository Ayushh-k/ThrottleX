import React, { useState, useEffect } from 'react';
import { X, Receipt, AlertCircle, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';

export default function AddExpenseModal({ isOpen, onClose, onSuccess, preselectedBikeId = null }) {
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bikeId, setBikeId] = useState(preselectedBikeId || 'general');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-400" /> Add Business Expense
            </h3>
            <p className="text-xs text-slate-400">Record out-of-pocket costs and fuel/service expenses</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 700"
                className="w-full px-3 py-2 rounded-lg text-base font-bold border border-brand-border bg-brand-surface text-rose-400"
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                required
              />
            </div>
          </div>

          {/* Paid By Partner - Crucial for settlement engine! */}
          <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-orange uppercase tracking-wider block">
                Paid By (Which Partner paid out-of-pocket?) *
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-brand-orange bg-brand-orange/15 text-white shadow-glow-sm'
                        : 'border-brand-border bg-brand-card text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.name} {isCurrentPartner && <span className="text-emerald-400 font-bold ml-1">(You)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="Current km reading"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fuel refill before trip / SpeedMoto general service"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Garage name, receipt bill # or remarks"
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
              className="px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-glow-sm"
            >
              {loading ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
