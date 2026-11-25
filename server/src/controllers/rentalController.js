const Rental = require('../models/Rental');
const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Partner = require('../models/Partner');
const Settings = require('../models/Settings');
const ledgerService = require('../services/ledgerService');
const calculationService = require('../services/calculationService');
const { getNextRentalNumber, getNextPaymentReceiptNumber } = require('../utils/idGenerator');

// Helper to check if bike is available during requested dates
async function checkBikeAvailability(bikeId, startDate, endDate, excludeRentalId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const query = {
    bike: bikeId,
    status: { $in: ['active', 'upcoming'] },
    startDate: { $lt: end },
    expectedEndDate: { $gt: start }
  };

  if (excludeRentalId) {
    query._id = { $ne: excludeRentalId };
  }

  const conflicting = await Rental.findOne(query).populate('customer', 'name phone');
  return conflicting;
}

// Check Availability API
exports.checkAvailability = async (req, res) => {
  try {
    const { bikeId, startDate, endDate } = req.query;
    if (!bikeId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Bike ID, start date, and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start date or end date format.' });
    }

    if (end <= start) {
      return res.json({
        available: false,
        invalidDates: true,
        message: 'Expected return date & time must be after start date & time.'
      });
    }

    const conflicting = await checkBikeAvailability(bikeId, start, end);
    if (conflicting) {
      // Find other available bikes for these dates
      const allActiveBikes = await Bike.find({ _id: { $ne: bikeId }, status: { $ne: 'inactive' } }).lean();
      const alternatives = [];

      for (const b of allActiveBikes) {
        const overlap = await checkBikeAvailability(b._id, start, end);
        if (!overlap) {
          alternatives.push({
            id: b._id,
            name: b.name,
            brand: b.brand,
            model: b.model,
            defaultDailyRate: b.defaultDailyRate,
            defaultHourlyRate: b.defaultHourlyRate || Math.round(b.defaultDailyRate / 8) || 120,
            imageUrl: b.imageUrl
          });
        }
      }

      return res.json({
        available: false,
        message: 'Bike is already booked for the selected dates.',
        conflictingRental: {
          rentalNumber: conflicting.rentalNumber,
          customerName: conflicting.customer?.name,
          startDate: conflicting.startDate,
          expectedEndDate: conflicting.expectedEndDate
        },
        alternatives
      });
    }

    return res.json({ available: true, message: 'Bike is available for selected dates.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error checking bike availability.' });
  }
};

// Get all rentals
exports.getAllRentals = async (req, res) => {
  try {
    const { status, paymentStatus, rentalType, bikeId, customerId, search, startDate, endDate } = req.query;
    const filter = {};
    const now = new Date();

    if (status === 'overdue') {
      // Overdue trips: not returned and expectedEndDate has passed
      filter.status = { $in: ['active', 'upcoming'] };
      filter.expectedEndDate = { $lt: now };
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    if (paymentStatus === 'pending' || paymentStatus === 'pending_due') {
      // Any rental with pending payment due
      filter.remainingAmount = { $gt: 0 };
    } else if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    if (rentalType && rentalType !== 'all') filter.rentalType = rentalType;
    if (bikeId && bikeId !== 'all') filter.bike = bikeId;
    if (customerId && customerId !== 'all') filter.customer = customerId;

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.startDate.$lte = end;
      }
    }

    const rentals = await Rental.find(filter)
      .populate('bike', 'name brand model registrationNumber defaultDailyRate defaultHourlyRate imageUrl')
      .populate('customer', 'name phone email dlNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Dynamically mark overdue status if active/upcoming trip has passed its expected return date
    const mappedRentals = rentals.map((r) => {
      const isPastEnd = r.status !== 'returned' && r.status !== 'cancelled' && new Date(r.expectedEndDate) < now;
      return {
        ...r,
        isOverdue: isPastEnd,
        displayStatus: isPastEnd ? 'overdue' : r.status
      };
    });

    const targetRentals = search
      ? mappedRentals.filter((r) => {
          const q = search.toLowerCase();
          return (
            r.rentalNumber?.toLowerCase().includes(q) ||
            r.bike?.name?.toLowerCase().includes(q) ||
            r.bike?.registrationNumber?.toLowerCase().includes(q) ||
            r.customer?.name?.toLowerCase().includes(q) ||
            r.customer?.phone?.includes(q)
          );
        })
      : mappedRentals;

    return res.json({ rentals: targetRentals });
  } catch (err) {
    console.error('getAllRentals error:', err);
    return res.status(500).json({ message: 'Error fetching rentals.' });
  }
};

