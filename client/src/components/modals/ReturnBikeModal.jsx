import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Gauge, Calendar, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, formatDateTime, toLocalISOString } from '../../utils/formatters';

export default function ReturnBikeModal({ isOpen, onClose, rental, onSuccess }) {
  if (!isOpen || !rental) return null;

  const [actualEndDate, setActualEndDate] = useState(toLocalISOString(new Date()));
  const [endOdometer, setEndOdometer] = useState(rental.bike?.currentOdometer || rental.startOdometer || 0);
  const [extraLateCharge, setExtraLateCharge] = useState(0);
  const [lateReason, setLateReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if late
  const expectedEnd = new Date(rental.expectedEndDate);
  const actualEnd = new Date(actualEndDate);
  const isLate = actualEnd > expectedEnd;
  const lateHours = isLate ? Math.max(1, Math.ceil((actualEnd - expectedEnd) / (1000 * 60 * 60))) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Number(endOdometer) < rental.startOdometer) {
      setError(`Return odometer cannot be less than start odometer (${rental.startOdometer} km).`);
      return;
    }

    try {
      setLoading(true);
      await api.returnBike(rental._id, {
        actualEndDate: new Date(actualEndDate).toISOString(),
        endOdometer: Number(endOdometer),
        extraLateCharge: Number(extraLateCharge),
        lateReason,
        notes
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error processing return.');
    } finally {
      setLoading(false);
    }
  };

  const currentOutstanding = (rental.remainingAmount || 0) + Number(extraLateCharge || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Return Bike: #{rental.rentalNumber}
            </h3>
            <p className="text-xs text-slate-400">
              {rental.bike?.name} • Rented to {rental.customer?.name}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Rental Plan:</span>
              <span className={`font-semibold ${rental.rentalType === 'hourly' ? 'text-purple-400' : 'text-brand-orange'}`}>
                {rental.rentalType === 'hourly'
                  ? `⏱️ Hourly (${rental.totalHours} hrs @ ${formatINR(rental.hourlyRate)}/hr)`
                  : `📅 Day-Wise (${rental.totalDays} days @ ${formatINR(rental.dailyRate)}/day)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Scheduled Return:</span>
              <span className="font-semibold text-white">{formatDateTime(rental.expectedEndDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Start Odometer:</span>
              <span className="font-semibold text-white">{rental.startOdometer} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Outstanding:</span>
              <span className="font-semibold text-amber-400">{formatINR(rental.remainingAmount)}</span>
            </div>
          </div>

          {isLate && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Return is late by ~{lateHours} hour{lateHours > 1 ? 's' : ''}!</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  You can specify an additional late fee below or let the system apply standard rates.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Actual Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={actualEndDate}
                onChange={(e) => setActualEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ending Odometer (km) *
              </label>
              <input
                type="number"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface font-semibold text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Extra Charges / Late Fee (₹)
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
                Reason for Extra Charge
              </label>
              <input
                type="text"
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
                placeholder="e.g. 3 hours late / minor helmet scratch"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Bike Condition</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Returned in clean condition, full fuel"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          {/* Final Total Notice */}
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Customer Balance to Collect:</span>
            <span className="text-base font-bold text-amber-400 font-display">
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
              className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-glow-sm"
            >
              {loading ? 'Processing...' : 'Complete Return & Make Available'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
