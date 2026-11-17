const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  serviceDate: { type: Date, default: Date.now },
  serviceType: {
    type: String,
    enum: ['routine', 'repair', 'oil_change', 'tyre_replacement', 'breakdown', 'other'],
    default: 'routine'
  },
  odometer: { type: Number, default: 0 },
  cost: { type: Number, required: true, min: 0 },
  paidByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  garage: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  nextServiceDate: { type: Date },
  nextServiceOdo: { type: Number },
  invoiceNumber: { type: String, trim: true, default: '' },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
