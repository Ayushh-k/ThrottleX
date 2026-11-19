const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const ledgerService = require('../services/ledgerService');

// Get all customers with computed financial metrics
exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { dlNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(
      customers.map(async (c) => {
        const rentals = await Rental.find({ customer: c._id, status: { $ne: 'cancelled' } }).lean();
        const totalSpent = rentals.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
        const outstanding = rentals.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

        const now = new Date();
        const dlExp = c.dlExpiryDate ? new Date(c.dlExpiryDate) : null;
        const isDlExpired = dlExp ? dlExp < now : false;
        const daysToDlExpiry = dlExp ? Math.ceil((dlExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isExpiringSoon = dlExp && !isDlExpired && daysToDlExpiry <= 30;

        return {
          ...c,
          totalRentals: rentals.length,
          totalSpent,
          outstanding,
          isDlExpired,
          daysToDlExpiry,
          isExpiringSoon,
          hasPhoto: Boolean(c.photoUrl),
          hasDlPhoto: Boolean(c.dlPhotoUrl),
          hasIdPhoto: Boolean(c.aadhaarPhotoUrl)
        };
      })
    );

    return res.json({ customers: enriched });
  } catch (err) {
    console.error('getAllCustomers error:', err);
    return res.status(500).json({ message: 'Error fetching customers.' });
  }
};

// Get single customer profile with full history
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const rentals = await Rental.find({ customer: customer._id })
      .populate('bike', 'name brand model registrationNumber defaultDailyRate imageUrl')
      .sort({ startDate: -1 })
      .lean();

    const validRentalIds = rentals.filter((r) => r.status !== 'cancelled').map((r) => r._id);
    const payments = await Payment.find({ customer: customer._id, rental: { $in: validRentalIds } })
      .populate('rental', 'rentalNumber')
      .populate('receivedByPartner', 'name')
      .sort({ paymentDate: -1 })
      .lean();

    const totalBilled = rentals.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalPaid = rentals.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const outstanding = rentals.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

    return res.json({
      customer,
      stats: {
        totalRentals: rentals.length,
        totalBilled,
        totalPaid,
        outstanding
      },
      rentals,
      payments
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching customer profile.' });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      fatherName,
      altPhone,
      dob,
      currentAddress,
      permanentAddress,
      address,
      emergencyContact,
      dlNumber,
      dlExpiryDate,
      idProofType,
      idProofNumber,
      idProofExpiryDate,
      panNumber,
      collegeId,
      photoUrl,
      dlPhotoUrl,
      dlBackPhotoUrl,
      aadhaarPhotoUrl,
      aadhaarBackPhotoUrl,
      riskStatus,
      blockedReason,
      guarantor,
      notes
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Customer name and phone number are required.' });
    }

    const cleanPhone = phone.trim();
    const existing = await Customer.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ message: `Customer with phone ${cleanPhone} already exists.` });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      fatherName: fatherName || '',
      altPhone: altPhone || '',
      dob: dob ? new Date(dob) : undefined,
      currentAddress: currentAddress || address || '',
      permanentAddress: permanentAddress || currentAddress || address || '',
      address: currentAddress || address || '',
      emergencyContact: emergencyContact || '',
      dlNumber: dlNumber ? dlNumber.trim().toUpperCase() : '',
      dlExpiryDate: dlExpiryDate ? new Date(dlExpiryDate) : undefined,
      idProofType: idProofType || 'Aadhaar',
      idProofNumber: idProofNumber ? idProofNumber.trim().toUpperCase() : '',
      idProofExpiryDate: idProofExpiryDate ? new Date(idProofExpiryDate) : undefined,
      panNumber: panNumber ? panNumber.trim().toUpperCase() : '',
      collegeId: collegeId || '',
      photoUrl: photoUrl || '',
      dlPhotoUrl: dlPhotoUrl || '',
      dlBackPhotoUrl: dlBackPhotoUrl || '',
      aadhaarPhotoUrl: aadhaarPhotoUrl || '',
      aadhaarBackPhotoUrl: aadhaarBackPhotoUrl || '',
      riskStatus: riskStatus || 'verified',
      blockedReason: blockedReason || '',
      guarantor: guarantor || {},
      notes: notes || ''
    });

    await ledgerService.recordAudit({
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Created customer profile for ${customer.name} (${customer.phone}) with KYC.`
    });

    return res.status(201).json({ message: 'Customer created successfully.', customer });
  } catch (err) {
    console.error('createCustomer error:', err);
    return res.status(500).json({ message: err.message || 'Error creating customer.' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const updates = req.body;
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.dlNumber) updates.dlNumber = updates.dlNumber.trim().toUpperCase();

    Object.assign(customer, updates);
    await customer.save();

    return res.json({ message: 'Customer updated successfully.', customer });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating customer.' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const activeRental = await Rental.findOne({ customer: req.params.id, status: 'active' });
    if (activeRental) {
      return res.status(400).json({ message: 'Cannot delete customer with active rentals.' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Customer removed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error removing customer.' });
  }
};
