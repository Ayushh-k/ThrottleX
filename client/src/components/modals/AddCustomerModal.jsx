import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, ShieldCheck, Upload, Calendar, Camera, AlertTriangle, User } from 'lucide-react';
import { api } from '../../services/api';

export default function AddCustomerModal({ isOpen, onClose, onSuccess, zIndex = 'z-50' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'kyc_docs' | 'guarantor'

  // Basic Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  // KYC Vault Details
  const [dlNumber, setDlNumber] = useState('');
  const [dlExpiryDate, setDlExpiryDate] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [riskStatus, setRiskStatus] = useState('verified'); // 'verified' | 'pending' | 'risk' | 'blocked'
  const [blockedReason, setBlockedReason] = useState('');

  // Document Uploads (Data URLs)
  const [photoUrl, setPhotoUrl] = useState('');
  const [dlPhotoUrl, setDlPhotoUrl] = useState('');
  const [dlBackPhotoUrl, setDlBackPhotoUrl] = useState('');
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState('');
  const [aadhaarBackPhotoUrl, setAadhaarBackPhotoUrl] = useState('');

  // Guarantor / Reference Contact
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorId, setGuarantorId] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // File to base64 helper
  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('File size exceeds 3MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setter(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    // Guard: Do not allow submission if user is not on the final guarantor step
    if (activeTab !== 'guarantor') {
      if (activeTab === 'basic') {
        if (!name.trim() || !phone.trim()) {
          setError('Customer name and phone number are required.');
          return;
        }
        setError('');
        setActiveTab('kyc_docs');
      } else if (activeTab === 'kyc_docs') {
        setError('');
        setActiveTab('guarantor');
      }
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError('Customer name and phone number are required.');
      setActiveTab('basic');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        fatherName: fatherName.trim(),
        altPhone: altPhone.trim(),
        dob: dob || undefined,
        currentAddress: address.trim(),
        address: address.trim(),
        dlNumber: dlNumber.trim().toUpperCase(),
        dlExpiryDate: dlExpiryDate || undefined,
        idProofType,
        idProofNumber: idProofNumber.trim().toUpperCase(),
        riskStatus,
        blockedReason: riskStatus === 'blocked' ? (blockedReason.trim() || 'Flagged by admin') : '',
        photoUrl,
        dlPhotoUrl,
        dlBackPhotoUrl,
        aadhaarPhotoUrl,
        aadhaarBackPhotoUrl,
        guarantor: {
          name: guarantorName.trim(),
          relation: guarantorRelation.trim(),
          phone: guarantorPhone.trim(),
          idProofNumber: guarantorId.trim().toUpperCase(),
          confirmed: Boolean(guarantorName.trim())
        },
        notes: notes.trim()
      });

      if (onSuccess) {
        onSuccess(res.customer || res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-modal-backdrop`}>
      <div className="relative w-full max-w-2xl bg-brand-card border-t sm:border border-brand-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden animate-mac-modal">
        {/* Mobile Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border bg-brand-surface shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-orange" /> Customer KYC Vault Profile
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Save verified ID documents, driving licence expiry, risk status & guarantor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-border bg-brand-surface/50 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 font-semibold text-center border-b-2 transition-all min-h-[44px] ${
              activeTab === 'basic'
                ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            1. Personal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kyc_docs')}
            className={`flex-1 py-3 font-semibold text-center border-b-2 transition-all min-h-[44px] ${
              activeTab === 'kyc_docs'
                ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            2. KYC Docs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guarantor')}
            className={`flex-1 py-3 font-semibold text-center border-b-2 transition-all min-h-[44px] ${
              activeTab === 'guarantor'
                ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            3. Guarantor
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 sm:p-6 space-y-4 pb-28 sm:pb-6 flex-1 overscroll-contain">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's full name"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="Emergency contact"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rider@example.com"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Street, City, State, PIN"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
              </div>

              {/* Rider Photo Live Capture / Upload */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-orange" /> Customer Live Photo
                </label>
                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-orange">
                      <img src={photoUrl} alt="Customer" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] opacity-0 hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-brand-border flex items-center justify-center text-slate-500 bg-brand-surface">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setPhotoUrl)}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-surface file:text-slate-300 hover:file:bg-white/10"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Upload recent passport photo or capture live</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KYC DOCUMENTS & RISK */}
          {activeTab === 'kyc_docs' && (
            <div className="space-y-4">
              {/* Risk Status Pill Selector */}
              <div className="p-3 rounded-xl bg-brand-surface border border-brand-border space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Customer Risk & Verification Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'verified', label: '🟢 Verified', desc: 'Full KYC Clean' },
                    { id: 'pending', label: '🟡 Pending KYC', desc: 'Docs Pending' },
                    { id: 'risk', label: '🟠 High Risk', desc: 'Caution Advised' },
                    { id: 'blocked', label: '🔴 Blocked', desc: 'No Rentals Allowed' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setRiskStatus(s.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        riskStatus === s.id
                          ? s.id === 'blocked'
                            ? 'border-rose-500 bg-rose-500/20 text-white font-bold'
                            : 'border-brand-orange bg-brand-orange/20 text-white font-bold'
                          : 'border-brand-border bg-black/20 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {riskStatus === 'blocked' && (
                  <div className="pt-2">
                    <label className="text-[11px] text-rose-400 font-semibold block mb-1">
                      Reason for Blocking (System will prohibit rental booking) *
                    </label>
                    <input
                      type="text"
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      placeholder="e.g. Unpaid damage penalty / Rash driving / Past default"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-rose-500/40 bg-rose-950/30 text-rose-200"
                      required={riskStatus === 'blocked'}
                    />
                  </div>
                )}
              </div>

              {/* Driving Licence & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Driving Licence (DL) No.</label>
                  <input
                    type="text"
                    value={dlNumber}
                    onChange={(e) => setDlNumber(e.target.value)}
                    placeholder="DL-0420180012345"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">DL Expiry Date</label>
                  <input
                    type="date"
                    value={dlExpiryDate}
                    onChange={(e) => setDlExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
              </div>

              {/* DL Front & Back Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-brand-surface border border-brand-border">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">DL Photo (Front)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setDlPhotoUrl)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-slate-300"
                  />
                  {dlPhotoUrl && <img src={dlPhotoUrl} alt="DL Front" className="mt-2 h-16 rounded border border-brand-orange object-cover" />}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">DL Photo (Back)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setDlBackPhotoUrl)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-slate-300"
                  />
                  {dlBackPhotoUrl && <img src={dlBackPhotoUrl} alt="DL Back" className="mt-2 h-16 rounded border border-brand-orange object-cover" />}
                </div>
              </div>

              {/* Aadhaar / ID Proof */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">ID Proof Type</label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="College ID">College ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">ID Number</label>
                  <input
                    type="text"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white uppercase font-mono"
                  />
                </div>
              </div>

              {/* Aadhaar Front & Back Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-brand-surface border border-brand-border">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Aadhaar / ID (Front)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setAadhaarPhotoUrl)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-slate-300"
                  />
                  {aadhaarPhotoUrl && <img src={aadhaarPhotoUrl} alt="ID Front" className="mt-2 h-16 rounded border border-brand-orange object-cover" />}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Aadhaar / ID (Back)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setAadhaarBackPhotoUrl)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-slate-300"
                  />
                  {aadhaarBackPhotoUrl && <img src={aadhaarBackPhotoUrl} alt="ID Back" className="mt-2 h-16 rounded border border-brand-orange object-cover" />}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUARANTOR / REFERENCE */}
          {activeTab === 'guarantor' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Guarantor / secondary co-contact provides emergency verification and vehicle recovery guarantee.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Guarantor Name</label>
                  <input
                    type="text"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    placeholder="e.g. Suresh Verma"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Relationship</label>
                  <input
                    type="text"
                    value={guarantorRelation}
                    onChange={(e) => setGuarantorRelation(e.target.value)}
                    placeholder="e.g. Father / Brother / Friend"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Guarantor Phone</label>
                  <input
                    type="tel"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Guarantor Aadhaar / ID</label>
                  <input
                    type="text"
                    value={guarantorId}
                    onChange={(e) => setGuarantorId(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Administrative Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes, special rider instructions or security remarks..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                />
              </div>
            </div>
          )}
          </div>

          {/* Sticky Mobile & Desktop Action Bar */}
          <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border flex items-center justify-between gap-2.5 z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 min-h-[46px] transition-all"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== 'basic' && (
                <button
                  key="btn-tab-back"
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'guarantor' ? 'kyc_docs' : 'basic')}
                  className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 min-h-[46px] transition-all"
                >
                  ← Back
                </button>
              )}
              {activeTab === 'basic' && (
                <button
                  key="btn-next-to-kyc"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!name.trim() || !phone.trim()) {
                      setError('Customer name and phone number are required.');
                      return;
                    }
                    setError('');
                    setActiveTab('kyc_docs');
                  }}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover active:bg-orange-600 text-white rounded-xl shadow-glow min-h-[46px] transition-all"
                >
                  Next: KYC Docs →
                </button>
              )}
              {activeTab === 'kyc_docs' && (
                <button
                  key="btn-next-to-guarantor"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('');
                    setActiveTab('guarantor');
                  }}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover active:bg-orange-600 text-white rounded-xl shadow-glow min-h-[46px] transition-all"
                >
                  Next: Guarantor Details →
                </button>
              )}
              {activeTab === 'guarantor' && (
                <button
                  key="btn-save-customer-profile"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover active:bg-orange-600 text-white rounded-xl shadow-glow min-h-[46px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save Customer & KYC Vault'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
