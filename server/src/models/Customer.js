const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  dlNumber: { type: String, trim: true, uppercase: true, default: '' },
  idProofType: { type: String, enum: ['Aadhaar', 'Passport', 'Voter ID', 'Driving Licence', 'Other'], default: 'Aadhaar' },
  idProofNumber: { type: String, trim: true, uppercase: true, default: '' },
  address: { type: String, trim: true, default: '' },
  emergencyContact: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

customerSchema.index({ name: 'text', phone: 'text', dlNumber: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