// Get single rental by ID
exports.getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('bike')
      .populate('customer')
      .populate('createdBy', 'name email');

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found.' });
    }

    const payments = await Payment.find({ rental: rental._id })
      .populate('receivedByPartner', 'name avatar')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });

    return res.json({ rental, payments });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching rental details.' });
  }
};

// Create a new rental
exports.createRental = async (req, res) => {
  try {
    const {
      bikeId,
      customerId,
      // If new customer details provided inline
      customerName,
      customerPhone,
      customerEmail,
      customerDlNumber,
      customerAddress,
      customerEmergencyContact,
      startDate,
      expectedEndDate,
      rentalType = 'daily',
      dailyRate,
      hourlyRate,
      securityDeposit = 0,
      extraCharges = 0,
      extraChargesReason = '',
      discount = 0,
      initialPayment = 0,
      paymentMethod = 'upi',
      receivedByPartnerId,
      startOdometer,
      helmetProvided = 1,
      notes = ''
    } = req.body;

    if (!bikeId) return res.status(400).json({ message: 'Please select a bike.' });
    if (!startDate || !expectedEndDate) {
      return res.status(400).json({ message: 'Start date and expected return date are required.' });
    }

    const start = new Date(startDate);
    const expectedEnd = new Date(expectedEndDate);

    if (expectedEnd <= start) {
      return res.status(400).json({ message: 'Return date cannot be before or equal to start date.' });
    }

    // Anti-double-booking check
    const conflict = await checkBikeAvailability(bikeId, start, expectedEnd);
    if (conflict) {
      return res.status(400).json({
        message: `Bike is already booked for selected dates (conflicts with Rental #${conflict.rentalNumber}).`
      });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ message: 'Selected bike not found.' });

    // Handle customer
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
    } else if (customerPhone) {
      customer = await Customer.findOne({ phone: customerPhone.trim() });
      if (!customer && customerName) {
        customer = await Customer.create({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail || '',
          dlNumber: customerDlNumber || '',
          address: customerAddress || '',
          emergencyContact: customerEmergencyContact || ''
        });
      }
    }

    if (!customer) {
      return res.status(400).json({ message: 'Valid customer information is required.' });
    }

    // KYC Risk status check - Reject blocked customers
    if (customer.riskStatus === 'blocked') {
      return res.status(403).json({
        message: `Customer is BLOCKED: ${customer.blockedReason || 'Flagged for security or violation'}. New bookings cannot be created.`
      });
    }

    // Calculate duration and base price based on rentalType
    const diffMs = expectedEnd - start;
    let diffDays = 0;
    let diffHours = 0;
    let subtotal = 0;
    let appliedDailyRate = Number(dailyRate) || bike.defaultDailyRate || 900;
    const defaultHr = bike.defaultHourlyRate > 0 ? bike.defaultHourlyRate : Math.round(appliedDailyRate / 8) || 120;
    let appliedHourlyRate = Number(hourlyRate) > 0 ? Number(hourlyRate) : defaultHr;

    const effectiveRentalType = rentalType === 'hourly' || (!rentalType && diffMs < 24 * 60 * 60 * 1000) ? 'hourly' : 'daily';

    if (effectiveRentalType === 'hourly') {
      diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      diffDays = Number((diffHours / 24).toFixed(1));
      subtotal = diffHours * appliedHourlyRate;
    } else {
      diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      diffHours = diffDays * 24;
      subtotal = diffDays * appliedDailyRate;
    }

    const totalAmount = Math.max(0, subtotal + Number(extraCharges || 0) - Number(discount || 0));

    const initPay = Number(initialPayment) || 0;
    if (initPay > totalAmount) {
      return res.status(400).json({ message: 'Initial payment cannot exceed total rental amount.' });
    }

    const remainingAmount = totalAmount - initPay;
    const paymentStatus = initPay >= totalAmount ? 'paid' : initPay > 0 ? 'partially_paid' : 'pending';

    // Status: upcoming if start date > now + 2 hours, else active
    const now = new Date();
    const status = start > new Date(now.getTime() + 2 * 60 * 60 * 1000) ? 'upcoming' : 'active';

    const rentalNumber = await getNextRentalNumber();
    const agreementNumber = rentalNumber.replace('TX-R-', 'TX-AGR-');

    const rental = await Rental.create({
      rentalNumber,
      agreementNumber,
      bike: bike._id,
      customer: customer._id,
      guarantor: req.body.guarantor || customer.guarantor || {},
      startDate: start,
      expectedEndDate: expectedEnd,
      rentalType: effectiveRentalType,
      dailyRate: appliedDailyRate,
      hourlyRate: appliedHourlyRate,
      totalDays: diffDays,
      totalHours: diffHours,
      securityDeposit: Number(securityDeposit) || 0,
      extraCharges: Number(extraCharges) || 0,
      extraChargesReason,
      discount: Number(discount) || 0,
      totalAmount,
      amountPaid: initPay,
      remainingAmount,
      status,
      paymentStatus,
      startOdometer: Number(startOdometer) || bike.currentOdometer,
      helmetProvided: Number(helmetProvided) || 1,
      handoverInspection: req.body.handoverInspection || {
        date: start,
        fuelLevel: 'Full',
        odometer: Number(startOdometer) || bike.currentOdometer,
        helmetsIssued: Number(helmetProvided) || 1,
        confirmed: true
      },
      notes,
      createdBy: req.user?._id
    });

    // Update bike status and odometer
    if (status === 'active') {
      bike.status = 'rented';
      if (startOdometer) bike.currentOdometer = Number(startOdometer);
      await bike.save();
    }

    // If initial payment was made, record payment and ledger transaction
    if (initPay > 0) {
      let partner = null;
      if (receivedByPartnerId) {
        partner = await Partner.findById(receivedByPartnerId);
      }
      if (!partner) {
        partner = await Partner.findOne({ status: 'active' });
      }

      const receiptNumber = await getNextPaymentReceiptNumber();
      const payment = await Payment.create({
        receiptNumber,
        rental: rental._id,
        customer: customer._id,
        amount: initPay,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'upi',
        receivedByPartner: partner._id,
        notes: 'Initial advance payment',
        createdBy: req.user?._id
      });

      await ledgerService.recordPayment({
        payment,
        rental,
        customer,
        partner,
        userId: req.user?._id,
        userName: req.user?.name
      });
    }

    const auditDurationStr = rentalType === 'hourly'
      ? `${diffHours} hrs @ ₹${appliedHourlyRate}/hr`
      : `${diffDays} days @ ₹${appliedDailyRate}/day`;

    await ledgerService.recordAudit({
      action: 'RENTAL_CREATED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Created ${rentalType} rental #${rental.rentalNumber} for ${customer.name} on ${bike.name} (${auditDurationStr}). Total: ₹${totalAmount}.`
    });

    return res.status(201).json({
      message: 'Rental created successfully.',
      rental
    });
  } catch (err) {
    console.error('createRental error:', err);
    return res.status(500).json({ message: 'Error creating rental.' });
  }
};

