const Settlement = require('../models/Settlement');
const settlementService = require('../services/settlementService');

exports.getSettlementOverview = async (req, res) => {
  try {
    const balances = await settlementService.getPartnerBalances();
    const history = await Settlement.find()
      .populate('senderPartner', 'name email avatar')
      .populate('receiverPartner', 'name email avatar')
      .populate('settledBy', 'name')
      .sort({ settlementDate: -1, createdAt: -1 })
      .lean();

    return res.json({
      balances,
      history
    });
  } catch (err) {
    console.error('getSettlementOverview error:', err);
    return res.status(500).json({ message: 'Error fetching settlements.' });
  }
};

exports.recordSettlement = async (req, res) => {
  try {
    const { senderPartnerId, receiverPartnerId, amount, paymentMethod = 'upi', reference = '', notes = '' } = req.body;

    const settlement = await settlementService.recordSettlement({
      senderPartnerId,
      receiverPartnerId,
      amount: Number(amount),
      paymentMethod,
      reference,
      notes,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner'
    });

    const updatedBalances = await settlementService.getPartnerBalances();

    return res.status(201).json({
      message: 'Settlement recorded successfully.',
      settlement,
      updatedBalances
    });
  } catch (err) {
    console.error('recordSettlement error:', err);
    return res.status(400).json({ message: err.message || 'Error recording settlement.' });
  }
};
