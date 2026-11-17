const Rental = require('../models/Rental');
const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Partner = require('../models/Partner');
const Settings = require('../models/Settings');
const ledgerService = require('../services/ledgerService');

// Helper to check if bike is available during requested dates
async function checkBikeAvailability(bikeId, startDate, endDate, excludeRentalId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);

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

    const conflicting = await checkBikeAvailability(bikeId, startDate, endDate);
    if (conflicting) {
      // Find other available bikes for these dates
      const allActiveBikes = await Bike.find({ _id: { $ne: bikeId }, status: { $ne: 'inactive' } }).lean();
      const alternatives = [];

      for (const b of allActiveBikes) {
        const overlap = await checkBikeAvailability(b._id, startDate, endDate);
        if (!overlap) {
          alternatives.push({
            id: b._id,
            name: b.name,
            brand: b.brand,
            model: b.model,
            defaultDailyRate: b.defaultDailyRate,
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
    const { status, paymentStatus, bikeId, customerId, search, startDate, endDate } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
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
      .populate('bike', 'name brand model registrationNumber defaultDailyRate imageUrl')
      .populate('customer', 'name phone email dlNumber')
      .sort({ createdAt: -1 })
      .lean();

    if (search) {
      const q = search.toLowerCase();
      const filtered = rentals.filter((r) => {
        return (
          r.rentalNumber?.toLowerCase().includes(q) ||
          r.bike?.name?.toLowerCase().includes(q) ||
          r.bike?.registrationNumber?.toLowerCase().includes(q) ||
          r.customer?.name?.toLowerCase().includes(q) ||
          r.customer?.phone?.includes(q)
        );
      });
      return res.json({ rentals: filtered });
    }

    return res.json({ rentals });
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
      dailyRate,
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

    // Calculate duration in days (minimum 1 day)
    const diffMs = expectedEnd - start;
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const rate = Number(dailyRate) || bike.defaultDailyRate;
    const subtotal = diffDays * rate;
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

    const count = await Rental.countDocuments();
    const rentalNumber = `TX-R-${1001 + count}`;

    const rental = await Rental.create({
      rentalNumber,
      bike: bike._id,
      customer: customer._id,
      startDate: start,
      expectedEndDate: expectedEnd,
      dailyRate: rate,
      totalDays: diffDays,
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

      const payCount = await Payment.countDocuments();
      const payment = await Payment.create({
        receiptNumber: `TX-PAY-${1001 + payCount}`,
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

    await ledgerService.recordAudit({
      action: 'RENTAL_CREATED',
      entityType: 'Rental',
      entityId: rental._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Created rental #${rental.rentalNumber} for ${customer.name} on ${bike.name} (${diffDays} days @ ₹${rate}/day). Total: ₹${totalAmount}.`
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

    // Calculate late fees if applicable
    const settings = await Settings.findOne() || { gracePeriodHours: 2, hourlyLateFee: 100, extraDayFee: 1000 };
    const expectedEnd = new Date(rental.expectedEndDate);
    const diffMs = returnTime - expectedEnd;
    const graceMs = (settings.gracePeriodHours || 2) * 60 * 60 * 1000;

    let computedLateFee = Number(extraLateCharge) || 0;
    if (diffMs > graceMs && computedLateFee === 0) {
      const lateHours = Math.ceil((diffMs - graceMs) / (1000 * 60 * 60));
      if (lateHours >= 12) {
        // Charge extra day
        const extraDays = Math.ceil(lateHours / 24);
        computedLateFee = extraDays * (settings.extraDayFee || rental.dailyRate);
        rental.extraChargesReason = (rental.extraChargesReason ? rental.extraChargesReason + '; ' : '') + `Late return by ${lateHours} hrs (${extraDays} day fee)`;
      } else {
        computedLateFee = lateHours * (settings.hourlyLateFee || 100);
        rental.extraChargesReason = (rental.extraChargesReason ? rental.extraChargesReason + '; ' : '') + `Late return by ${lateHours} hrs`;
      }
    }

    if (computedLateFee > 0) {
      rental.extraCharges += computedLateFee;
      rental.totalAmount += computedLateFee;
      rental.remainingAmount += computedLateFee;
      if (lateReason) {
        rental.extraChargesReason = (rental.extraChargesReason ? rental.extraChargesReason + '; ' : '') + lateReason;
      }
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
      lateFeeApplied: computedLateFee
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

    const count = await Payment.countDocuments();
    const payment = await Payment.create({
      receiptNumber: `TX-PAY-${1001 + count}`,
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
    await rental.save();

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