// Return Bike & Calculate Late Fees
exports.returnBike = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualEndDate, endOdometer, extraLateCharge = 0, lateReason = '', notes } = req.body;

    const rental = await Rental.findById(id).populate('bike customer');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    if (rental.status === 'returned') {
      return res.status(400).json({ message: 'This rental has already been marked as returned.' });
    }

    const returnTime = actualEndDate ? new Date(actualEndDate) : new Date();
    rental.actualEndDate = returnTime;

    if (endOdometer) {
      rental.endOdometer = Number(endOdometer);
      // update bike's current odometer
      await Bike.findByIdAndUpdate(rental.bike._id, {
        currentOdometer: Number(endOdometer),
        status: 'available'
      });
    } else {
      await Bike.findByIdAndUpdate(rental.bike._id, { status: 'available' });
    }

    // Only apply extra late charge / fees if explicitly entered by the user
    const appliedLateCharge = Number(extraLateCharge) || 0;

    if (appliedLateCharge > 0) {
      rental.extraCharges = (rental.extraCharges || 0) + appliedLateCharge;
      rental.totalAmount = (rental.totalAmount || 0) + appliedLateCharge;
      rental.remainingAmount = (rental.remainingAmount || 0) + appliedLateCharge;
      const reasonText = lateReason ? lateReason : `Extra charge / late fee: ₹${appliedLateCharge}`;
      rental.extraChargesReason = rental.extraChargesReason ? `${rental.extraChargesReason}; ${reasonText}` : reasonText;
    }

    rental.status = 'returned';
    if (notes) rental.notes = rental.notes ? `${rental.notes} | ${notes}` : notes;

    await rental.save();

    await ledgerService.recordAudit({
      action: 'RENTAL_RETURNED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Rental #${rental.rentalNumber} returned. Bike ${rental.bike?.name} status set to available. Final balance: ₹${rental.remainingAmount}.`
    });

    return res.json({
      message: 'Bike returned successfully.',
      rental,
      lateFeeApplied: appliedLateCharge
    });
  } catch (err) {
    console.error('returnBike error:', err);
    return res.status(500).json({ message: 'Error marking bike returned.' });
  }
};

