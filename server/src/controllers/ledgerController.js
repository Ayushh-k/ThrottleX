const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

exports.getAllTransactions = async (req, res) => {
  try {
    const { type, bikeId, partnerId, paymentMethod, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (type && type !== 'all') filter.type = type;
    if (bikeId && bikeId !== 'all') filter.bike = bikeId;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    if (partnerId && partnerId !== 'all') {
      filter.$or = [
        { paidByPartner: partnerId },
        { receivedByPartner: partnerId }
      ];
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('bike', 'name registrationNumber')
      .populate('paidByPartner', 'name avatar')
      .populate('receivedByPartner', 'name avatar')
      .populate('customer', 'name phone')
      .sort({ date: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    return res.json({
      transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('getAllTransactions error:', err);
    return res.status(500).json({ message: 'Error retrieving ledger transactions.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching audit logs.' });
  }
};
