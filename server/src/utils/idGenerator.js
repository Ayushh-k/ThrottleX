const Expense = require('../models/Expense');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Settlement = require('../models/Settlement');

async function getNextExpenseNumber() {
  const last = await Expense.findOne().sort({ createdAt: -1 }).select('expenseNumber');
  let nextSeq = 1001;
  if (last && last.expenseNumber) {
    const match = last.expenseNumber.match(/(\d+)$/);
    if (match) {
      nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
    }
  }
  while (await Expense.exists({ expenseNumber: `TX-EXP-${nextSeq}` })) {
    nextSeq++;
  }
  return `TX-EXP-${nextSeq}`;
}

async function getNextRentalNumber() {
  const last = await Rental.findOne().sort({ createdAt: -1 }).select('rentalNumber');
  let nextSeq = 1001;
  if (last && last.rentalNumber) {
    const match = last.rentalNumber.match(/(\d+)$/);
    if (match) {
      nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
    }
  }
  while (await Rental.exists({ rentalNumber: `TX-R-${nextSeq}` })) {
    nextSeq++;
  }
  return `TX-R-${nextSeq}`;
}

async function getNextPaymentReceiptNumber() {
  const last = await Payment.findOne().sort({ createdAt: -1 }).select('receiptNumber');
  let nextSeq = 1001;
  if (last && last.receiptNumber) {
    const match = last.receiptNumber.match(/(\d+)$/);
    if (match) {
      nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
    }
  }
  while (await Payment.exists({ receiptNumber: `TX-PAY-${nextSeq}` })) {
    nextSeq++;
  }
  return `TX-PAY-${nextSeq}`;
}

async function getNextTransactionNumber() {
  const last = await Transaction.findOne().sort({ createdAt: -1 }).select('transactionNumber');
  let nextSeq = 10001;
  if (last && last.transactionNumber) {
    const match = last.transactionNumber.match(/(\d+)$/);
    if (match) {
      nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
    }
  }
  while (await Transaction.exists({ transactionNumber: `TXN-${nextSeq}` })) {
    nextSeq++;
  }
  return `TXN-${nextSeq}`;
}

async function getNextSettlementNumber() {
  const last = await Settlement.findOne().sort({ createdAt: -1 }).select('settlementNumber');
  let nextSeq = 1001;
  if (last && last.settlementNumber) {
    const match = last.settlementNumber.match(/(\d+)$/);
    if (match) {
      nextSeq = Math.max(nextSeq, parseInt(match[1], 10) + 1);
    }
  }
  while (await Settlement.exists({ settlementNumber: `TX-SET-${nextSeq}` })) {
    nextSeq++;
  }
  return `TX-SET-${nextSeq}`;
}

module.exports = {
  getNextExpenseNumber,
  getNextRentalNumber,
  getNextPaymentReceiptNumber,
  getNextTransactionNumber,
  getNextSettlementNumber
};
