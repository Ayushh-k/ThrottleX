const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

class LedgerService {
  async recordPayment({ payment, rental, customer, partner, userId, userName }) {
    const count = await Transaction.countDocuments();
    const tx = await Transaction.create({
      transactionNumber: `TXN-${10001 + count}`,
      date: payment.paymentDate || new Date(),
      type: 'customer_payment',
      amount: payment.amount,
      description: `Rental payment received for #${rental.rentalNumber} (${customer ? customer.name : 'Customer'})`,
      bike: rental.bike,
      receivedByPartner: partner ? partner._id : null,
      customer: customer ? customer._id : null,
      paymentMethod: payment.paymentMethod,
      relatedId: payment._id,
      relatedModel: 'Payment',
      balanceImpact: 'credit'
    });

    await AuditLog.create({
      action: 'PAYMENT_RECEIVED',
      entityType: 'Payment',
      entityId: payment._id,
      userId,
      userName: userName || (partner ? partner.name : 'System'),
      details: `Payment of ₹${payment.amount.toLocaleString('en-IN')} received via ${payment.paymentMethod.toUpperCase()} for rental #${rental.rentalNumber}.`
    });

    return tx;
  }

  async recordExpense({ expense, partner, bike, userId, userName }) {
    const count = await Transaction.countDocuments();
    const tx = await Transaction.create({
      transactionNumber: `TXN-${10001 + count}`,
      date: expense.expenseDate || new Date(),
      type: 'expense',
      amount: expense.amount,
      description: `${expense.category.toUpperCase()}: ${expense.description}`,
      bike: bike ? bike._id : (expense.bike || null),
      paidByPartner: partner ? partner._id : expense.paidByPartner,
      paymentMethod: expense.paymentMethod,
      relatedId: expense._id,
      relatedModel: 'Expense',
      balanceImpact: 'debit'
    });

    await AuditLog.create({
      action: 'EXPENSE_ADDED',
      entityType: 'Expense',
      entityId: expense._id,
      userId,
      userName: userName || (partner ? partner.name : 'System'),
      details: `Expense of ₹${expense.amount.toLocaleString('en-IN')} for ${expense.category} added by ${partner ? partner.name : 'Partner'}.`
    });

    return tx;
  }

  async recordAudit({ action, entityType, entityId, userId, userName, details, changes }) {
    return AuditLog.create({
      action,
      entityType,
      entityId,
      userId,
      userName: userName || 'System',
      details,
      changes: changes || {}
    });
  }
}

module.exports = new LedgerService();
