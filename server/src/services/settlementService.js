const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const CapitalInvestment = require('../models/CapitalInvestment');
const { getNextSettlementNumber, getNextTransactionNumber } = require('../utils/idGenerator');

// Generalized Debt Solver (Splitwise minimum transaction algorithm)
function resolveDebts(debtors, creditors, type, typeLabel) {
  const dList = debtors.map((d) => ({ ...d }));
  const cList = creditors.map((c) => ({ ...c }));
  dList.sort((a, b) => b.owe - a.owe);
  cList.sort((a, b) => b.toReceive - a.toReceive);

  const recommendations = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < dList.length && cIdx < cList.length) {
    const debtor = dList[dIdx];
    const creditor = cList[cIdx];
    const settleAmount = Math.min(debtor.owe, creditor.toReceive);

    if (settleAmount >= 1) {
      recommendations.push({
        settlementType: type,
        typeLabel,
        senderPartnerId: debtor.partnerId,
        senderName: debtor.name,
        receiverPartnerId: creditor.partnerId,
        receiverName: creditor.name,
        amount: Math.round(settleAmount),
        label: `${debtor.name} → Pay ${creditor.name} ₹${Math.round(settleAmount).toLocaleString('en-IN')}`
      });

      debtor.owe -= settleAmount;
      creditor.toReceive -= settleAmount;
    }

    if (debtor.owe < 1) dIdx++;
    if (creditor.toReceive < 1) cIdx++;
  }

  return recommendations;
}

