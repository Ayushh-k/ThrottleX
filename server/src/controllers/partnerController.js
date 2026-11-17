const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
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

    const paymentsCollected = await Payment.find({ receivedByPartner: partner._id })
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
    const { name, email, phone, sharePercentage, initialCapital, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Partner name is required.' });

    const partner = await Partner.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      sharePercentage: Number(sharePercentage) || 50,
      initialCapital: Number(initialCapital) || 0,
      notes: notes || ''
    });

    await ledgerService.recordAudit({
      action: 'PARTNER_ADDED',
      entityType: 'Partner',
      entityId: partner._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Added new partner ${partner.name} with ${partner.sharePercentage}% profit share.`
    });

    return res.status(201).json({ message: 'Partner added successfully.', partner });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating partner.' });
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
