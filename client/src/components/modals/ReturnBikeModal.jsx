import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Calendar,
  IndianRupee,
  ShieldAlert,
  Fuel,
  Wrench,
  Camera,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, formatDateTime, toLocalISOString } from '../../utils/formatters';

const CHECKLIST_ITEMS = [
  { key: 'headlight', label: 'Headlight (High/Low)' },
  { key: 'tailLight', label: 'Tail Light & Brake' },
  { key: 'leftIndicator', label: 'Left Indicator' },
  { key: 'rightIndicator', label: 'Right Indicator' },
  { key: 'leftMirror', label: 'Left Mirror' },
  { key: 'rightMirror', label: 'Right Mirror' },
  { key: 'horn', label: 'Horn' },
  { key: 'frontBrake', label: 'Front Brake' },
  { key: 'rearBrake', label: 'Rear Brake' },
  { key: 'clutch', label: 'Clutch Action' },
  { key: 'accelerator', label: 'Accelerator' },
  { key: 'speedometer', label: 'Speedometer/Odo' },
  { key: 'fuelTank', label: 'Fuel Tank Intact' },
  { key: 'seat', label: 'Seat & Lock' },
  { key: 'tyres', label: 'Tyre Tread & Air' },
  { key: 'wheelsAlloy', label: 'Wheels / Alloy' },
  { key: 'chain', label: 'Chain Drive' },
  { key: 'silencer', label: 'Silencer Exhaust' },
  { key: 'numberPlate', label: 'Number Plate' },
  { key: 'engineRunsProperly', label: 'Engine Smooth Start' },
  { key: 'keyReceived', label: 'Ignition Key' },
  { key: 'documentsReceived', label: 'RC & Insurance Copy' },
  { key: 'noUnrecordedDamage', label: 'No New Scratches/Dents' },
  { key: 'photosTaken', label: 'Return Photos Captured' }
];

