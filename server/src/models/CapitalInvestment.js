const mongoose = require('mongoose');

const capitalInvestmentSchema = new mongoose.Schema({
  investmentNumber: { type: String, required: true, unique: true, uppercase: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  type: {
    type: String,
    enum: ['bike_purchase', 'working_capital', 'expansion', 'equipment', 'other'],
    default: 'bike_purchase',
    index: true
  },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', index: true },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'cash', 'cheque', 'other'],
    default: 'bank_transfer'
  },
  investmentDate: { type: Date, default: Date.now, index: true },
  reference: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('CapitalInvestment', capitalInvestmentSchema);