// Record additional payment against rental
exports.recordRentalPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'upi', receivedByPartnerId, transactionReference = '', notes = '' } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than ₹0.' });
    }

    const rental = await Rental.findById(id).populate('customer bike');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    const payVal = Number(amount);
    if (payVal > rental.remainingAmount) {
      return res.status(400).json({
        message: `Payment (₹${payVal}) cannot exceed outstanding amount (₹${rental.remainingAmount}).`
      });
    }

    let partner = null;
    if (receivedByPartnerId) {
      partner = await Partner.findById(receivedByPartnerId);
    }
    if (!partner) {
      partner = await Partner.findOne({ status: 'active' });
    }

    const receiptNumber = await getNextPaymentReceiptNumber();
    const payment = await Payment.create({
      receiptNumber,
      rental: rental._id,
      customer: rental.customer._id,
      amount: payVal,
      paymentDate: new Date(),
      paymentMethod,
      receivedByPartner: partner._id,
      transactionReference,
      notes,
      createdBy: req.user?._id
    });

    rental.amountPaid += payVal;
    rental.remainingAmount -= payVal;
    rental.paymentStatus = rental.remainingAmount <= 0 ? 'paid' : 'partially_paid';
    await rental.save();

    await ledgerService.recordPayment({
      payment,
      rental,
      customer: rental.customer,
      partner,
      userId: req.user?._id,
      userName: req.user?.name
    });

    return res.json({
      message: 'Payment recorded successfully.',
      payment,
      remainingAmount: rental.remainingAmount,
      paymentStatus: rental.paymentStatus
    });
  } catch (err) {
    console.error('recordRentalPayment error:', err);
    return res.status(500).json({ message: 'Error recording payment.' });
  }
};

// Add Extra Charges (late fee, damages, penalties, challans, etc.)
exports.addExtraCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Extra Charge', notes } = req.body;

    const chargeAmount = Number(amount);
    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({ message: 'Charge amount must be greater than ₹0.' });
    }

    const rental = await Rental.findById(id).populate('bike customer');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    rental.extraCharges = (rental.extraCharges || 0) + chargeAmount;
    rental.totalAmount = (rental.totalAmount || 0) + chargeAmount;
    rental.remainingAmount = (rental.remainingAmount || 0) + chargeAmount;

    // Update paymentStatus if balance is now remaining
    if (rental.remainingAmount > 0) {
      rental.paymentStatus = rental.amountPaid > 0 ? 'partially_paid' : 'pending';
    }

    const reasonText = reason.trim();
    rental.extraChargesReason = rental.extraChargesReason
      ? `${rental.extraChargesReason}; ${reasonText} (₹${chargeAmount})`
      : `${reasonText} (₹${chargeAmount})`;

    if (notes) {
      rental.notes = rental.notes ? `${rental.notes} | ${notes}` : notes;
    }

    await rental.save();

    await ledgerService.recordAudit({
      action: 'EXTRA_CHARGE_ADDED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Added extra charge of ₹${chargeAmount} (${reasonText}) to Rental #${rental.rentalNumber}. New total: ₹${rental.totalAmount}, Due: ₹${rental.remainingAmount}.`
    });

    return res.json({
      message: 'Extra charge added successfully.',
      rental
    });
  } catch (err) {
    console.error('addExtraCharge error:', err);
    return res.status(500).json({ message: 'Error adding extra charge.' });
  }
};

