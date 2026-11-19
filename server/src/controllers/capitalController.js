const CapitalInvestment = require('../models/CapitalInvestment');
const Partner = require('../models/Partner');
const Bike = require('../models/Bike');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const { getNextInvestmentNumber, getNextTransactionNumber } = require('../utils/idGenerator');

exports.getCapitalOverview = async (req, res) => {
  try {
    const [partners, investments, bikes] = await Promise.all([
      Partner.find({ status: 'active' }).lean(),
      CapitalInvestment.find()
        .populate('partner', 'name avatar email phone')
        .populate('bike', 'name registrationNumber brand model')
        .sort({ investmentDate: -1 })
        .lean(),
      Bike.find({ status: { $ne: 'inactive' } }).lean()
    ]);

    // Calculate Partner Capital and Dynamic Ownership
    const partnerCapitalMap = {};
    let totalCapital = 0;

    partners.forEach((p) => {
      const id = p._id.toString();
      const initial = Number(p.initialCapital || 0);
      partnerCapitalMap[id] = {
        partnerId: p._id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        initialCapital: initial,
        directInvestments: 0,
        totalCapital: initial,
        configuredSharePercentage: p.sharePercentage || 0,
        ownershipPercentage: 0
      };
      totalCapital += initial;
    });

    investments.forEach((ci) => {
      const pId = ci.partner?._id ? ci.partner._id.toString() : ci.partner ? ci.partner.toString() : null;
      if (pId && partnerCapitalMap[pId]) {
        partnerCapitalMap[pId].directInvestments += Number(ci.amount || 0);
        partnerCapitalMap[pId].totalCapital += Number(ci.amount || 0);
        totalCapital += Number(ci.amount || 0);
      }
    });

    // Compute dynamic ownership %
    Object.values(partnerCapitalMap).forEach((p) => {
      p.ownershipPercentage = totalCapital > 0
        ? Number(((p.totalCapital / totalCapital) * 100).toFixed(2))
        : Number((100 / partners.length).toFixed(2));
    });

    // Bike-level Capital Breakdown (Asset Ownership)
    const bikeCapitalMap = {};
    bikes.forEach((b) => {
      bikeCapitalMap[b._id.toString()] = {
        bikeId: b._id,
        name: b.name,
        registrationNumber: b.registrationNumber,
        brand: b.brand,
        model: b.model,
        purchasePrice: Number(b.purchasePrice || 0),
        totalFunded: 0,
        partners: {}
      };
    });

    investments.forEach((ci) => {
      const bId = ci.bike?._id ? ci.bike._id.toString() : ci.bike ? ci.bike.toString() : null;
      const pId = ci.partner?._id ? ci.partner._id.toString() : null;
      if (bId && bikeCapitalMap[bId] && pId) {
        bikeCapitalMap[bId].totalFunded += Number(ci.amount || 0);
        if (!bikeCapitalMap[bId].partners[pId]) {
          bikeCapitalMap[bId].partners[pId] = {
            partnerId: pId,
            partnerName: ci.partner?.name || 'Partner',
            amount: 0,
            percentage: 0
          };
        }
        bikeCapitalMap[bId].partners[pId].amount += Number(ci.amount || 0);
      }
    });

    const bikeInvestments = Object.values(bikeCapitalMap)
      .filter((b) => b.totalFunded > 0 || b.purchasePrice > 0)
      .map((b) => {
        const fundingBase = b.totalFunded > 0 ? b.totalFunded : b.purchasePrice;
        const partnersList = Object.values(b.partners).map((p) => ({
          ...p,
          percentage: fundingBase > 0 ? Number(((p.amount / fundingBase) * 100).toFixed(2)) : 0
        }));
        return {
          ...b,
          partners: partnersList
        };
      });

    return res.json({
      totalCapital,
      partners: Object.values(partnerCapitalMap),
      bikeInvestments,
      investments
    });
  } catch (err) {
    console.error('getCapitalOverview error:', err);
    return res.status(500).json({ message: 'Error retrieving capital & investment overview.' });
  }
};

