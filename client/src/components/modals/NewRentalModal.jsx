import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2, Clock, IndianRupee, Bike as BikeIcon, User, Plus, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, calculateDays, calculateHours } from '../../utils/formatters';

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

  const [rentalType, setRentalType] = useState('daily'); // 'daily' | 'hourly'
  const [startDate, setStartDate] = useState(defaultStart);
  const [expectedEndDate, setExpectedEndDate] = useState(defaultEnd);
  const [dailyRate, setDailyRate] = useState(900);
  const [hourlyRate, setHourlyRate] = useState(120);
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

      const storedUser = localStorage.getItem('throttlex_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (currentUser?.partnerId) {
        setReceivedByPartnerId(currentUser.partnerId);
      } else if (partnersRes.partners?.length > 0) {
        setReceivedByPartnerId(partnersRes.partners[0].partnerId);
      }

      if (preselectedBikeId) {
        setSelectedBikeId(preselectedBikeId);
        const b = bikesRes.bikes?.find((x) => x._id === preselectedBikeId);
        if (b) {
          setDailyRate(b.defaultDailyRate);
          setHourlyRate(b.defaultHourlyRate || Math.round(b.defaultDailyRate / 8) || 120);
          setStartOdometer(b.currentOdometer || 0);
        }
      } else if (bikesRes.bikes?.length > 0) {
        setSelectedBikeId(bikesRes.bikes[0]._id);
        setDailyRate(bikesRes.bikes[0].defaultDailyRate);
        setHourlyRate(bikesRes.bikes[0].defaultHourlyRate || Math.round(bikesRes.bikes[0].defaultDailyRate / 8) || 120);
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
      setHourlyRate(b.defaultHourlyRate || Math.round(b.defaultDailyRate / 8) || 120);
      setStartOdometer(b.currentOdometer || 0);
    }
  };

  const handleRentalTypeSwitch = (type) => {
    setRentalType(type);
    const start = startDate ? new Date(startDate) : new Date();
    if (type === 'hourly') {
      // Default to 4 hours from start
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      setExpectedEndDate(end.toISOString().slice(0, 16));
    } else {
      // Default to 24 hours (1 day) from start
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      setExpectedEndDate(end.toISOString().slice(0, 16));
    }
  };

  const applyDurationPreset = (amount, unit) => {
    const start = startDate ? new Date(startDate) : new Date();
    let end;
    if (unit === 'hours') {
      end = new Date(start.getTime() + amount * 60 * 60 * 1000);
    } else {
      end = new Date(start.getTime() + amount * 24 * 60 * 60 * 1000);
    }
    setExpectedEndDate(end.toISOString().slice(0, 16));
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
  const isHourly = rentalType === 'hourly';
  const totalDays = calculateDays(startDate, expectedEndDate);
  const totalHours = calculateHours(startDate, expectedEndDate);
  const durationCount = isHourly ? totalHours : totalDays;
  const activeRate = isHourly ? Number(hourlyRate || 0) : Number(dailyRate || 0);
  const subtotal = durationCount * activeRate;
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
        rentalType,
        dailyRate: Number(dailyRate),
        hourlyRate: Number(hourlyRate),
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
                    <div>
                      <span className="font-bold text-brand-orange">{formatINR(b.defaultDailyRate)}/day</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                        ({formatINR(b.defaultHourlyRate || Math.round(b.defaultDailyRate / 8))}/hr)
                      </span>
                    </div>
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

          {/* Section 2: Rental Plan & Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" /> Rental Plan & Duration
              </label>

              {/* Day / Hour Toggle */}
              <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-xl border border-brand-border">
                <button
                  type="button"
                  onClick={() => handleRentalTypeSwitch('daily')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rentalType === 'daily'
                      ? 'bg-brand-orange text-white shadow-glow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Day-Wise
                </button>
                <button
                  type="button"
                  onClick={() => handleRentalTypeSwitch('hourly')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rentalType === 'hourly'
                      ? 'bg-purple-600 text-white shadow-glow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Hourly
                </button>
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Quick Presets:
              </span>
              {isHourly ? (
                <>
                  {[2, 4, 6, 8, 12, 24].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => applyDurationPreset(hrs, 'hours')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                        totalHours === hrs
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-brand-border bg-brand-surface text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      +{hrs} hrs
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[1, 2, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => applyDurationPreset(days, 'days')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                        totalDays === days
                          ? 'border-brand-orange bg-brand-orange/20 text-brand-orange'
                          : 'border-brand-border bg-brand-surface text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {days === 7 ? '1 week' : `+${days} day${days > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </>
              )}
            </div>

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
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
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
                  className="w-full px-3 py-2 rounded-lg text-sm border border-brand-border bg-brand-surface text-white"
                />
              </div>
            </div>

            {/* Duration Banner */}
            <div className="p-3 rounded-xl bg-brand-surface border border-brand-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">
                Plan: <strong className={isHourly ? 'text-purple-400 font-bold' : 'text-brand-orange font-bold'}>
                  {isHourly ? '⏱️ Hourly Rental' : '📅 Day-Wise Rental'}
                </strong>
              </span>
              <span className="text-slate-400">
                Duration: <strong className="text-white">
                  {isHourly ? `${totalHours} Hour${totalHours > 1 ? 's' : ''}` : `${totalDays} Day${totalDays > 1 ? 's' : ''}`}
                </strong>
              </span>
              <span className="text-slate-400">
                Rate: <strong className="text-white">
                  {isHourly ? `${formatINR(hourlyRate)}/hr` : `${formatINR(dailyRate)}/day`}
                </strong>
              </span>
              <span className="text-slate-400">
                Subtotal: <strong className="text-brand-orange text-sm font-bold">{formatINR(subtotal)}</strong>
              </span>
            </div>
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
              {isHourly ? (
                <div>
                  <label className="text-[11px] text-purple-400 font-semibold block mb-1">Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-sm border border-purple-500/40 bg-purple-500/10 font-bold text-purple-300"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-brand-orange font-semibold block mb-1">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-brand-surface font-bold text-brand-orange"
                    required
                  />
                </div>
              )}
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
                  {partners.map((p) => {
                    const pId = p.partnerId || p._id;
                    const storedUser = localStorage.getItem('throttlex_user');
                    const currentUser = storedUser ? JSON.parse(storedUser) : null;
                    const isYou = currentUser?.partnerId === pId;
                    return (
                      <option key={pId} value={pId}>
                        {p.name} {isYou ? '(You)' : ''}
                      </option>
                    );
                  })}
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