// Reopen / reactivate a rental that was mistakenly marked returned
exports.reopenRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id).populate('bike customer');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    if (rental.status !== 'returned') {
      return res.status(400).json({ message: 'Only returned rentals can be reopened.' });
    }

    rental.status = 'active';
    rental.actualEndDate = null;
    await rental.save();

    if (rental.bike) {
      await Bike.findByIdAndUpdate(rental.bike._id, { status: 'rented' });
    }

    await ledgerService.recordAudit({
      action: 'RENTAL_REOPENED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Reopened Rental #${rental.rentalNumber}. Trip active again, bike ${rental.bike?.name} status restored to rented.`
    });

    return res.json({
      message: 'Rental reopened successfully. Trip active again.',
      rental
    });
  } catch (err) {
    console.error('reopenRental error:', err);
    return res.status(500).json({ message: 'Error reopening rental.' });
  }
};

// Cancel rental
exports.cancelRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id).populate('bike');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    if (rental.status === 'returned') {
      return res.status(400).json({ message: 'Cannot cancel an already completed/returned rental.' });
    }

    rental.status = 'cancelled';
    rental.amountPaid = 0;
    rental.remainingAmount = 0;
    rental.paymentStatus = 'pending';
    await rental.save();

    // Void / remove any payments and ledger transactions recorded for this cancelled rental
    await Payment.deleteMany({ rental: rental._id });
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({
      $or: [
        { relatedId: rental._id },
        { description: { $regex: rental.rentalNumber, $options: 'i' } }
      ]
    });

    if (rental.bike) {
      await Bike.findByIdAndUpdate(rental.bike._id, { status: 'available' });
    }

    await ledgerService.recordAudit({
      action: 'RENTAL_CANCELLED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Rental #${rental.rentalNumber} was cancelled. Bike freed.`
    });

    return res.json({ message: 'Rental cancelled successfully.', rental });
  } catch (err) {
    return res.status(500).json({ message: 'Error cancelling rental.' });
  }
};

// Record or update pre-ride handover inspection & digital signatures
exports.recordHandoverInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fuelLevel = 'Full',
      odometer,
      helmetsIssued = 1,
      accessoriesIssued = 'Standard Tool Kit & Helmet',
      checklist = {},
      existingDamage = 'None',
      photos = [],
      customerSignature = '',
      guarantorSignature = '',
      representativeSignature = '',
      guarantor
    } = req.body;

    const rental = await Rental.findById(id).populate('bike customer');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    const odoValue = odometer !== undefined ? Number(odometer) : rental.startOdometer;

    rental.handoverInspection = {
      date: new Date(),
      fuelLevel,
      odometer: odoValue,
      helmetsIssued: Number(helmetsIssued),
      accessoriesIssued,
      checklist: {
        headlight: checklist.headlight ?? true,
        tailLight: checklist.tailLight ?? true,
        leftIndicator: checklist.leftIndicator ?? true,
        rightIndicator: checklist.rightIndicator ?? true,
        leftMirror: checklist.leftMirror ?? true,
        rightMirror: checklist.rightMirror ?? true,
        horn: checklist.horn ?? true,
        frontBrake: checklist.frontBrake ?? true,
        rearBrake: checklist.rearBrake ?? true,
        clutch: checklist.clutch ?? true,
        accelerator: checklist.accelerator ?? true,
        speedometer: checklist.speedometer ?? true,
        fuelTank: checklist.fuelTank ?? true,
        seat: checklist.seat ?? true,
        tyres: checklist.tyres ?? true,
        wheelsAlloy: checklist.wheelsAlloy ?? true,
        chain: checklist.chain ?? true,
        silencer: checklist.silencer ?? true,
        numberPlate: checklist.numberPlate ?? true,
        engineRunsProperly: checklist.engineRunsProperly ?? true,
        keyReceived: checklist.keyReceived ?? true,
        documentsReceived: checklist.documentsReceived ?? true,
        noUnrecordedDamage: checklist.noUnrecordedDamage ?? true,
        photosTaken: checklist.photosTaken ?? true
      },
      existingDamage: existingDamage || 'None',
      photos: Array.isArray(photos) ? photos : [],
      customerSignature: customerSignature || rental.handoverInspection?.customerSignature || '',
      guarantorSignature: guarantorSignature || rental.handoverInspection?.guarantorSignature || '',
      representativeSignature: representativeSignature || rental.handoverInspection?.representativeSignature || '',
      confirmed: true
    };

    if (guarantor) {
      rental.guarantor = {
        name: guarantor.name || rental.guarantor?.name || '',
        relation: guarantor.relation || rental.guarantor?.relation || '',
        phone: guarantor.phone || rental.guarantor?.phone || '',
        dlNumber: guarantor.dlNumber || rental.guarantor?.dlNumber || '',
        idProofNumber: guarantor.idProofNumber || rental.guarantor?.idProofNumber || '',
        address: guarantor.address || rental.guarantor?.address || '',
        confirmed: true
      };
    }

    if (odoValue && odoValue !== rental.startOdometer) {
      rental.startOdometer = odoValue;
      if (rental.bike) {
        await Bike.findByIdAndUpdate(rental.bike._id, { currentOdometer: odoValue });
      }
    }

    await rental.save();

    await ledgerService.recordAudit({
      action: 'HANDOVER_INSPECTED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Pre-ride handover inspection completed for rental #${rental.rentalNumber} (${rental.bike?.name}). Odo: ${odoValue} km, Fuel: ${fuelLevel}.`
    });

    return res.json({
      message: 'Handover inspection saved successfully.',
      rental
    });
  } catch (err) {
    console.error('recordHandoverInspection error:', err);
    return res.status(500).json({ message: 'Error recording handover inspection.' });
  }
};

