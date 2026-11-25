import React, { useState, useEffect } from 'react';
import { X, Fuel, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AddFuelModal({ isOpen, onClose, onSuccess, preselectedBikeId = null }) {
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [bikeId, setBikeId] = useState(preselectedBikeId || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [litres, setLitres] = useState('');
  const [amount, setAmount] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('100');
  const [odometer, setOdometer] = useState('');
  const [paidByPartnerId, setPaidByPartnerId] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      Promise.all([api.getBikes(), api.getPartners()]).then(([bRes, pRes]) => {
        setBikes(bRes.bikes || []);
        setPartners(pRes.partners || []);
        if (preselectedBikeId) {
          setBikeId(preselectedBikeId);
          const b = bRes.bikes?.find((x) => x._id === preselectedBikeId);
          if (b) setOdometer(b.currentOdometer || 0);
        } else if (bRes.bikes?.length > 0) {
          setBikeId(bRes.bikes[0]._id);
          setOdometer(bRes.bikes[0].currentOdometer || 0);
        }
        if (pRes.partners?.length > 0) {
          setPaidByPartnerId(pRes.partners[0].partnerId || pRes.partners[0]._id);
        }
      });
    }
  }, [isOpen, preselectedBikeId]);

  if (!isOpen) return null;

  const handleLitresOrAmountChange = (newLitres, newAmount) => {
    if (newLitres && newAmount) {
      setPricePerLitre((Number(newAmount) / Number(newLitres)).toFixed(1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!bikeId || !litres || !amount || !odometer || !paidByPartnerId) {
      setError('Bike, litres, amount, odometer, and paying partner are required.');
      return;
    }

    try {
      setLoading(true);
      await api.addFuelEntry({
        bikeId,
        date,
        litres: Number(litres),
        amount: Number(amount),
        pricePerLitre: Number(pricePerLitre),
        odometer: Number(odometer),
        paidByPartnerId,
        fuelStation: fuelStation.trim(),
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording fuel refill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-brand-card dark:bg-brand-card border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Mobile Pull/Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-brand-surface">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border bg-brand-surface shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-400" /> Log Fuel Refill
            </h3>
            <p className="text-xs text-slate-400">Track fuel consumption, mileage, and cost per km</p>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-28 sm:pb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Motorcycle *</label>
            <select
              value={bikeId}
              onChange={(e) => {
                setBikeId(e.target.value);
                const b = bikes.find((x) => x._id === e.target.value);
                if (b) setOdometer(b.currentOdometer || 0);
              }}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              required
            >
              {bikes.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Litres *</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={litres}
                onChange={(e) => {
                  setLitres(e.target.value);
                  handleLitresOrAmountChange(e.target.value, amount);
                }}
                placeholder="e.g. 5.5"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Cost (₹) *</label>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  handleLitresOrAmountChange(litres, e.target.value);
                }}
                placeholder="e.g. 550"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold border border-brand-border bg-brand-surface text-amber-400 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Odometer (km) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="8450"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Paid By Partner Buttons */}
          <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-2">
            <label className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
              Paid By (Which Partner paid out-of-pocket?) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {partners.map((p) => {
                const pId = p.partnerId || p._id;
                const isSelected = paidByPartnerId === pId;
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
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Fuel Station</label>
            <input
              type="text"
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
              placeholder="e.g. Indian Oil, Civil Lines"
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
              className="flex-1 sm:flex-none px-6 py-3 sm:py-2.5 min-h-[46px] text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-glow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Logging...' : 'Log Fuel Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
