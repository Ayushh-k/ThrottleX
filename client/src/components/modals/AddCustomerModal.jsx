import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }

    try {
      setLoading(true);
      await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        dlNumber: dlNumber.trim().toUpperCase(),
        idProofType,
        idProofNumber: idProofNumber.trim().toUpperCase(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error adding customer.');
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
              <UserPlus className="w-5 h-5 text-purple-400" /> Add Customer Profile
            </h3>
            <p className="text-xs text-slate-400">Save rider contact, licence, and KYC records</p>
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                required
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
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Driving Licence No.</label>
              <input
                type="text"
                value={dlNumber}
                onChange={(e) => setDlNumber(e.target.value)}
                placeholder="DL04201800..."
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface uppercase"
              />
            </div>
          </div>

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
                <option value="Driving Licence">Driving Licence</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">ID Proof Number</label>
              <input
                type="text"
                value={idProofNumber}
                onChange={(e) => setIdProofNumber(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full local address"
              className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Contact person & phone"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes or preferences"
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
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
              className="px-6 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-glow-sm"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