// Record drop-off return inspection, auto-detect damage & optionally apply damage charges
exports.recordReturnInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fuelLevel = 'Full',
      odometer,
      checklist = {},
      damageRemarks = '',
      damageChargeAmount = 0,
      photos = [],
      customerSignature = '',
      representativeSignature = '',
      applyToRentalCharges = true
    } = req.body;

    const rental = await Rental.findById(id).populate('bike customer');
    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    // Compare with handover checklist to auto-detect new damages
    const handoverCheck = rental.handoverInspection?.checklist || {};
    const checklistKeys = [
      'headlight', 'tailLight', 'leftIndicator', 'rightIndicator',
      'leftMirror', 'rightMirror', 'horn', 'frontBrake', 'rearBrake',
      'clutch', 'accelerator', 'speedometer', 'fuelTank', 'seat',
      'tyres', 'wheelsAlloy', 'chain', 'silencer', 'numberPlate',
      'engineRunsProperly', 'keyReceived', 'documentsReceived',
      'noUnrecordedDamage', 'photosTaken'
    ];

    const newDamagesDetected = [];
    checklistKeys.forEach((key) => {
      const passedAtHandover = handoverCheck[key] !== false;
      const passedAtReturn = checklist[key] !== false;
      if (passedAtHandover && !passedAtReturn) {
        const readable = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        newDamagesDetected.push(readable);
      }
    });

    const hasDamage = newDamagesDetected.length > 0 || Number(damageChargeAmount) > 0 || Boolean(damageRemarks && damageRemarks !== 'None');

    let combinedRemarks = damageRemarks || '';
    if (newDamagesDetected.length > 0) {
      const detectedStr = `New damage detected in: ${newDamagesDetected.join(', ')}`;
      combinedRemarks = combinedRemarks ? `${combinedRemarks} | ${detectedStr}` : detectedStr;
    }

    const odoValue = odometer !== undefined ? Number(odometer) : (rental.endOdometer || rental.startOdometer);

    rental.returnInspection = {
      date: new Date(),
      fuelLevel,
      odometer: odoValue,
      checklist: {
        headlight: checklist.headlight ?? true,
        tailLight: checklist.tailLight ?? true,
        leftIndicator: checklist.leftIndicator ?? true,
        rightIndicator: checklist.rightIndicator ?? true,
        leftMirror: checklist.leftMirror ?? true,
        rightMirror: checklist.rightMirror ?? true,
        horn: checklist.horn ?? true,
        frontBrake: checklist.frontBrake ?? true,
        rearBrake: checklist.rearBrake ?? true,
        clutch: checklist.clutch ?? true,
        accelerator: checklist.accelerator ?? true,
        speedometer: checklist.speedometer ?? true,
        fuelTank: checklist.fuelTank ?? true,
        seat: checklist.seat ?? true,
        tyres: checklist.tyres ?? true,
        wheelsAlloy: checklist.wheelsAlloy ?? true,
        chain: checklist.chain ?? true,
        silencer: checklist.silencer ?? true,
        numberPlate: checklist.numberPlate ?? true,
        engineRunsProperly: checklist.engineRunsProperly ?? true,
        keyReceived: checklist.keyReceived ?? true,
        documentsReceived: checklist.documentsReceived ?? true,
        noUnrecordedDamage: checklist.noUnrecordedDamage ?? true,
        photosTaken: checklist.photosTaken ?? true
      },
      damageDetected: hasDamage,
      damageRemarks: combinedRemarks,
      damageChargeAmount: Number(damageChargeAmount) || 0,
      photos: Array.isArray(photos) ? photos : [],
      customerSignature: customerSignature || rental.returnInspection?.customerSignature || '',
      representativeSignature: representativeSignature || rental.returnInspection?.representativeSignature || '',
      confirmed: true
    };

    // If damage charge applies, update rental extra charges & balance
    const damageFee = Number(damageChargeAmount) || 0;
    if (applyToRentalCharges && damageFee > 0) {
      rental.extraCharges = (rental.extraCharges || 0) + damageFee;
      rental.totalAmount = (rental.totalAmount || 0) + damageFee;
      rental.remainingAmount = (rental.remainingAmount || 0) + damageFee;
      const damageNote = `Damage/Repair fee: ₹${damageFee} (${combinedRemarks || 'Inspection deficiency'})`;
      rental.extraChargesReason = rental.extraChargesReason ? `${rental.extraChargesReason}; ${damageNote}` : damageNote;
    }

    if (odoValue) {
      rental.endOdometer = odoValue;
      if (rental.bike) {
        await Bike.findByIdAndUpdate(rental.bike._id, { currentOdometer: odoValue });
      }
    }

    await rental.save();

    await ledgerService.recordAudit({
      action: 'RETURN_INSPECTED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Return inspection completed for #${rental.rentalNumber}. Damages: ${hasDamage ? 'YES (' + combinedRemarks + ')' : 'None'}. Damage fee: ₹${damageFee}.`
    });

    return res.json({
      message: 'Return inspection saved successfully.',
      rental,
      damageDetected: hasDamage,
      newDamagesDetected,
      damageRemarks: combinedRemarks,
      damageFeeApplied: damageFee
    });
  } catch (err) {
    console.error('recordReturnInspection error:', err);
    return res.status(500).json({ message: 'Error recording return inspection.' });
  }
};