class SettlementService {
  /**
   * Calculate partner contributions, cash in hand, entitled profit,
   * keeping Rent Revenue Settlements and Business Expense Settlements completely independent.
   */
  async getPartnerBalances() {
    const partners = await Partner.find({ status: 'active' }).lean();
    if (!partners.length) {
      return {
        partners: [],
        totalRevenueCollected: 0,
        totalExpensesPaid: 0,
        realizedProfit: 0,
        totalSettlementsDone: 0,
        rentRecommendations: [],
        expenseRecommendations: [],
        recommendations: []
      };
    }

    // Default share normalization if sum != 100
    const totalShareSpecified = partners.reduce((sum, p) => sum + (p.sharePercentage || 0), 0);
    const normalizedPartners = partners.map((p) => ({
      ...p,
      effectiveShare:
        totalShareSpecified > 0
          ? ((p.sharePercentage || 100 / partners.length) / totalShareSpecified) * 100
          : 100 / partners.length
    }));

    // Map user accounts to see which partners have login credentials
    const users = await User.find().lean();
    const userPartnerMap = {};
    users.forEach((u) => {
      if (u.partnerId) userPartnerMap[u.partnerId.toString()] = u;
      if (u.email) userPartnerMap[u.email.toLowerCase().trim()] = u;
    });

    // Self-healing purge: void any payments belonging to cancelled rentals
    const cancelledRentalIds = await Rental.find({ status: 'cancelled' }).distinct('_id');
    if (cancelledRentalIds.length > 0) {
      await Payment.deleteMany({ rental: { $in: cancelledRentalIds } });
    }

    // 1. Total rent payments collected by each partner (ONLY from valid non-cancelled rentals)
    const validRentals = await Rental.find({ status: { $ne: 'cancelled' } }).distinct('_id');
    const payments = await Payment.find({ rental: { $in: validRentals } }).lean();
    const rentCollections = {};
    let totalRevenueCollected = 0;

    payments.forEach((pay) => {
      const pId = pay.receivedByPartner ? pay.receivedByPartner.toString() : null;
      if (pId) {
        rentCollections[pId] = (rentCollections[pId] || 0) + (pay.amount || 0);
        totalRevenueCollected += pay.amount || 0;
      }
    });

    // 2. Total business expenses paid out-of-pocket by each partner
    const expenses = await Expense.find().lean();
    const expensePayments = {};
    let totalExpensesPaid = 0;

    expenses.forEach((exp) => {
      const pId = exp.paidByPartner ? exp.paidByPartner.toString() : null;
      if (pId) {
        expensePayments[pId] = (expensePayments[pId] || 0) + (exp.amount || 0);
        totalExpensesPaid += exp.amount || 0;
      }
    });

    // 3. Capital Investments contributed by each partner
    const capitalInvestments = await CapitalInvestment.find().lean();
    const partnerCapitalMap = {};
    let totalCapitalInvested = 0;

    capitalInvestments.forEach((ci) => {
      const pId = ci.partner ? ci.partner.toString() : null;
      if (pId) {
        partnerCapitalMap[pId] = (partnerCapitalMap[pId] || 0) + (ci.amount || 0);
        totalCapitalInvested += ci.amount || 0;
      }
    });

    partners.forEach((p) => {
      const id = p._id.toString();
      const initial = p.initialCapital || 0;
      partnerCapitalMap[id] = (partnerCapitalMap[id] || 0) + initial;
      totalCapitalInvested += initial;
    });

    // 4. Completed settlements separated by type: 'rent', 'expense', or 'all'
    const settlements = await Settlement.find({ status: 'completed' }).lean();
    const rentSent = {};
    const rentRecv = {};
    const expSent = {};
    const expRecv = {};
    const allSent = {};
    const allRecv = {};
    let totalSettlementsDone = 0;

    settlements.forEach((s) => {
      const sId = s.senderPartner ? s.senderPartner.toString() : null;
      const rId = s.receiverPartner ? s.receiverPartner.toString() : null;
      const type = s.settlementType || 'rent';
      const amt = s.amount || 0;
      totalSettlementsDone += amt;

      if (sId && rId) {
        if (type === 'rent') {
          rentSent[sId] = (rentSent[sId] || 0) + amt;
          rentRecv[rId] = (rentRecv[rId] || 0) + amt;
        } else if (type === 'expense') {
          expSent[sId] = (expSent[sId] || 0) + amt;
          expRecv[rId] = (expRecv[rId] || 0) + amt;
        } else {
          allSent[sId] = (allSent[sId] || 0) + amt;
          allRecv[rId] = (allRecv[rId] || 0) + amt;
        }
      }
    });

    // 4. Calculate Net Realized Business Profit
    const realizedProfit = totalRevenueCollected - totalExpensesPaid;

    // 5. Compute metrics per partner: Rent and Expense are calculated independently
    const partnerMetrics = normalizedPartners.map((p) => {
      const id = p._id.toString();
      const share = p.effectiveShare / 100;

      // --- RENT POSITION ---
      const collected = rentCollections[id] || 0;
      const entitledRent = Math.round(totalRevenueCollected * share * 100) / 100;
      const rS = rentSent[id] || 0;
      const rR = rentRecv[id] || 0;
      const netRentInHand = collected - rS + rR;
      // Balance: Entitled - NetRentInHand (>0: receivable from partner, <0: payable to partner)
      const rentBalance = Math.round((entitledRent - netRentInHand) * 100) / 100;

      // --- EXPENSE POSITION ---
      const paid = expensePayments[id] || 0;
      const fairExpenseShare = Math.round(totalExpensesPaid * share * 100) / 100;
      const eS = expSent[id] || 0;
      const eR = expRecv[id] || 0;
      const netExpenseBorne = paid + eS - eR;
      // Balance: NetExpenseBorne - FairShare (>0: partner overpaid, receivable reimbursement; <0: partner underpaid, owes reimbursement)
      const expenseBalance = Math.round((netExpenseBorne - fairExpenseShare) * 100) / 100;

      // --- COMBINED NET POSITION ---
      const netEntitledProfit = entitledRent - fairExpenseShare;
      const totalSent = rS + eS + (allSent[id] || 0);
      const totalRecv = rR + eR + (allRecv[id] || 0);
      const totalCashHeld = collected - paid - totalSent + totalRecv;
      const combinedBalance = Math.round((netEntitledProfit - totalCashHeld) * 100) / 100;

      const userAccount = userPartnerMap[id] || (p.email ? userPartnerMap[p.email.toLowerCase().trim()] : null);
      const totalInvested = partnerCapitalMap[id] || 0;
      const ownershipRatio = totalCapitalInvested > 0
        ? Number(((totalInvested / totalCapitalInvested) * 100).toFixed(2))
        : Number(p.effectiveShare.toFixed(2));

      return {
        partnerId: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        avatar: p.avatar,
        sharePercentage: p.effectiveShare,
        ownershipPercentage: ownershipRatio,
        hasLoginAccess: Boolean(userAccount),
        loginEmail: userAccount?.email || p.email,
        userRole: userAccount?.role || (p.email === 'ayushkamboj9690@gmail.com' ? 'owner' : 'partner'),

        // Dedicated Virtual Wallet
        wallet: {
          invested: totalInvested,
          expensesPaid: paid,
          revenueCollected: collected,
          profitShare: Math.round(netEntitledProfit * 100) / 100,
          currentBalance: combinedBalance,
          status: combinedBalance > 0.01 ? 'receivable' : combinedBalance < -0.01 ? 'payable' : 'settled',
          ownershipPercentage: ownershipRatio
        },

        // Independent Rent Breakdown
        rent: {
          collected,
          entitled: entitledRent,
          settlementsSent: rS,
          settlementsReceived: rR,
          netInHand: netRentInHand,
          balance: rentBalance,
          status: rentBalance > 0.01 ? 'receivable' : rentBalance < -0.01 ? 'payable' : 'settled'
        },

        // Independent Expense Breakdown
        expense: {
          paid,
          fairShare: fairExpenseShare,
          settlementsSent: eS,
          settlementsReceived: eR,
          netBorne: netExpenseBorne,
          balance: expenseBalance,
          status: expenseBalance > 0.01 ? 'receivable' : expenseBalance < -0.01 ? 'payable' : 'settled'
        },

        // Combined Net (backward compatibility & master totals)
        totalCollected: collected,
        totalExpensesPaid: paid,
        settlementsSent: totalSent,
        settlementsReceived: totalRecv,
        netCashHeld: totalCashHeld,
        entitledProfit: Math.round(netEntitledProfit * 100) / 100,
        balance: combinedBalance,
        status: combinedBalance > 0.01 ? 'receivable' : combinedBalance < -0.01 ? 'payable' : 'settled'
      };
    });

    // 6. Generate Independent Settlement Recommendations:
    // a) Rent Debt Resolution:
    const rentDebtors = partnerMetrics
      .filter((p) => p.rent.balance < -0.01)
      .map((p) => ({ ...p, owe: -p.rent.balance }));
    const rentCreditors = partnerMetrics
      .filter((p) => p.rent.balance > 0.01)
      .map((p) => ({ ...p, toReceive: p.rent.balance }));
    const rentRecommendations = resolveDebts(rentDebtors, rentCreditors, 'rent', 'Rent Share');

    // b) Expense Debt Resolution:
    const expDebtors = partnerMetrics
      .filter((p) => p.expense.balance < -0.01)
      .map((p) => ({ ...p, owe: -p.expense.balance }));
    const expCreditors = partnerMetrics
      .filter((p) => p.expense.balance > 0.01)
      .map((p) => ({ ...p, toReceive: p.expense.balance }));
    const expenseRecommendations = resolveDebts(expDebtors, expCreditors, 'expense', 'Expense Reimbursement');

    // c) Combined recommendations
    const combDebtors = partnerMetrics
      .filter((p) => p.balance < -0.01)
      .map((p) => ({ ...p, owe: -p.balance }));
    const combCreditors = partnerMetrics
      .filter((p) => p.balance > 0.01)
      .map((p) => ({ ...p, toReceive: p.balance }));
    const combinedRecommendations = resolveDebts(combDebtors, combCreditors, 'all', 'Combined Net');

    return {
      partners: partnerMetrics,
      totalRevenueCollected,
      totalExpensesPaid,
      realizedProfit,
      totalSettlementsDone,
      totalCapitalInvested,
      rentRecommendations,
      expenseRecommendations,
      recommendations: combinedRecommendations
    };
  }

