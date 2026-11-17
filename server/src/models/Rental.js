const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  rentalNumber: { type: String, required: true, unique: true, uppercase: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date, required: true },
  actualEndDate: { type: Date },
  dailyRate: { type: Number, required: true, min: 0 },
  totalDays: { type: Number, required: true, min: 1 },
  securityDeposit: { type: Number, default: 0, min: 0 },
  extraCharges: { type: Number, default: 0, min: 0 },
  extraChargesReason: { type: String, default: '' },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  remainingAmount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'returned', 'overdue', 'cancelled'],
    default: 'active',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid'],
    default: 'pending',
    index: true
  },
  startOdometer: { type: Number, default: 0 },
  endOdometer: { type: Number },
  helmetProvided: { type: Number, default: 1 },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

rentalSchema.index({ startDate: 1, expectedEndDate: 1, status: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
