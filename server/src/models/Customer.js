const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  fatherName: { type: String, trim: true, default: '' },
  altPhone: { type: String, trim: true, default: '' },
  dob: { type: Date },
  currentAddress: { type: String, trim: true, default: '' },
  permanentAddress: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' }, // backward compatibility
  emergencyContact: { type: String, trim: true, default: '' },

  // KYC Vault & ID Proofs
  dlNumber: { type: String, trim: true, uppercase: true, default: '', index: true },
  dlExpiryDate: { type: Date, index: true },
  idProofType: {
    type: String,
    enum: ['Aadhaar', 'Passport', 'Voter ID', 'Driving Licence', 'PAN', 'College ID', 'Other'],
    default: 'Aadhaar'
  },
  idProofNumber: { type: String, trim: true, uppercase: true, default: '' },
  idProofExpiryDate: { type: Date },
  panNumber: { type: String, trim: true, uppercase: true, default: '' },
  collegeId: { type: String, trim: true, default: '' },

  // Uploaded Document Images (Data URIs / URLs)
  photoUrl: { type: String, default: '' },
  dlPhotoUrl: { type: String, default: '' },
  dlBackPhotoUrl: { type: String, default: '' },
  aadhaarPhotoUrl: { type: String, default: '' },
  aadhaarBackPhotoUrl: { type: String, default: '' },

  // Risk & Compliance Status
  riskStatus: {
    type: String,
    enum: ['verified', 'pending', 'risk', 'blocked'],
    default: 'verified',
    index: true
  },
  blockedReason: { type: String, default: '' },

  // Guarantor / Reference Contact
  guarantor: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { type: String, default: '' },
    dlNumber: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
    address: { type: String, default: '' }
  },

  notes: { type: String, default: '' }
}, {
  timestamps: true
});

customerSchema.index({ name: 'text', phone: 'text', dlNumber: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