exports.createInvestment = async (req, res) => {
  try {
    const {
      partnerId,
      amount,
      type = 'bike_purchase',
      bikeId,
      paymentMethod = 'bank_transfer',
      investmentDate = new Date(),
      reference = '',
      notes = '',
      syncProfitShare = false
    } = req.body;

    if (!partnerId) return res.status(400).json({ message: 'Partner is required.' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Valid investment amount is required.' });

    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: 'Partner not found.' });

    let bike = null;
    if (bikeId) {
      bike = await Bike.findById(bikeId);
    }

    const investmentNumber = await getNextInvestmentNumber();

    const investment = await CapitalInvestment.create({
      investmentNumber,
      partner: partnerId,
      amount: Number(amount),
      type,
      bike: bikeId || null,
      paymentMethod,
      investmentDate: new Date(investmentDate),
      reference: reference || '',
      notes: notes || '',
      createdBy: req.user?._id
    });

    // Record into Ledger Transactions
    const transactionNumber = await getNextTransactionNumber();
    await Transaction.create({
      transactionNumber,
      date: new Date(investmentDate),
      type: 'partner_contribution',
      amount: Number(amount),
      description: `Capital Contribution: ${partner.name} invested ₹${Number(amount).toLocaleString('en-IN')} (${type.replace('_', ' ').toUpperCase()}${bike ? ` - ${bike.name}` : ''})`,
      paidByPartner: partnerId,
      bike: bikeId || null,
      paymentMethod,
      relatedId: investment._id,
      relatedModel: 'CapitalInvestment',
      balanceImpact: 'credit'
    });

    // Audit Log
    await AuditLog.create({
      action: 'CAPITAL_INVESTMENT_RECORDED',
      entityType: 'CapitalInvestment',
      entityId: investment._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `${partner.name} invested ₹${Number(amount).toLocaleString('en-IN')} for ${type.replace('_', ' ')}.`
    });

    // Optionally sync profit share percentage with dynamic capital ownership
    let syncedRatios = null;
    if (syncProfitShare) {
      syncedRatios = await syncCapitalToSharePercentages();
    }

    const populated = await CapitalInvestment.findById(investment._id)
      .populate('partner', 'name avatar')
      .populate('bike', 'name registrationNumber');

    return res.status(201).json({
      message: 'Capital investment recorded successfully.',
      investment: populated,
      syncedRatios
    });
  } catch (err) {
    console.error('createInvestment error:', err);
    return res.status(500).json({ message: err.message || 'Error recording investment.' });
  }
};

exports.syncOwnershipRatios = async (req, res) => {
  try {
    const updatedPartners = await syncCapitalToSharePercentages();
    return res.json({
      message: 'Capital ownership percentages successfully applied to profit sharing!',
      partners: updatedPartners
    });
  } catch (err) {
    console.error('syncOwnershipRatios error:', err);
    return res.status(500).json({ message: 'Error applying ownership ratios to profit sharing.' });
  }
};

exports.deleteInvestment = async (req, res) => {
  try {
    const investment = await CapitalInvestment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investment not found.' });

    await CapitalInvestment.findByIdAndDelete(req.params.id);
    await Transaction.deleteMany({ relatedId: investment._id });

    return res.json({ message: 'Investment deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting investment.' });
  }
};

// Helper: Synchronize partner share percentages to match actual capital ownership
async function syncCapitalToSharePercentages() {
  const partners = await Partner.find({ status: 'active' });
  const investments = await CapitalInvestment.find();

  let totalCapital = 0;
  const partnerCapital = {};

  partners.forEach((p) => {
    const id = p._id.toString();
    const init = Number(p.initialCapital || 0);
    partnerCapital[id] = init;
    totalCapital += init;
  });

  investments.forEach((ci) => {
    const pId = ci.partner.toString();
    if (partnerCapital[pId] !== undefined) {
      partnerCapital[pId] += Number(ci.amount || 0);
      totalCapital += Number(ci.amount || 0);
    }
  });

  if (totalCapital <= 0) return [];

  const updatedPartners = [];
  for (const partner of partners) {
    const pId = partner._id.toString();
    const myCapital = partnerCapital[pId] || 0;
    const computedPercentage = Number(((myCapital / totalCapital) * 100).toFixed(2));
    partner.sharePercentage = computedPercentage;
    await partner.save();
    updatedPartners.push({
      partnerId: partner._id,
      name: partner.name,
      totalCapital: myCapital,
      sharePercentage: computedPercentage
    });
  }

  return updatedPartners;
}
