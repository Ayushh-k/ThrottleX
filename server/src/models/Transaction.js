const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now, index: true },
  type: {
    type: String,
    enum: [
      'rental_income',
      'customer_payment',
      'expense',
      'partner_contribution',
      'partner_withdrawal',
      'partner_settlement'
    ],
    required: true,
    index: true
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true, trim: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', index: true },
  paidByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', index: true },
  receivedByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  paymentMethod: { type: String, default: 'upi' },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  balanceImpact: { type: String, enum: ['credit', 'debit', 'neutral'], default: 'credit' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
