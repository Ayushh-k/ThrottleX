const Partner = require('../models/Partner');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const { getNextSettlementNumber, getNextTransactionNumber } = require('../utils/idGenerator');

class SettlementService {
  /**
   * Calculate partner contributions, cash in hand, entitled profit, balances and settlement recommendations
   */
  async getPartnerBalances() {
    const partners = await Partner.find({ status: 'active' }).lean();
    if (!partners.length) {
      return {
        partners: [],
        totalRevenueCollected: 0,
        totalExpensesPaid: 0,
        realizedProfit: 0,
        recommendations: [],
        totalSettlementsDone: 0
      };
    }

    // Default share normalization if sum != 100
    const totalShareSpecified = partners.reduce((sum, p) => sum + (p.sharePercentage || 0), 0);
    const normalizedPartners = partners.map((p) => ({
      ...p,
      effectiveShare: totalShareSpecified > 0 ? ((p.sharePercentage || (100 / partners.length)) / totalShareSpecified) * 100 : (100 / partners.length)
    }));

    // 1. Total payments collected by each partner
    const payments = await Payment.find().lean();
    const collectionsByPartner = {};
    let totalRevenueCollected = 0;

    payments.forEach((pay) => {
      const pId = pay.receivedByPartner ? pay.receivedByPartner.toString() : null;
      if (pId) {
        collectionsByPartner[pId] = (collectionsByPartner[pId] || 0) + pay.amount;
        totalRevenueCollected += pay.amount;
      }
    });

    // 2. Total expenses paid by each partner
    const expenses = await Expense.find().lean();
    const expensesByPartner = {};
    let totalExpensesPaid = 0;

    expenses.forEach((exp) => {
      const pId = exp.paidByPartner ? exp.paidByPartner.toString() : null;
      if (pId) {
        expensesByPartner[pId] = (expensesByPartner[pId] || 0) + exp.amount;
        totalExpensesPaid += exp.amount;
      }
    });

    // 3. Settlements already completed between partners
    const settlements = await Settlement.find({ status: 'completed' }).lean();
    const settlementsSent = {};
    const settlementsRecv = {};
    let totalSettlementsDone = 0;

    settlements.forEach((s) => {
      const senderId = s.senderPartner ? s.senderPartner.toString() : null;
      const recvId = s.receiverPartner ? s.receiverPartner.toString() : null;
      if (senderId && recvId) {
        settlementsSent[senderId] = (settlementsSent[senderId] || 0) + s.amount;
        settlementsRecv[recvId] = (settlementsRecv[recvId] || 0) + s.amount;
        totalSettlementsDone += s.amount;
      }
    });

    // 4. Calculate Net Realized Business Profit
    const realizedProfit = totalRevenueCollected - totalExpensesPaid;

    // 5. Compute each partner's numbers
    const partnerMetrics = normalizedPartners.map((p) => {
      const id = p._id.toString();
      const collected = collectionsByPartner[id] || 0;
      const spent = expensesByPartner[id] || 0;
      const sent = settlementsSent[id] || 0;
      const recv = settlementsRecv[id] || 0;

      // Net cash physically held by this partner right now
      const netCashHeld = collected - spent - sent + recv;

      // Profit entitled based on agreement
      const entitledProfit = (realizedProfit * (p.effectiveShare / 100));

      // Balance = Entitled - NetCashHeld
      // If balance > 0: partner holds less than entitled -> needs to RECEIVE balance
      // If balance < 0: partner holds more than entitled -> needs to PAY abs(balance)
      const balance = Math.round((entitledProfit - netCashHeld) * 100) / 100;

      return {
        partnerId: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        avatar: p.avatar,
        sharePercentage: p.effectiveShare,
        totalCollected: collected,
        totalExpensesPaid: spent,
        settlementsSent: sent,
        settlementsReceived: recv,
        netCashHeld,
        entitledProfit: Math.round(entitledProfit * 100) / 100,
        balance,
        status: balance > 0 ? 'receivable' : balance < 0 ? 'payable' : 'settled'
      };
    });

    // 6. Generate simplified debt settlements (Splitwise algorithm)
    const recommendations = [];
    const debtors = partnerMetrics.filter((p) => p.balance < -0.01).map((p) => ({ ...p, owe: -p.balance }));
    const creditors = partnerMetrics.filter((p) => p.balance > 0.01).map((p) => ({ ...p, toReceive: p.balance }));

    debtors.sort((a, b) => b.owe - a.owe);
    creditors.sort((a, b) => b.toReceive - a.toReceive);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.owe, creditor.toReceive);

      if (settleAmount > 0) {
        recommendations.push({
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

      if (debtor.owe <= 0.01) dIdx++;
      if (creditor.toReceive <= 0.01) cIdx++;
    }

    return {
      partners: partnerMetrics,
      totalRevenueCollected,
      totalExpensesPaid,
      realizedProfit,
      totalSettlementsDone,
      recommendations
    };
  }

  /**
   * Record a settlement between partners
   */
  async recordSettlement({ senderPartnerId, receiverPartnerId, amount, paymentMethod = 'upi', reference = '', notes = '', userId = null, userName = 'Admin' }) {
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
      paymentMethod,
      reference,
      notes,
      settledBy: userId,
      status: 'completed'
    });

    const sender = await Partner.findById(senderPartnerId);
    const receiver = await Partner.findById(receiverPartnerId);

    // Record into Ledger
    const transactionNumber = await getNextTransactionNumber();
    await Transaction.create({
      transactionNumber,
      date: new Date(),
      type: 'partner_settlement',
      amount,
      description: `Settlement: ${sender ? sender.name : 'Partner'} paid ${receiver ? receiver.name : 'Partner'} ₹${amount.toLocaleString('en-IN')}`,
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
      details: `Settlement of ₹${amount.toLocaleString('en-IN')} marked as completed from ${sender ? sender.name : 'Partner'} to ${receiver ? receiver.name : 'Partner'}.`
    });

    return settlement;
  }
}

module.exports = new SettlementService();
