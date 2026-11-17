const mongoose = require('mongoose');

const fuelEntrySchema = new mongoose.Schema({
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  date: { type: Date, default: Date.now },
  litres: { type: Number, required: true, min: 0.1 },
  amount: { type: Number, required: true, min: 1 },
  pricePerLitre: { type: Number, required: true, min: 1 },
  odometer: { type: Number, required: true, min: 0 },
  paidByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  fuelStation: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelEntry', fuelEntrySchema);
