const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: { type: String, required: true, unique: true, uppercase: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', index: true },
  category: {
    type: String,
    enum: [
      'petrol',
      'engine_oil',
      'service',
      'repair',
      'tyres',
      'insurance',
      'cleaning',
      'accessories',
      'parking',
      'challan',
      'transportation',
      'miscellaneous'
    ],
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 1 },
  expenseDate: { type: Date, default: Date.now, index: true },
  paidByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'card', 'other'],
    default: 'upi'
  },
  description: { type: String, required: true, trim: true },
  odometer: { type: Number },
  receiptImage: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
