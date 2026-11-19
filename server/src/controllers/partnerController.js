const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const settlementService = require('../services/settlementService');
const ledgerService = require('../services/ledgerService');

exports.getAllPartners = async (req, res) => {
  try {
    const data = await settlementService.getPartnerBalances();
    return res.json(data);
  } catch (err) {
    console.error('getAllPartners error:', err);
    return res.status(500).json({ message: 'Error retrieving partners.' });
  }
};

exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    const data = await settlementService.getPartnerBalances();
    const partnerStats = data.partners.find((p) => p.partnerId.toString() === partner._id.toString()) || {};

    const Rental = require('../models/Rental');
    const validRentals = await Rental.find({ status: { $ne: 'cancelled' } }).distinct('_id');

    const paymentsCollected = await Payment.find({
      receivedByPartner: partner._id,
      rental: { $in: validRentals }
    })
      .populate('rental customer')
      .sort({ paymentDate: -1 })
      .lean();

    const expensesPaid = await Expense.find({ paidByPartner: partner._id })
      .populate('bike')
      .sort({ expenseDate: -1 })
      .lean();

    const settlementsSent = await Settlement.find({ senderPartner: partner._id, status: 'completed' })
      .populate('receiverPartner', 'name avatar')
      .sort({ settlementDate: -1 })
      .lean();

    const settlementsReceived = await Settlement.find({ receiverPartner: partner._id, status: 'completed' })
      .populate('senderPartner', 'name avatar')
      .sort({ settlementDate: -1 })
      .lean();

    return res.json({
      partner,
      stats: partnerStats,
      paymentsCollected,
      expensesPaid,
      settlementsSent,
      settlementsReceived
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching partner profile.' });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const { name, email, phone, sharePercentage, initialCapital, notes, password } = req.body;
    if (!name) return res.status(400).json({ message: 'Partner name is required.' });

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanName = name.trim();

    const partner = await Partner.create({
      name: cleanName,
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      sharePercentage: Number(sharePercentage) || 50,
      initialCapital: Number(initialCapital) || 0,
      notes: notes || ''
    });

    // Create User login account for the partner if email is provided
    let userCreated = false;
    if (cleanEmail) {
      const partnerPassword = password && password.trim()
        ? password.trim()
        : `${cleanName.split(' ')[0].toLowerCase()}@tx123`;

      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          name: cleanName,
          email: cleanEmail,
          password: partnerPassword,
          phone: partner.phone,
          role: 'partner',
          partnerId: partner._id
        });
        userCreated = true;
      } else {
        user.partnerId = partner._id;
        if (password && password.trim()) user.password = password.trim();
        await user.save();
        userCreated = true;
      }
      partner.userId = user._id;
      await partner.save();
    }

    await ledgerService.recordAudit({
      action: 'PARTNER_ADDED',
      entityType: 'Partner',
      entityId: partner._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Added new partner ${partner.name} with ${partner.sharePercentage}% profit share.${userCreated ? ' Login access enabled.' : ''}`
    });

    return res.status(201).json({ message: 'Partner added successfully.', partner });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating partner.' });
  }
};

exports.setPartnerLoginAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const partner = await Partner.findById(id);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    const loginEmail = (email || partner.email || '').trim().toLowerCase();
    if (!loginEmail) {
      return res.status(400).json({ message: 'A valid email address is required for partner login.' });
    }

    partner.email = loginEmail;
    await partner.save();

    let user = await User.findOne({
      $or: [{ partnerId: partner._id }, { email: loginEmail }]
    });

    if (user) {
      user.email = loginEmail;
      user.name = partner.name;
      user.password = password.trim();
      user.partnerId = partner._id;
      if (user.role !== 'owner') user.role = 'partner';
      await user.save();
    } else {
      user = await User.create({
        name: partner.name,
        email: loginEmail,
        password: password.trim(),
        phone: partner.phone || '',
        role: 'partner',
        partnerId: partner._id
      });
    }

    partner.userId = user._id;
    await partner.save();

    await ledgerService.recordAudit({
      action: 'PARTNER_LOGIN_CONFIGURED',
      entityType: 'Partner',
      entityId: partner._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Configured login credentials for partner ${partner.name} (${loginEmail}).`
    });

    return res.json({
      message: `Login access configured successfully for ${partner.name}.`,
      partnerId: partner._id,
      email: loginEmail
    });
  } catch (err) {
    console.error('setPartnerLoginAccess error:', err);
    return res.status(500).json({ message: 'Error configuring partner login credentials.' });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    const updates = req.body;
    Object.assign(partner, updates);
    await partner.save();

    await ledgerService.recordAudit({
      action: 'PARTNER_UPDATED',
      entityType: 'Partner',
      entityId: partner._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Updated partner profile for ${partner.name}.`
    });

    return res.json({ message: 'Partner updated successfully.', partner });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating partner.' });
  }
};

exports.getPartnerWallet = async (req, res) => {
  try {
    const data = await settlementService.getPartnerVirtualLedger(req.params.id);
    return res.json(data);
  } catch (err) {
    console.error('getPartnerWallet error:', err);
    return res.status(500).json({ message: err.message || 'Error fetching partner wallet.' });
  }
};
