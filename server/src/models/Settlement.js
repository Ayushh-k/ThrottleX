const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  settlementNumber: { type: String, required: true, unique: true, uppercase: true },
  settlementDate: { type: Date, default: Date.now },
  senderPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  receiverPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  settlementType: {
    type: String,
    enum: ['rent', 'expense', 'all'],
    default: 'rent',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'cash', 'bank_transfer', 'other'],
    default: 'upi'
  },
  reference: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settlement', settlementSchema);
