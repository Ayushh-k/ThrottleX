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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-orange" /> Log Service & Maintenance
            </h3>
            <p className="text-xs text-slate-400">Record garage visits, repairs, and upcoming service thresholds</p>
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="1500"
                className="w-full px-3 py-2 rounded-lg text-sm font-bold border border-brand-border bg-brand-surface text-rose-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Odometer (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Paid By Partner *</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Garage / Workshop Name
              </label>
              <input
                type="text"
                value={garage}
                onChange={(e) => setGarage(e.target.value)}
                placeholder="e.g. SpeedMoto RE Authorized"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice / Bill Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="SM-2026-981"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
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
              placeholder="e.g. Oil filter replaced, brake calipers cleaned, chain lubricated"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Next Service Odometer (km)
              </label>
              <input
                type="number"
                value={nextServiceOdo}
                onChange={(e) => setNextServiceOdo(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-brand-orange"
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              />
            </div>
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
              className="px-6 py-2.5 text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow"
            >
              {loading ? 'Recording...' : 'Save Maintenance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
