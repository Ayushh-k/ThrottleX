import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  User,
  Bike as BikeIcon,
  Calendar,
  IndianRupee,
  AlertTriangle,
  PenTool,
  RotateCcw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, formatDateTime, formatDate, formatKm } from '../../utils/formatters';

// Simple HTML5 Canvas Signature Pad Component
function SignaturePad({ label, signatureData, onSave, onClear, disabled = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f97316'; // Brand orange stroke

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = signatureData;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [signatureData]);

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (onSave && hasDrawn) {
      onSave(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-brand-orange" /> {label}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className="border border-brand-border rounded-xl bg-slate-950/80 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={320}
          height={110}
          className={`w-full h-24 touch-none cursor-crosshair ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!signatureData && !hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 text-xs italic">
            Draw digital signature here
          </div>
        )}
      </div>
    </div>
  );
}

export default function RentalAgreementModal({ isOpen, onClose, rentalId, onAgreementUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSignatures, setSavingSignatures] = useState(false);
  const [customerSig, setCustomerSig] = useState('');
  const [guarantorSig, setGuarantorSig] = useState('');
  const [repSig, setRepSig] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && rentalId) {
      loadAgreement();
    }
  }, [isOpen, rentalId]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getRentalAgreement(rentalId);
      setData(res);
      setCustomerSig(res.handoverInspection?.customerSignature || '');
      setGuarantorSig(res.handoverInspection?.guarantorSignature || '');
      setRepSig(res.handoverInspection?.representativeSignature || '');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load rental agreement.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignatures = async () => {
    try {
      setSavingSignatures(true);
      await api.recordHandoverInspection(rentalId, {
        customerSignature: customerSig,
        guarantorSignature: guarantorSig,
        representativeSignature: repSig,
        checklist: data?.handoverInspection?.checklist || {},
        fuelLevel: data?.handoverInspection?.fuelLevel || 'Full',
        odometer: data?.rental?.startOdometer || 0
      });
      if (onAgreementUpdated) onAgreementUpdated();
      alert('Digital signatures successfully recorded in agreement!');
    } catch (err) {
      alert(err.message || 'Error saving signatures.');
    } finally {
      setSavingSignatures(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!data?.summaryText) return;
    navigator.clipboard.writeText(data.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const r = data?.rental || {};
  const b = data?.bike || {};
  const c = data?.customer || {};
  const g = data?.guarantor || c.guarantor || {};
  const handover = data?.handoverInspection || {};
  const returnInsp = data?.returnInspection || {};
  const checklist = handover.checklist || {};

  const checklistItems = [
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
    { key: 'noUnrecordedDamage', label: 'Pre-Existing Checked' },
    { key: 'photosTaken', label: 'Handover Walkaround' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between p-4 px-6 border-b border-brand-border bg-brand-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Rental Agreement & Inspection Form
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange font-mono font-semibold">
                  {data?.agreementNumber || `TX-AGR-${r.rentalNumber || ''}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official THROTTLEX Verified Rental Contract • Zero-Tamper Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.whatsappUrl && (
              <a
                href={data.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-glow-sm"
              >
                <Share2 className="w-3.5 h-3.5" /> Share WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-brand-border bg-brand-surface hover:bg-white/5 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Copy verified summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Agreement Document Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-200 print:text-black print:bg-white print:p-4 print:overflow-visible">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Generating verified rental contract...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          ) : (
            <div className="space-y-6 print:space-y-4 max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="border-b-2 border-brand-orange/40 pb-4 print:border-black">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black tracking-widest text-white print:text-black font-display">
                        THROTTLEX
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-brand-orange/20 text-brand-orange print:border print:border-black print:text-black">
                        VERIFIED RENTAL
                      </span>
                    </div>
                    <p className="text-[11px] tracking-wider text-brand-orange font-bold font-mono uppercase mt-0.5">
                      OWN THE ROAD.
                    </p>
                    <p className="text-xs text-slate-400 print:text-gray-700 mt-1">
                      Official Motorcycle Rental Agreement & Technical Handover Form
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-1">
                    <p className="font-mono font-bold text-white print:text-black">
                      Agreement No: <span className="text-brand-orange print:text-black">{data?.agreementNumber}</span>
                    </p>
                    <p className="text-slate-400 print:text-gray-700">
                      Booking Ref: <strong className="text-white print:text-black">#{r.rentalNumber}</strong>
                    </p>
                    <p className="text-slate-400 print:text-gray-700">
                      Date of Issue: <strong>{formatDate(r.startDate || new Date())}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: CUSTOMER DETAILS (HIRER) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-border/60 pb-1 print:border-gray-300 print:text-black">
                  <User className="w-3.5 h-3.5" /> 1. Primary Customer / Hirer Details
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-brand-surface/60 p-3 rounded-xl border border-brand-border/40 print:bg-gray-50 print:border-gray-300 print:text-black">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Full Name</span>
                    <strong className="text-white print:text-black text-sm">{c.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Contact Phone</span>
                    <strong className="text-white print:text-black">{c.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Driving Licence (DL)</span>
                    <strong className="text-brand-orange print:text-black font-mono">{c.dlNumber || 'Verified On File'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Aadhaar / National ID</span>
                    <strong className="text-white print:text-black font-mono">{c.idProofNumber || c.aadhaarNumber || 'Verified On File'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Father's Name</span>
                    <span className="text-slate-200 print:text-black">{c.fatherName || 'On Record'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Alternate / Emergency Contact</span>
                    <span className="text-slate-200 print:text-black">{c.altPhone || c.emergencyContact || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase block">Current Address</span>
                    <span className="text-slate-200 print:text-black truncate block">{c.currentAddress || c.address || 'Local Residence'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: GUARANTOR / SECOND PERSON */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-border/60 pb-1 print:border-gray-300 print:text-black">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2. Guarantor / Reference Contact (Second Person)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-brand-surface/60 p-3 rounded-xl border border-brand-border/40 print:bg-gray-50 print:border-gray-300 print:text-black">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Guarantor Name</span>
                    <strong className="text-white print:text-black">{g.name || 'Primary Reference'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Relationship</span>
                    <span className="text-slate-200 print:text-black">{g.relation || 'Parent / Relative / Friend'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Contact Phone</span>
                    <strong className="text-white print:text-black">{g.phone || c.emergencyContact || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">ID / Aadhaar No</span>
                    <span className="text-slate-200 print:text-black font-mono">{g.idProofNumber || g.dlNumber || 'On Record'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MOTORCYCLE & TARIFF PARTICULARS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-border/60 pb-1 print:border-gray-300 print:text-black">
                  <BikeIcon className="w-3.5 h-3.5" /> 3. Motorcycle & Rental Tariff Particulars
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-brand-surface/60 p-3 rounded-xl border border-brand-border/40 print:bg-gray-50 print:border-gray-300 print:text-black">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Motorcycle</span>
                    <strong className="text-white print:text-black text-sm">{b.name || 'Motorcycle'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Registration No</span>
                    <strong className="text-brand-orange print:text-black font-mono text-sm">{b.registrationNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Start Date & Time</span>
                    <span className="text-slate-200 print:text-black">{formatDateTime(r.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Expected Return</span>
                    <span className="text-slate-200 print:text-black">{formatDateTime(r.expectedEndDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Duration & Plan</span>
                    <strong className="text-white print:text-black">
                      {r.rentalType === 'hourly' ? `${r.totalHours} Hours (Hourly)` : `${r.totalDays} Days (Day-Wise)`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Tariff Rate</span>
                    <strong className="text-white print:text-black">
                      {r.rentalType === 'hourly' ? `${formatINR(r.hourlyRate)}/hr` : `${formatINR(r.dailyRate)}/day`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Start Odometer</span>
                    <strong className="text-white print:text-black font-mono">{formatKm(r.startOdometer || b.currentOdometer || 0)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Handover Fuel</span>
                    <strong className="text-emerald-400 print:text-black">{handover.fuelLevel || 'Full Tank'}</strong>
                  </div>
                </div>

                {/* Tariff Financial Table */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs p-2.5 rounded-xl bg-slate-900 border border-brand-border/40 print:bg-gray-100 print:border-gray-300">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Rental</span>
                    <strong className="text-white print:text-black text-sm">{formatINR(r.totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Advance Paid</span>
                    <strong className="text-emerald-400 print:text-black text-sm">{formatINR(r.amountPaid)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Security Deposit</span>
                    <strong className="text-amber-400 print:text-black text-sm">{formatINR(r.securityDeposit)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Remaining Balance</span>
                    <strong className="text-brand-orange print:text-black text-sm">{formatINR(r.remainingAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION 4: 24-POINT PRE-RIDE CHECKLIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-border/60 pb-1 print:border-gray-300 print:text-black">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4. 24-Point Technical Handover & Return Checklist
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Pre-Ride Inspection Sign-Off</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] bg-brand-surface/40 p-3 rounded-xl border border-brand-border/40 print:bg-white print:border-gray-300">
                  {checklistItems.map((item) => {
                    const isPassed = checklist[item.key] !== false;
                    return (
                      <div key={item.key} className="flex items-center gap-1.5 p-1 rounded bg-black/20 print:bg-transparent">
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isPassed ? 'text-emerald-400 print:text-black' : 'text-rose-400 print:text-red-600'
                        }`}>
                          {isPassed ? '✓' : '✗'}
                        </span>
                        <span className="text-slate-300 print:text-black truncate">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                {handover.existingDamage && handover.existingDamage !== 'None' && (
                  <p className="text-[11px] text-amber-300 print:text-black italic px-2">
                    * Pre-existing notes: {handover.existingDamage}
                  </p>
                )}
              </div>

              {/* SECTION 5: CUSTOMER DECLARATION & 8 TERMS */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-border/60 pb-1 print:border-gray-300 print:text-black">
                  <AlertTriangle className="w-3.5 h-3.5" /> 5. Standard Rental Terms & Hirer Declarations
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300 print:text-black leading-relaxed bg-brand-surface/30 p-3 rounded-xl border border-brand-border/30 print:bg-transparent print:p-0">
                  {(data?.agreedTerms || []).map((t) => (
                    <div key={t.number} className="text-justify">
                      <strong className="text-white print:text-black font-semibold">
                        {t.number}. {t.title}:
                      </strong>{' '}
                      <span className="text-slate-400 print:text-gray-800">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6 & 7: SIGNATURES & CLEARANCE */}
              <div className="pt-2 border-t-2 border-brand-border/80 print:border-black space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-white print:text-black flex items-center justify-between">
                  <span>6. Execution & Digital Sign-Off</span>
                  <span className="text-[11px] text-slate-400 font-normal">All parties acknowledge binding terms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Hirer Signature */}
                  <div>
                    <SignaturePad
                      label="Primary Hirer Signature"
                      signatureData={customerSig}
                      onSave={(dataUrl) => setCustomerSig(dataUrl)}
                      onClear={() => setCustomerSig('')}
                    />
                    <div className="mt-1 text-[10px] text-slate-400 text-center">
                      Name: <strong className="text-slate-200 print:text-black">{c.name || 'Hirer'}</strong>
                    </div>
                  </div>

                  {/* Guarantor Signature */}
                  <div>
                    <SignaturePad
                      label="Guarantor / Reference Signature"
                      signatureData={guarantorSig}
                      onSave={(dataUrl) => setGuarantorSig(dataUrl)}
                      onClear={() => setGuarantorSig('')}
                    />
                    <div className="mt-1 text-[10px] text-slate-400 text-center">
                      Name: <strong className="text-slate-200 print:text-black">{g.name || 'Guarantor'}</strong>
                    </div>
                  </div>

                  {/* Representative Signature */}
                  <div>
                    <SignaturePad
                      label="THROTTLEX Station Representative"
                      signatureData={repSig}
                      onSave={(dataUrl) => setRepSig(dataUrl)}
                      onClear={() => setRepSig('')}
                    />
                    <div className="mt-1 text-[10px] text-slate-400 text-center">
                      Executive: <strong className="text-slate-200 print:text-black">THROTTLEX Operations</strong>
                    </div>
                  </div>
                </div>

                {/* Save Signatures Action Button (Hidden on Print) */}
                <div className="print:hidden flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSignatures}
                    disabled={savingSignatures}
                    className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-sm disabled:opacity-50"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    {savingSignatures ? 'Saving Signatures...' : 'Save Signatures to Contract'}
                  </button>
                </div>
              </div>

              {/* Bottom Print Footer */}
              <div className="pt-4 border-t border-brand-border/40 text-center text-[10px] text-slate-500 print:text-gray-500">
                THROTTLEX Rental Business Manager • System Generated Verifiable Agreement Ref: {data?.agreementNumber} • Helpline: +91 99999 99999
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