  /**
   * Get virtual ledger timeline for a specific partner
   */
  async getPartnerVirtualLedger(partnerId) {
    const partner = await Partner.findById(partnerId).lean();
    if (!partner) throw new Error('Partner not found');

    const balances = await this.getPartnerBalances();
    const partnerMetric = balances.partners.find((p) => p.partnerId.toString() === partnerId.toString());

    // Gather all ledger events for this partner
    const validRentals = await Rental.find({ status: { $ne: 'cancelled' } }).distinct('_id');
    const [payments, expenses, settlementsSent, settlementsRecv, investments] = await Promise.all([
      Payment.find({ receivedByPartner: partnerId, rental: { $in: validRentals } })
        .populate('customer', 'name')
        .populate('rental', 'rentalNumber')
        .sort({ paymentDate: -1 })
        .lean(),
      Expense.find({ paidByPartner: partnerId })
        .populate('bike', 'name registrationNumber')
        .sort({ expenseDate: -1 })
        .lean(),
      Settlement.find({ senderPartner: partnerId, status: 'completed' })
        .populate('receiverPartner', 'name')
        .sort({ settlementDate: -1 })
        .lean(),
      Settlement.find({ receiverPartner: partnerId, status: 'completed' })
        .populate('senderPartner', 'name')
        .sort({ settlementDate: -1 })
        .lean(),
      CapitalInvestment.find({ partner: partnerId })
        .populate('bike', 'name')
        .sort({ investmentDate: -1 })
        .lean()
    ]);

    const events = [];

    // Initial Capital
    if (partner.initialCapital > 0) {
      events.push({
        id: `init-${partner._id}`,
        date: partner.createdAt,
        type: 'capital',
        title: 'Initial Capital Contribution',
        description: 'Founding capital deposited',
        amount: partner.initialCapital,
        direction: 'credit',
        category: 'Capital'
      });
    }

    // Capital Investments
    investments.forEach((ci) => {
      events.push({
        id: ci._id,
        date: ci.investmentDate,
        type: 'capital',
        title: `Capital Investment: ${ci.type === 'bike_purchase' ? `Bike Purchase (${ci.bike?.name || 'Fleet'})` : ci.type}`,
        description: ci.notes || `Capital invested via ${(ci.paymentMethod || '').toUpperCase()}`,
        amount: ci.amount,
        direction: 'credit',
        category: 'Capital'
      });
    });

    // Rent Payments Received (Partner collects cash/upi into hand)
    payments.forEach((p) => {
      events.push({
        id: p._id,
        date: p.paymentDate,
        type: 'rent_collected',
        title: `Rent Collected (#${p.rental?.rentalNumber || 'Trip'})`,
        description: `From ${p.customer?.name || 'Customer'} via ${(p.paymentMethod || '').toUpperCase()}`,
        amount: p.amount,
        direction: 'debit',
        category: 'Revenue'
      });
    });

    // Expenses Paid Out-of-Pocket
    expenses.forEach((e) => {
      events.push({
        id: e._id,
        date: e.expenseDate,
        type: 'expense_paid',
        title: `Expense Paid: ${e.category} (${e.bike?.name || 'General'})`,
        description: e.description || 'Business operational outlay',
        amount: e.amount,
        direction: 'credit',
        category: 'Expense'
      });
    });

    // Settlements Sent
    settlementsSent.forEach((s) => {
      events.push({
        id: s._id,
        date: s.settlementDate,
        type: 'settlement_sent',
        title: `Settlement Paid → ${s.receiverPartner?.name || 'Partner'}`,
        description: `${s.settlementType.toUpperCase()} Transfer (${(s.paymentMethod || '').toUpperCase()})`,
        amount: s.amount,
        direction: 'credit',
        category: 'Settlement'
      });
    });

    // Settlements Received
    settlementsRecv.forEach((s) => {
      events.push({
        id: s._id,
        date: s.settlementDate,
        type: 'settlement_received',
        title: `Settlement Received ← ${s.senderPartner?.name || 'Partner'}`,
        description: `${s.settlementType.toUpperCase()} Inflow (${(s.paymentMethod || '').toUpperCase()})`,
        amount: s.amount,
        direction: 'debit',
        category: 'Settlement'
      });
    });

    // Sort chronologically (newest first)
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      partner,
      wallet: partnerMetric?.wallet || {},
      metrics: partnerMetric,
      events
    };
  }

  /**
   * Record a settlement between partners
   */
  async recordSettlement({
    senderPartnerId,
    receiverPartnerId,
    amount,
    settlementType = 'rent',
    paymentMethod = 'upi',
    reference = '',
    notes = '',
    userId = null,
    userName = 'Admin'
  }) {
    if (!senderPartnerId || !receiverPartnerId) {
      throw new Error('Both sender and receiver partners are required.');
    }
    if (senderPartnerId.toString() === receiverPartnerId.toString()) {
      throw new Error('Sender and receiver partners cannot be the same person.');
    }
    if (!amount || amount <= 0) {
      throw new Error('Settlement amount must be greater than ₹0.');
    }

    const settlementNumber = await getNextSettlementNumber();

    const settlement = await Settlement.create({
      settlementNumber,
      senderPartner: senderPartnerId,
      receiverPartner: receiverPartnerId,
      amount,
      settlementType,
      paymentMethod,
      reference,
      notes,
      settledBy: userId,
      status: 'completed'
    });

    const sender = await Partner.findById(senderPartnerId);
    const receiver = await Partner.findById(receiverPartnerId);
    const typeLabel =
      settlementType === 'expense'
        ? 'Expense Reimbursement'
        : settlementType === 'rent'
        ? 'Rent Revenue Share'
        : 'General Settlement';

    // Record into Ledger
    const transactionNumber = await getNextTransactionNumber();
    await Transaction.create({
      transactionNumber,
      date: new Date(),
      type: 'partner_settlement',
      amount,
      description: `Settlement [${typeLabel}]: ${sender ? sender.name : 'Partner'} paid ${receiver ? receiver.name : 'Partner'} ₹${amount.toLocaleString('en-IN')}`,
      paidByPartner: senderPartnerId,
      receivedByPartner: receiverPartnerId,
      paymentMethod,
      relatedId: settlement._id,
      relatedModel: 'Settlement',
      balanceImpact: 'neutral'
    });

    // Audit Log
    await AuditLog.create({
      action: 'SETTLEMENT_RECORDED',
      entityType: 'Settlement',
      entityId: settlement._id,
      userId,
      userName,
      details: `${typeLabel} of ₹${amount.toLocaleString('en-IN')} marked as completed from ${sender ? sender.name : 'Partner'} to ${receiver ? receiver.name : 'Partner'}.`
    });

    return settlement;
  }
}

module.exports = new SettlementService();
