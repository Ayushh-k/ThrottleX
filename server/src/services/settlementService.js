const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
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

    // 1. Total rent payments collected by each partner
    const payments = await Payment.find().lean();
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

    // 3. Completed settlements separated by type: 'rent', 'expense', or 'all'
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

      return {
        partnerId: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        avatar: p.avatar,
        sharePercentage: p.effectiveShare,
        hasLoginAccess: Boolean(userAccount),
        loginEmail: userAccount?.email || p.email,
        userRole: userAccount?.role || (p.email === 'ayushkamboj9690@gmail.com' ? 'owner' : 'partner'),

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
      rentRecommendations,
      expenseRecommendations,
      recommendations: combinedRecommendations
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
