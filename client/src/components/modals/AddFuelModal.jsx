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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-400" /> Log Fuel Refill
            </h3>
            <p className="text-xs text-slate-400">Track fuel consumption, mileage, and cost per km</p>
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
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Motorcycle *</label>
            <select
              value={bikeId}
              onChange={(e) => {
                setBikeId(e.target.value);
                const b = bikes.find((x) => x._id === e.target.value);
                if (b) setOdometer(b.currentOdometer || 0);
              }}
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              required
            >
              {bikes.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Litres *</label>
              <input
                type="number"
                step="0.1"
                value={litres}
                onChange={(e) => {
                  setLitres(e.target.value);
                  handleLitresOrAmountChange(e.target.value, amount);
                }}
                placeholder="e.g. 5.5"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Cost (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  handleLitresOrAmountChange(litres, e.target.value);
                }}
                placeholder="e.g. 550"
                className="w-full px-3 py-2 rounded-lg text-sm font-bold border border-brand-border bg-brand-surface text-amber-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Odometer (km) *
              </label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="8450"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paid By Partner *
              </label>
              <select
                value={paidByPartnerId}
                onChange={(e) => setPaidByPartnerId(e.target.value)}
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Fuel Station</label>
            <input
              type="text"
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
              placeholder="e.g. Indian Oil, South Ext."
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
              className="px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-glow-sm"
            >
              {loading ? 'Logging...' : 'Log Fuel Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
