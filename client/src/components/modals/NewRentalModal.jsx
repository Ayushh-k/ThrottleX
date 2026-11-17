import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2, Clock, IndianRupee, Bike as BikeIcon, User, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, calculateDays } from '../../utils/formatters';

export default function NewRentalModal({ isOpen, onClose, onSuccess, preselectedBikeId = null }) {
  const [bikes, setBikes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [error, setError] = useState('');

  // Form State
  const [selectedBikeId, setSelectedBikeId] = useState(preselectedBikeId || '');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDl, setCustomerDl] = useState('');

  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 16);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const defaultEnd = tomorrow.toISOString().slice(0, 16);

  const [startDate, setStartDate] = useState(defaultStart);
  const [expectedEndDate, setExpectedEndDate] = useState(defaultEnd);
  const [dailyRate, setDailyRate] = useState(900);
  const [securityDeposit, setSecurityDeposit] = useState(2000);
  const [extraCharges, setExtraCharges] = useState(0);
  const [extraReason, setExtraReason] = useState('');
  const [discount, setDiscount] = useState(0);
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [receivedByPartnerId, setReceivedByPartnerId] = useState('');
  const [startOdometer, setStartOdometer] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [bikesRes, customersRes, partnersRes] = await Promise.all([
        api.getBikes(),
        api.getCustomers(),
        api.getPartners()
      ]);

      setBikes(bikesRes.bikes || []);
      setCustomers(customersRes.customers || []);
      setPartners(partnersRes.partners || []);

      if (partnersRes.partners?.length > 0) {
        setReceivedByPartnerId(partnersRes.partners[0].partnerId);
      }

      if (preselectedBikeId) {
        setSelectedBikeId(preselectedBikeId);
        const b = bikesRes.bikes?.find((x) => x._id === preselectedBikeId);
        if (b) {
          setDailyRate(b.defaultDailyRate);
          setStartOdometer(b.currentOdometer || 0);
        }
      } else if (bikesRes.bikes?.length > 0) {
        setSelectedBikeId(bikesRes.bikes[0]._id);
        setDailyRate(bikesRes.bikes[0].defaultDailyRate);
        setStartOdometer(bikesRes.bikes[0].currentOdometer || 0);
      }
    } catch (e) {
      setError('Failed to load bikes and partners list.');
    } finally {
      setLoading(false);
    }
  };

  const handleBikeChange = (id) => {
    setSelectedBikeId(id);
    const b = bikes.find((x) => x._id === id);
    if (b) {
      setDailyRate(b.defaultDailyRate);
      setStartOdometer(b.currentOdometer || 0);
    }
  };

  // Availability check
  useEffect(() => {
    if (!selectedBikeId || !startDate || !expectedEndDate) return;

    const timer = setTimeout(async () => {
      try {
        setCheckingAvailability(true);
        const res = await api.checkAvailability({
          bikeId: selectedBikeId,
          startDate,
          endDate: expectedEndDate
        });
        setAvailabilityResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAvailability(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedBikeId, startDate, expectedEndDate]);

  // Derived calculations
  const totalDays = calculateDays(startDate, expectedEndDate);
  const subtotal = totalDays * Number(dailyRate || 0);
  const totalAmount = Math.max(0, subtotal + Number(extraCharges || 0) - Number(discount || 0));
  const remainingAmount = Math.max(0, totalAmount - Number(initialPayment || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBikeId) {
      setError('Please select a bike.');
      return;
    }
    if (!isNewCustomer && !selectedCustomerId) {
      setError('Please select an existing customer or enter new customer details.');
      return;
    }
    if (isNewCustomer && (!customerName || !customerPhone)) {
      setError('Customer name and phone number are required.');
      return;
    }
    if (availabilityResult && !availabilityResult.available) {
      setError('Selected bike is unavailable during these dates. Please choose another date or bike.');
      return;
    }
    if (Number(initialPayment) > totalAmount) {
      setError('Initial payment cannot exceed the total rental amount.');
      return;
    }

    try {
      setLoading(true);
      await api.createRental({
        bikeId: selectedBikeId,
        customerId: isNewCustomer ? null : selectedCustomerId,
        customerName: isNewCustomer ? customerName : undefined,
        customerPhone: isNewCustomer ? customerPhone : undefined,
        customerDlNumber: isNewCustomer ? customerDl : undefined,
        startDate,
        expectedEndDate,
        dailyRate: Number(dailyRate),
        securityDeposit: Number(securityDeposit),
        extraCharges: Number(extraCharges),
        extraChargesReason: extraReason,
        discount: Number(discount),
        initialPayment: Number(initialPayment),
        paymentMethod,
        receivedByPartnerId,
        startOdometer: Number(startOdometer),
        notes
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating rental.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-brand-card dark:bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-surface">
          <div>
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-orange" /> Create New Rental
            </h3>
            <p className="text-xs text-slate-400">Book bike, calculate automated rates, record advance payment</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Bike Selection & Availability */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BikeIcon className="w-4 h-4 text-brand-orange" /> Select Motorcycle
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {bikes.map((b) => (
                <div
                  key={b._id}
                  onClick={() => handleBikeChange(b._id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedBikeId === b._id
                      ? 'border-brand-orange bg-brand-orange/10 text-white shadow-glow-sm'
                      : 'border-brand-border bg-brand-surface/70 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{b.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.registrationNumber}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs">
                    <span className="font-bold text-brand-orange">{formatINR(b.defaultDailyRate)}/day</span>
                    <span className="text-[10px] uppercase text-slate-400">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Availability Alert Banner */}
            {checkingAvailability ? (
              <p className="text-xs text-slate-400 animate-pulse flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-orange" /> Checking real-time booking availability...
              </p>
            ) : availabilityResult ? (
              availabilityResult.available ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Bike is available for selected dates.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                    <AlertCircle className="w-4 h-4" /> Bike unavailable for selected dates!
                  </div>
                  <p className="text-slate-300">
                    Conflicting booking: #{availabilityResult.conflictingRental?.rentalNumber} ({availabilityResult.conflictingRental?.customerName}).
                  </p>
                  {availabilityResult.alternatives?.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-400">
                      Nearby available bikes: {availabilityResult.alternatives.map((a) => a.name).join(', ')}.
                    </div>
                  )}
                </div>
              )
            ) : null}
          </div>

          {/* Section 2: Dates and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Expected Return Date & Time
              </label>
              <input
                type="datetime-local"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
              />
            </div>
          </div>

          {/* Duration Banner */}
          <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Calculated Duration: <strong className="text-white">{totalDays} Day{totalDays > 1 ? 's' : ''}</strong>
            </span>
            <span className="text-slate-400">
              Rate per Day: <strong className="text-white">{formatINR(dailyRate)}</strong>
            </span>
            <span className="text-slate-400">
              Subtotal: <strong className="text-brand-orange">{formatINR(subtotal)}</strong>
            </span>
          </div>

          {/* Section 3: Customer Information */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-400" /> Customer Information
              </label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs text-brand-orange hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {isNewCustomer ? 'Select Existing Customer' : 'Add New Customer'}
              </button>
            </div>

            {!isNewCustomer ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
              >
                <option value="">-- Select from {customers.length} registered customers --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone}) - DL: {c.dlNumber || 'N/A'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                  required
                />
                <input
                  type="text"
                  placeholder="Driving Licence No."
                  value={customerDl}
                  onChange={(e) => setCustomerDl(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface"
                />
              </div>
            )}
          </div>

          {/* Section 4: Pricing, Charges & Payment */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" /> Pricing & Payment Breakdown
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Daily Rate (₹)</label>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-surface font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-surface"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-surface text-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Extra Charges (₹)</label>
                <input
                  type="number"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-surface"
                />
              </div>
            </div>

            {/* Total and Remaining Summary */}
            <div className="p-4 rounded-xl bg-brand-surface/90 border border-brand-border grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total Rent</p>
                <p className="text-lg font-bold font-display text-white mt-0.5">{formatINR(totalAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">Advance Paid</p>
                <p className="text-lg font-bold font-display text-emerald-400 mt-0.5">{formatINR(initialPayment)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-400">Remaining Balance</p>
                <p className="text-lg font-bold font-display text-amber-400 mt-0.5">{formatINR(remainingAmount)}</p>
              </div>
            </div>

            {/* Advance payment inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Advance Amount Received (₹)</label>
                <input
                  type="number"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface font-semibold text-emerald-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer / IMPS</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Received By (Partner Account) *
                </label>
                <select
                  value={receivedByPartnerId}
                  onChange={(e) => setReceivedByPartnerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                >
                  {partners.map((p) => (
                    <option key={p.partnerId || p._id} value={p.partnerId || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-brand-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg bg-white/5 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (availabilityResult && !availabilityResult.available)}
              className="px-6 py-2.5 text-sm font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm & Create Rental'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
