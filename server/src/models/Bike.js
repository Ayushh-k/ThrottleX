const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  variant: { type: String, trim: true, default: '' },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  chassisNumber: { type: String, trim: true, default: '' },
  engineNumber: { type: String, trim: true, default: '' },
  purchaseDate: { type: Date, default: Date.now },
  purchasePrice: { type: Number, default: 0 },
  defaultDailyRate: { type: Number, required: true, min: 0 },
  defaultHourlyRate: { type: Number, default: 0, min: 0 },
  currentOdometer: { type: Number, default: 0, min: 0 },
  fuelType: { type: String, enum: ['Petrol', 'Electric', 'Diesel'], default: 'Petrol' },
  color: { type: String, default: 'Black' },
  imageUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'inactive'],
    default: 'available',
    index: true
  },
  insuranceExpiryDate: { type: Date },
  nextServiceOdo: { type: Number, default: 0 },
  nextServiceDate: { type: Date },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

bikeSchema.index({ brand: 1, model: 1 });

module.exports = mongoose.model('Bike', bikeSchema);