export default function ReturnBikeModal({ isOpen, onClose, rental, onSuccess }) {
  if (!isOpen || !rental) return null;

  const [actualEndDate, setActualEndDate] = useState(toLocalISOString(new Date()));
  const [endOdometer, setEndOdometer] = useState(rental.bike?.currentOdometer || rental.startOdometer || 0);
  const [returnFuelLevel, setReturnFuelLevel] = useState('Full');
  const [extraLateCharge, setExtraLateCharge] = useState(0);
  const [lateReason, setLateReason] = useState('');
  const [damageChargeAmount, setDamageChargeAmount] = useState(0);
  const [damageRemarks, setDamageRemarks] = useState('');
  const [notes, setNotes] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 24 Checklist state (defaults to true)
  const [checklist, setChecklist] = useState(() => {
    const init = {};
    CHECKLIST_ITEMS.forEach((item) => {
      init[item.key] = true;
    });
    return init;
  });

  // Handover checklist for comparison
  const handoverChecklist = rental.handoverInspection?.checklist || {};

  // Auto-detect newly failed items
  const newDamagesDetected = [];
  CHECKLIST_ITEMS.forEach((item) => {
    const passedAtHandover = handoverChecklist[item.key] !== false;
    const passedAtReturn = checklist[item.key] !== false;
    if (passedAtHandover && !passedAtReturn) {
      newDamagesDetected.push(item.label);
    }
  });

  const hasNewDamage = newDamagesDetected.length > 0;

  // Check if return is late
  const expectedEnd = new Date(rental.expectedEndDate);
  const actualEnd = new Date(actualEndDate);
  const isLate = actualEnd > expectedEnd;
  const lateHours = isLate ? Math.max(1, Math.ceil((actualEnd - expectedEnd) / (1000 * 60 * 60))) : 0;

  const toggleChecklistItem = (key) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAllPassed = () => {
    const all = {};
    CHECKLIST_ITEMS.forEach((item) => {
      all[item.key] = true;
    });
    setChecklist(all);
    setDamageChargeAmount(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Number(endOdometer) < rental.startOdometer) {
      setError(`Return odometer cannot be less than start odometer (${rental.startOdometer} km).`);
      return;
    }

    try {
      setLoading(true);

      // 1. Record return inspection with damage detection
      const totalExtraFee = Number(extraLateCharge || 0) + Number(damageChargeAmount || 0);
      let combinedReason = '';
      if (lateReason && extraLateCharge > 0) combinedReason += lateReason;
      if (damageRemarks && damageChargeAmount > 0) {
        combinedReason += (combinedReason ? ' | ' : '') + `Damage fee: ₹${damageChargeAmount} (${damageRemarks})`;
      } else if (hasNewDamage && damageChargeAmount > 0) {
        combinedReason += (combinedReason ? ' | ' : '') + `Damage fee: ₹${damageChargeAmount} (${newDamagesDetected.join(', ')})`;
      }

      await api.recordReturnInspection(rental._id, {
        fuelLevel: returnFuelLevel,
        odometer: Number(endOdometer),
        checklist,
        damageRemarks: damageRemarks || (hasNewDamage ? `Damaged: ${newDamagesDetected.join(', ')}` : 'None'),
        damageChargeAmount: Number(damageChargeAmount || 0),
        applyToRentalCharges: false // We apply it directly in returnBike call below
      });

      // 2. Complete return & apply total extra charges
      await api.returnBike(rental._id, {
        actualEndDate: new Date(actualEndDate).toISOString(),
        endOdometer: Number(endOdometer),
        extraLateCharge: totalExtraFee,
        lateReason: combinedReason,
        notes: notes ? `${notes} | Return fuel: ${returnFuelLevel}` : `Return fuel: ${returnFuelLevel}`
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error processing return inspection.');
    } finally {
      setLoading(false);
    }
  };

  const totalAddedCharges = Number(extraLateCharge || 0) + Number(damageChargeAmount || 0);
  const currentOutstanding = (rental.remainingAmount || 0) + totalAddedCharges;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Return Inspection & Check-In
            </h3>
            <p className="text-xs text-slate-400">
              #{rental.rentalNumber} • {rental.bike?.name} ({rental.bike?.registrationNumber}) • Hirer: {rental.customer?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Summary Strip */}
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Plan</span>
              <strong className={rental.rentalType === 'hourly' ? 'text-purple-400' : 'text-brand-orange'}>
                {rental.rentalType === 'hourly' ? `Hourly (${rental.totalHours} hrs)` : `Daily (${rental.totalDays} days)`}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Handover Odo</span>
              <strong className="text-white font-mono">{rental.startOdometer} km</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Handover Fuel</span>
              <strong className="text-emerald-400">{rental.handoverInspection?.fuelLevel || 'Full'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Rental Due</span>
              <strong className="text-amber-400">{formatINR(rental.remainingAmount)}</strong>
            </div>
          </div>

          {/* Return Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Actual Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={actualEndDate}
                onChange={(e) => setActualEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Return Odometer (km) *
              </label>
              <input
                type="number"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface font-semibold text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Return Fuel Level
              </label>
              <select
                value={returnFuelLevel}
                onChange={(e) => setReturnFuelLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              >
                <option value="Full">Full Tank</option>
                <option value="Half">Half Tank</option>
                <option value="Reserve">Reserve / Low</option>
              </select>
            </div>
          </div>

          {/* Late Return Alert */}
          {isLate && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Return is past scheduled time by ~{lateHours} hour{lateHours > 1 ? 's' : ''}!</strong>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Optional: apply late fee or waive. Current fee: ₹{extraLateCharge}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const rate = rental.rentalType === 'hourly' ? (rental.hourlyRate || 120) : Math.round((rental.dailyRate || 900) / 8);
                    const suggested = lateHours * rate;
                    setExtraLateCharge(suggested);
                    setLateReason(`Late return by ${lateHours} hrs`);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition-all"
                >
                  Suggest Fee
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtraLateCharge(0);
                    setLateReason('');
                  }}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition-all"
                >
                  Waive (₹0)
                </button>
              </div>
            </div>
          )}

          {/* 24-Point Technical Inspection & Auto-Damage Comparison */}
          <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-orange" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  24-Point Return Technical Inspection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAllPassed}
                  className="text-[11px] text-emerald-400 hover:underline font-semibold"
                >
                  Mark All Passed ✓
                </button>
                <button
                  type="button"
                  onClick={() => setShowChecklist(!showChecklist)}
                  className="text-[11px] text-brand-orange hover:underline font-semibold"
                >
                  {showChecklist ? 'Hide Checklist ▲' : 'Show Checklist (24 Items) ▼'}
                </button>
              </div>
            </div>

            {/* Auto Damage Detected Banner */}
            {hasNewDamage ? (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1 animate-pulse">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <ShieldAlert className="w-4 h-4" /> ⚠️ New Damage Detected!
                </div>
                <p className="text-slate-200">
                  Deficiencies found that passed at handover: <strong>{newDamagesDetected.join(', ')}</strong>
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Assign damage penalty:</span>
                  <input
                    type="number"
                    value={damageChargeAmount}
                    onChange={(e) => setDamageChargeAmount(Number(e.target.value))}
                    placeholder="Damage ₹"
                    className="w-24 px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 font-bold text-xs"
                  />
                  <input
                    type="text"
                    value={damageRemarks}
                    onChange={(e) => setDamageRemarks(e.target.value)}
                    placeholder="Damage remarks / scratch location"
                    className="flex-1 px-2 py-1 rounded bg-black/40 border border-brand-border text-white text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All 24 condition checkpoints match pre-ride handover. No new damage detected.</span>
              </div>
            )}

            {/* Checklist Grid */}
            {showChecklist && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-brand-border/60">
                {CHECKLIST_ITEMS.map((item) => {
                  const isChecked = checklist[item.key] !== false;
                  const wasPassed = handoverChecklist[item.key] !== false;
                  const isDamaged = wasPassed && !isChecked;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleChecklistItem(item.key)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        isDamaged
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold'
                          : isChecked
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-slate-200'
                          : 'border-slate-600 bg-black/30 text-slate-500'
                      }`}
                    >
                      <span className="truncate mr-1">{item.label}</span>
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                        isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/30 text-rose-400'
                      }`}>
                        {isChecked ? '✓' : '✗'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charges & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Late Return Fee (₹)
              </label>
              <input
                type="number"
                value={extraLateCharge}
                onChange={(e) => setExtraLateCharge(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-amber-400 font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Damage / Repair Charge (₹)
              </label>
              <input
                type="number"
                value={damageChargeAmount}
                onChange={(e) => setDamageChargeAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-rose-400 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Return Notes / Comments</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Returned cleanly, keys received, customer satisfied"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
            />
          </div>

          {/* Balance Breakdown Strip */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-brand-border flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Final Balance to Collect</span>
              <span className="text-slate-400">
                (Rent Due: {formatINR(rental.remainingAmount)} {totalAddedCharges > 0 && `+ Extra: ${formatINR(totalAddedCharges)}`})
              </span>
            </div>
            <span className="text-lg font-bold text-amber-400 font-display">
              {formatINR(currentOutstanding)}
            </span>
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
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Processing Clearance...' : 'Complete Return & Make Available'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