// Generate full contract agreement payload and WhatsApp share message
exports.getRentalAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await Rental.findById(id)
      .populate('bike')
      .populate('customer')
      .populate('createdBy', 'name email');

    if (!rental) return res.status(404).json({ message: 'Rental not found.' });

    const bike = rental.bike || {};
    const customer = rental.customer || {};

    const agreementNumber = rental.agreementNumber || rental.rentalNumber.replace('TX-R-', 'TX-AGR-');

    // 8 Agreed Terms
    const agreedTerms = [
      {
        number: 1,
        title: 'Valid Licence & Lawful Use',
        text: 'The Hirer explicitly confirms possessing a valid, non-expired motorcycle driving licence issued by the competent Licensing Authority under the Motor Vehicles Act, 1988. The motorcycle shall be ridden exclusively by the registered Hirer. Sub-letting, pledging, lending, or transferring the motorcycle to any third party is strictly prohibited.'
      },
      {
        number: 2,
        title: 'Zero Tolerance for Illegal Activities',
        text: 'The motorcycle shall NOT be operated under the influence of alcohol, drugs, or any intoxicating substances. Use of the motorcycle for commercial carriage of goods/passengers, racing, stunts, burnouts, illegal conveyance, or any unlawful acts is strictly forbidden and constitutes criminal breach of trust.'
      },
      {
        number: 3,
        title: 'Strict Speed Limit & Geo-Fencing',
        text: 'The Hirer agrees to abide by all national, state, and city highway speed limits (Maximum allowable speed: 80 km/h unless lower limit marked). The Hirer acknowledges that the vehicle may be monitored via onboard GPS telemetry for safety, route conformance, and emergency fleet protection.'
      },
      {
        number: 4,
        title: 'Fuel & Operating Fluids',
        text: 'Fuel expenses are the sole liability of the Hirer. The Hirer undertakes to refill solely commercial unleaded petrol from authorized retail petrol pumps. The motorcycle must be returned with the same fuel level as recorded at handover inspection; otherwise refuel difference charges shall be deducted from the security deposit.'
      },
      {
        number: 5,
        title: 'Damage, Loss & Accident Liability',
        text: 'In event of any mechanical breakdown, tyre puncture, road accident, fall, fire, or theft, Hirer shall inform THROTTLEX 24x7 control immediately. In cases of accidental damage arising from negligence, Hirer shall bear full cost of OEM replacement parts, authorized workshop labor, towing expenses, and downtime charges at daily tariff until restoration.'
      },
      {
        number: 6,
        title: 'Traffic Fines, Challans & Impoundment',
        text: 'All traffic fines, parking challans, speeding penalties, signal violations, or municipal impoundment fees incurred between the start date/time and actual return date/time are the absolute responsibility of the Hirer. In case of police impoundment, daily rental charges continue until vehicle release.'
      },
      {
        number: 7,
        title: 'Late Return & Grace Period Policy',
        text: 'The motorcycle must be delivered back to the THROTTLEX station on or before the agreed Return Date & Time. An operational grace period of 30 minutes is permissible. Any delay beyond grace without written pre-authorization will attract standard hourly/daily extension tariff plus late fee penalty.'
      },
      {
        number: 8,
        title: 'Security Deposit Settlement',
        text: 'The refundable security deposit shall be settled post-dropoff upon technical inspection clearance and reconciliation of pending rental dues, fuel deficiency, e-challans, and damages within 2 to 24 hours via original mode of payment (UPI/Bank/Cash).'
      }
    ];

    // WhatsApp Message Generator
    const cleanCustomerPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanCustomerPhone.startsWith('91') ? cleanCustomerPhone : `91${cleanCustomerPhone}`;

    const durationText = rental.rentalType === 'hourly'
      ? `${rental.totalHours} Hour${rental.totalHours > 1 ? 's' : ''}`
      : `${rental.totalDays} Day${rental.totalDays > 1 ? 's' : ''}`;

    const waText = [
      `*THROTTLEX BIKE RENTAL AGREEMENT*`,
      `*OWN THE ROAD.*`,
      `---------------------------------`,
      `*Agreement No:* ${agreementNumber}`,
      `*Rental No:* #${rental.rentalNumber}`,
      `*Customer:* ${customer.name} (${customer.phone})`,
      `*Bike:* ${bike.name} (${bike.registrationNumber})`,
      `*Plan:* ${rental.rentalType === 'hourly' ? 'Hourly' : 'Daily'} (${durationText})`,
      `*Start:* ${new Date(rental.startDate).toLocaleString('en-IN')}`,
      `*Return:* ${new Date(rental.expectedEndDate).toLocaleString('en-IN')}`,
      `*Start Odo:* ${rental.startOdometer || bike.currentOdometer || 0} km`,
      `*Fuel Level:* ${rental.handoverInspection?.fuelLevel || 'Full'}`,
      `---------------------------------`,
      `*Total Rent:* ₹${rental.totalAmount}`,
      `*Advance Paid:* ₹${rental.amountPaid}`,
      `*Deposit:* ₹${rental.securityDeposit}`,
      `*Balance Due:* ₹${rental.remainingAmount}`,
      `---------------------------------`,
      `*Terms & Conditions:* Agreed to all 8 standard THROTTLEX rental terms including valid licence, zero substance use, safe speed limit, and accident liability.`,
      `_Drive safe & wear helmet at all times!_`,
      `_THROTTLEX Support: +91 99999 99999_`
    ].join('\n');

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(waText)}`;

    return res.json({
      agreementNumber,
      rental,
      bike,
      customer,
      guarantor: rental.guarantor || customer.guarantor || {},
      handoverInspection: rental.handoverInspection || {},
      returnInspection: rental.returnInspection || {},
      agreedTerms,
      summaryText: waText,
      whatsappUrl
    });
  } catch (err) {
    console.error('getRentalAgreement error:', err);
    return res.status(500).json({ message: 'Error generating rental agreement.' });
  }
};
