import React, { useState } from 'react';
import { X, Bike, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function AddBikeModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Royal Enfield');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [defaultDailyRate, setDefaultDailyRate] = useState(900);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(120);
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [fuelType, setFuelType] = useState('Petrol');
  const [color, setColor] = useState('Black');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('available');
  const [nextServiceOdo, setNextServiceOdo] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !registrationNumber.trim() || !defaultDailyRate) {
      setError('Bike name, registration number, and default daily rate are required.');
      return;
    }

    try {
      setLoading(true);
      await api.createBike({
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim() || name.trim(),
        variant: variant.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        chassisNumber: chassisNumber.trim(),
        engineNumber: engineNumber.trim(),
        purchasePrice: Number(purchasePrice) || 0,
        defaultDailyRate: Number(defaultDailyRate),
        defaultHourlyRate: Number(defaultHourlyRate) || Math.round(Number(defaultDailyRate) / 8) || 120,
        currentOdometer: Number(currentOdometer) || 0,
        fuelType,
        color,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
        status,
        nextServiceOdo: nextServiceOdo ? Number(nextServiceOdo) : undefined,
        insuranceExpiryDate: insuranceExpiryDate || undefined,
        notes
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating bike.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-brand-card dark:bg-brand-card border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Mobile Pull/Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-brand-surface">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border bg-brand-surface shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Bike className="w-5 h-5 text-brand-orange" /> Add New Motorcycle to Fleet
            </h3>
            <p className="text-xs text-slate-400">Expand the THROTTLEX garage with unlimited bikes</p>
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
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-28 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bike Name * (e.g. Royal Enfield Hunter 350)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!model) setModel(e.target.value);
                }}
                placeholder="Royal Enfield Hunter 350"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Registration Number * (e.g. DL 01 AB 1234)
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="DL 01 AB 1234"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface uppercase font-mono font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Variant / Color</label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="Dapper Ash / Stealth Black"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Default Daily Rate (₹) *
              </label>
              <input
                type="number"
                value={defaultDailyRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultDailyRate(e.target.value);
                  if (val > 0) setDefaultHourlyRate(Math.round(val / 8));
                }}
                className="w-full px-3 py-2 rounded-lg text-sm font-bold border border-brand-border bg-brand-surface text-brand-orange"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-purple-400 block mb-1">
                Default Hourly Rate (₹) *
              </label>
              <input
                type="number"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-bold border border-purple-500/30 bg-purple-500/10 text-purple-300"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Odometer (km)
              </label>
              <input
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g. 175000"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Next Service Odometer Threshold (km)
              </label>
              <input
                type="number"
                value={nextServiceOdo}
                onChange={(e) => setNextServiceOdo(e.target.value)}
                placeholder="e.g. 9000"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Insurance Expiry Date
              </label>
              <input
                type="date"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Bike Image URL (Unsplash or direct image link)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Equipment</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dual ABS, touring seats, pannier mounts"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
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
              {loading ? 'Adding...' : 'Add Motorcycle to Fleet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
