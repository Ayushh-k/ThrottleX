const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true, uppercase: true },
  rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'card', 'other'],
    default: 'upi'
  },
  receivedByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  transactionReference: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
