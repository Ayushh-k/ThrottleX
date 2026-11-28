import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AddMaintenanceModal({ isOpen, onClose, onSuccess, preselectedBikeId = null }) {
  const [bikes, setBikes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [bikeId, setBikeId] = useState(preselectedBikeId || '');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState('routine');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [paidByPartnerId, setPaidByPartnerId] = useState('');
  const [garage, setGarage] = useState('');
  const [description, setDescription] = useState('');
  const [nextServiceOdo, setNextServiceOdo] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
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
          if (b) {
            setOdometer(b.currentOdometer || 0);
            setNextServiceOdo(b.currentOdometer ? b.currentOdometer + 4000 : 8000);
          }
        } else if (bRes.bikes?.length > 0) {
          setBikeId(bRes.bikes[0]._id);
          setOdometer(bRes.bikes[0].currentOdometer || 0);
          setNextServiceOdo(bRes.bikes[0].currentOdometer ? bRes.bikes[0].currentOdometer + 4000 : 8000);
        }
        if (pRes.partners?.length > 0) {
          setPaidByPartnerId(pRes.partners[0].partnerId || pRes.partners[0]._id);
        }
      });
    }
  }, [isOpen, preselectedBikeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!bikeId || cost === '' || !paidByPartnerId) {
      setError('Bike, cost, and paying partner are required.');
      return;
    }

    try {
      setLoading(true);
      await api.addMaintenance({
        bikeId,
        serviceDate,
        serviceType,
        odometer: Number(odometer) || undefined,
        cost: Number(cost),
        paidByPartnerId,
        garage: garage.trim(),
        description: description.trim(),
        nextServiceOdo: nextServiceOdo ? Number(nextServiceOdo) : undefined,
        nextServiceDate: nextServiceDate || undefined,
        invoiceNumber: invoiceNumber.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording maintenance.');
    } finally {
      setLoading(false);
    }
  };

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
              <Wrench className="w-5 h-5 text-brand-orange" /> Log Service & Maintenance
            </h3>
            <p className="text-xs text-slate-400">Record garage visits, repairs, and service thresholds</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Motorcycle *</label>
              <select
                value={bikeId}
                onChange={(e) => {
                  setBikeId(e.target.value);
                  const b = bikes.find((x) => x._id === e.target.value);
                  if (b) {
                    setOdometer(b.currentOdometer || 0);
                    setNextServiceOdo(b.currentOdometer ? b.currentOdometer + 4000 : 8000);
                  }
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              >
                <option value="routine">Routine Periodic Service</option>
                <option value="oil_change">Engine Oil Change</option>
                <option value="repair">Mechanical Repair</option>
                <option value="tyre_replacement">Tyre Replacement</option>
                <option value="breakdown">Breakdown & Towing</option>
                <option value="other">Other Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cost (₹) *</label>
              <input
                type="number"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="1500"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold border border-brand-border bg-brand-surface text-rose-400 focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Odometer (km)</label>
              <input
                type="number"
                inputMode="numeric"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="8200"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Service Date</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
                required
              />
            </div>
          </div>

          {/* Paid By Partner - Responsive Touch Buttons */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Garage / Workshop Name
              </label>
              <input
                type="text"
                value={garage}
                onChange={(e) => setGarage(e.target.value)}
                placeholder="SpeedMoto RE Workshop"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice / Bill Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="SM-2026-981"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description of Work Done
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Oil filter replaced, chain lubricated"
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Next Service Odo (km)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={nextServiceOdo}
                onChange={(e) => setNextServiceOdo(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-brand-orange focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Next Service Date Target
              </label>
              <input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm border border-brand-border bg-brand-surface text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
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
              {loading ? 'Recording...' : 'Save Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
