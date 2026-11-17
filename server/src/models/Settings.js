const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'THROTTLEX' },
  tagline: { type: String, default: 'OWN THE ROAD.' },
  currency: { type: String, default: '₹' },
  defaultDailyRate: { type: Number, default: 900 },
  gracePeriodHours: { type: Number, default: 2 },
  hourlyLateFee: { type: Number, default: 100 },
  extraDayFee: { type: Number, default: 1000 },
  expenseCategories: {
    type: [String],
    default: [
      'Petrol/Fuel',
      'Engine Oil',
      'Service',
      'Repair',
      'Tyres',
      'Insurance',
      'Cleaning',
      'Accessories',
      'Parking',
      'Challan/Fine',
      'Transportation',
      'Miscellaneous'
    ]
  },
  paymentMethods: {
    type: [String],
    default: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other']
  },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  partnerSplitRules: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    percentage: { type: Number, default: 50 }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
