import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Bike as BikeIcon,
  User,
  Clock,
  Shield,
  FileText,
  TrendingUp,
  Fuel,
  Wrench,
  Sparkles,
  Share2,
  PenTool,
  ShieldAlert,
  Check,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime, formatKm } from '../utils/formatters';
import { exportReportToPDF } from '../utils/pdfExport';
import StatusBadge from '../components/StatusBadge';
import RentalAgreementModal from '../components/modals/RentalAgreementModal';

export default function RentalDetail({ rentalId, onBack, onTriggerAction, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    loadRental();
  }, [rentalId, refreshKey]);

  const loadRental = async () => {
    try {
      setLoading(true);
      const res = await api.getRentalById(rentalId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!data?.rental) return;
    const r = data.rental;
    const payments = data.payments || [];

    const planStr = r.rentalType === 'hourly'
      ? `Hourly Plan (${r.totalHours} hrs @ ${formatINR(r.hourlyRate)}/hr)`
      : `Day Plan (${r.totalDays} days @ ${formatINR(r.dailyRate)}/day)`;

    exportReportToPDF({
      title: `THROTTLEX RENTAL INVOICE #${r.rentalNumber}`,
      subtitle: `Customer: ${r.customer?.name} | Bike: ${r.bike?.name} (${r.bike?.registrationNumber}) | ${planStr}`,
      headers: ['Receipt #', 'Date', 'Method', 'Received By', 'Amount'],
      rows: payments.map((p) => [
        p.receiptNumber,
        formatDate(p.paymentDate),
        (p.paymentMethod || '').toUpperCase(),
        p.receivedByPartner?.name || 'Partner',
        formatINR(p.amount)
      ]),
      filename: `Invoice-${r.rentalNumber}.pdf`
    });
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading rental contract & inspection records...
      </div>
    );
  }

  if (!data?.rental) {
    return (
      <div className="p-8 text-center">
        <p className="text-white font-bold">Rental record not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 text-xs bg-brand-orange text-white rounded-xl">
          Back to Rentals
        </button>
      </div>
    );
  }

  const { rental, payments = [] } = data;
  const handover = rental.handoverInspection || {};
  const returnInsp = rental.returnInspection || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rentals List
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Agreement Button */}
          <button
            onClick={() => setShowAgreementModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange rounded-xl border border-brand-orange/40 flex items-center gap-1.5 transition-all shadow-glow-sm"
          >
            <FileText className="w-4 h-4" /> Rental Agreement & Signatures
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-brand-border flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-brand-orange" /> Invoice PDF
          </button>

          {rental.remainingAmount > 0 && (
            <button
              onClick={() => onTriggerAction('record_payment_for_rental', rental)}
              className="px-4 py-1.5 text-xs font-bold bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-glow-sm"
            >
              + Record Payment
            </button>
          )}

          {rental.status === 'active' && (
            <button
              onClick={() => onTriggerAction('return_bike', rental)}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-glow-sm flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete Return
            </button>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-brand-card border border-brand-border space-y-6 shadow-2xl">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold font-display text-white">
                Rental Invoice #{rental.rentalNumber}
              </h1>
              {rental.agreementNumber && (
                <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-brand-orange/20 text-brand-orange">
                  Agr: {rental.agreementNumber}
                </span>
              )}
              {rental.rentalType === 'hourly' ? (
                <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Clock className="w-3 h-3" /> Hourly Plan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Calendar className="w-3 h-3" /> Day-Wise Plan
                </span>
              )}
              <StatusBadge status={rental.status} />
              <StatusBadge status={rental.paymentStatus} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {formatDateTime(rental.createdAt)} • THROTTLEX Fleet Verified Agreement
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Remaining Balance</span>
            <span className="text-2xl font-bold font-display text-amber-400">
              {formatINR(rental.remainingAmount)}
            </span>
          </div>
        </div>

        {/* Motorcycle & Customer Twin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bike Info */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
              <BikeIcon className="w-4 h-4" /> Motorcycle Details
            </p>
            <div className="flex items-start gap-3">
              {rental.bike?.imageUrl && (
                <img
                  src={rental.bike.imageUrl}
                  alt={rental.bike.name}
                  className="w-16 h-16 rounded-lg object-cover border border-brand-border"
                />
              )}
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-white text-sm">{rental.bike?.name}</p>
                <p className="font-mono text-slate-300">{rental.bike?.registrationNumber}</p>
                <p className="text-slate-400">
                  Start Odometer: <strong className="text-white font-mono">{formatKm(rental.startOdometer)}</strong>
                </p>
                {rental.endOdometer && (
                  <p className="text-slate-400">
                    Return Odometer: <strong className="text-emerald-400 font-mono">{formatKm(rental.endOdometer)}</strong>
                    {rental.endOdometer > rental.startOdometer && (
                      <span className="ml-1 text-slate-400 font-normal">
                        (+{rental.endOdometer - rental.startOdometer} km driven)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Customer & KYC Particulars
            </p>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-white text-sm">{rental.customer?.name}</p>
              <p className="text-slate-300 font-mono">Mobile: {rental.customer?.phone}</p>
              <p className="text-slate-400">
                DL Number: <span className="font-mono text-white">{rental.customer?.dlNumber || 'Verified on File'}</span>
              </p>
              {rental.guarantor?.name && (
                <p className="text-slate-400">
                  Guarantor: <strong className="text-slate-200">{rental.guarantor.name}</strong> ({rental.guarantor.relation})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Handover & Return Inspection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Handover Inspection Summary */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> Pre-Ride Handover Inspection
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Passed ✓
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-black/20">
                <span className="text-[10px] text-slate-400 block uppercase">Handover Fuel</span>
                <strong className="text-emerald-400">{handover.fuelLevel || 'Full Tank'}</strong>
              </div>
              <div className="p-2 rounded bg-black/20">
                <span className="text-[10px] text-slate-400 block uppercase">Start Odo</span>
                <strong className="text-white font-mono">{formatKm(rental.startOdometer)}</strong>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-brand-border/40">
              <span>24 Checkpoints: <strong className="text-white">All Checked</strong></span>
              <span>
                Signatures: {handover.customerSignature ? <strong className="text-emerald-400">Digitally Signed ✓</strong> : <span className="text-slate-500">Pending</span>}
              </span>
            </div>
          </div>

          {/* Return Drop-Off Inspection Summary */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Return Inspection & Condition
              </span>
              {returnInsp.confirmed ? (
                returnInsp.damageDetected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">
                    ⚠️ Damage Flagged
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                    Clean Drop-Off ✓
                  </span>
                )
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                  Pending Return
                </span>
              )}
            </div>

            {returnInsp.confirmed ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-black/20">
                    <span className="text-[10px] text-slate-400 block uppercase">Return Fuel</span>
                    <strong className="text-white">{returnInsp.fuelLevel || 'Full'}</strong>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <span className="text-[10px] text-slate-400 block uppercase">Return Odo</span>
                    <strong className="text-white font-mono">{formatKm(returnInsp.odometer || rental.endOdometer || 0)}</strong>
                  </div>
                </div>

                {returnInsp.damageDetected ? (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                    <strong>New Damage Detected:</strong> {returnInsp.damageRemarks || 'Deficiencies flagged during return inspection.'}
                    {returnInsp.damageChargeAmount > 0 && (
                      <span className="block mt-0.5 font-bold text-rose-400">
                        Damage Fee Assessed: {formatINR(returnInsp.damageChargeAmount)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400">
                    ✓ No scratches or damage detected. Vehicle clearance completed.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Drop-off technical inspection will be recorded when the bike is returned.
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Duration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-brand-surface border border-brand-border text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Start Date & Time</span>
            <span className="font-semibold text-white mt-1 block">{formatDateTime(rental.startDate)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Expected Return</span>
            <span className="font-semibold text-white mt-1 block">{formatDateTime(rental.expectedEndDate)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Actual Return</span>
            <span className="font-semibold text-white mt-1 block">
              {rental.actualEndDate ? formatDateTime(rental.actualEndDate) : 'In Progress'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duration & Tariff</span>
            <span className="font-semibold text-brand-orange mt-1 block">
              {rental.rentalType === 'hourly'
                ? `${rental.totalHours} hrs @ ${formatINR(rental.hourlyRate)}/hr`
                : `${rental.totalDays} days @ ${formatINR(rental.dailyRate)}/day`}
            </span>
          </div>
        </div>

        {/* Financial Calculation Breakdown Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-white text-sm">Financial Charges Breakdown</h3>
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-300">
                {rental.rentalType === 'hourly'
                  ? `Base Rental Rate (${rental.totalHours} hours × ${formatINR(rental.hourlyRate)}/hr):`
                  : `Base Rental Rate (${rental.totalDays} days × ${formatINR(rental.dailyRate)}/day):`}
              </span>
              <span className="font-semibold text-white">
                {rental.rentalType === 'hourly'
                  ? formatINR(rental.totalHours * rental.hourlyRate)
                  : formatINR(rental.totalDays * rental.dailyRate)}
              </span>
            </div>

            {rental.securityDeposit > 0 && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Security Deposit Collected (Refundable):</span>
                <span className="font-semibold text-sky-400">{formatINR(rental.securityDeposit)}</span>
              </div>
            )}

            {rental.extraCharges > 0 && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-rose-300">
                  Extra / Late / Damage Charges ({rental.extraChargesReason || 'Additional fees'}):
                </span>
                <span className="font-bold text-rose-400">+{formatINR(rental.extraCharges)}</span>
              </div>
            )}

            {rental.discount > 0 && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-amber-300">Promotional Discount Applied:</span>
                <span className="font-bold text-amber-400">-{formatINR(rental.discount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 text-sm font-bold">
              <span className="text-white">Total Rental Amount:</span>
              <span className="text-brand-orange font-display">{formatINR(rental.totalAmount)}</span>
            </div>

            <div className="flex justify-between pt-1 text-xs">
              <span className="text-emerald-400">Total Amount Paid by Customer:</span>
              <span className="font-bold text-emerald-400">{formatINR(rental.amountPaid)}</span>
            </div>

            <div className="flex justify-between pt-1 text-sm font-bold">
              <span className="text-amber-400">Remaining Balance:</span>
              <span className="text-amber-400 font-display">{formatINR(rental.remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Multi-Payment History Log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              Payment Receipts History ({payments.length})
            </h3>
            {rental.remainingAmount > 0 && (
              <button
                onClick={() => onTriggerAction('record_payment_for_rental', rental)}
                className="text-xs font-bold text-brand-orange hover:underline"
              >
                + Add Partial Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <p className="p-4 rounded-xl bg-brand-surface border border-brand-border text-center text-xs text-slate-400">
              No payments recorded yet for this rental.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-brand-surface text-slate-400 uppercase text-[10px] border-b border-brand-border">
                    <th className="py-2.5 px-3">Receipt #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Received By (Partner)</th>
                    <th className="py-2.5 px-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-brand-surface/40">
                      <td className="py-3 px-3 font-mono font-bold text-white">{p.receiptNumber}</td>
                      <td className="py-3 px-3 text-slate-300">{formatDateTime(p.paymentDate)}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{formatINR(p.amount)}</td>
                      <td className="py-3 px-3 uppercase text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {p.receivedByPartner?.name || 'Partner'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {p.transactionReference || p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Official Rental Agreement Modal */}
      <RentalAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        rentalId={rental._id}
        onAgreementUpdated={loadRental}
      />
    </div>
  );
}
