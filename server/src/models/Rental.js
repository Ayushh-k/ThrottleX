const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  rentalNumber: { type: String, required: true, unique: true, uppercase: true },
  agreementNumber: { type: String, uppercase: true },
  bike: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date, required: true },
  actualEndDate: { type: Date },
  rentalType: {
    type: String,
    enum: ['daily', 'hourly'],
    default: 'daily',
    index: true
  },
  dailyRate: { type: Number, default: 0, min: 0 },
  hourlyRate: { type: Number, default: 0, min: 0 },
  totalDays: { type: Number, default: 0, min: 0 },
  totalHours: { type: Number, default: 0, min: 0 },
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

  // Guarantor / Reference Contact for this contract
  guarantor: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { type: String, default: '' },
    dlNumber: { type: String, default: '' },
    idProofNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    confirmed: { type: Boolean, default: false }
  },

  // Handover Inspection (Pre-Ride Out-Gate Clearance)
  handoverInspection: {
    date: { type: Date },
    fuelLevel: { type: String, enum: ['Full', 'Half', 'Reserve'], default: 'Full' },
    odometer: { type: Number },
    helmetsIssued: { type: Number, default: 1 },
    accessoriesIssued: { type: String, default: 'Standard Tool Kit & Helmet' },
    checklist: {
      headlight: { type: Boolean, default: true },
      tailLight: { type: Boolean, default: true },
      leftIndicator: { type: Boolean, default: true },
      rightIndicator: { type: Boolean, default: true },
      leftMirror: { type: Boolean, default: true },
      rightMirror: { type: Boolean, default: true },
      horn: { type: Boolean, default: true },
      frontBrake: { type: Boolean, default: true },
      rearBrake: { type: Boolean, default: true },
      clutch: { type: Boolean, default: true },
      accelerator: { type: Boolean, default: true },
      speedometer: { type: Boolean, default: true },
      fuelTank: { type: Boolean, default: true },
      seat: { type: Boolean, default: true },
      tyres: { type: Boolean, default: true },
      wheelsAlloy: { type: Boolean, default: true },
      chain: { type: Boolean, default: true },
      silencer: { type: Boolean, default: true },
      numberPlate: { type: Boolean, default: true },
      engineRunsProperly: { type: Boolean, default: true },
      keyReceived: { type: Boolean, default: true },
      documentsReceived: { type: Boolean, default: true },
      noUnrecordedDamage: { type: Boolean, default: true },
      photosTaken: { type: Boolean, default: true }
    },
    existingDamage: { type: String, default: 'None' },
    photos: [{ type: String }],
    customerSignature: { type: String, default: '' },
    guarantorSignature: { type: String, default: '' },
    representativeSignature: { type: String, default: '' },
    confirmed: { type: Boolean, default: true }
  },

  // Return Inspection (Post-Ride In-Gate Clearance & Auto-Damage Comparison)
  returnInspection: {
    date: { type: Date },
    fuelLevel: { type: String, enum: ['Full', 'Half', 'Reserve'], default: 'Full' },
    odometer: { type: Number },
    checklist: {
      headlight: { type: Boolean, default: true },
      tailLight: { type: Boolean, default: true },
      leftIndicator: { type: Boolean, default: true },
      rightIndicator: { type: Boolean, default: true },
      leftMirror: { type: Boolean, default: true },
      rightMirror: { type: Boolean, default: true },
      horn: { type: Boolean, default: true },
      frontBrake: { type: Boolean, default: true },
      rearBrake: { type: Boolean, default: true },
      clutch: { type: Boolean, default: true },
      accelerator: { type: Boolean, default: true },
      speedometer: { type: Boolean, default: true },
      fuelTank: { type: Boolean, default: true },
      seat: { type: Boolean, default: true },
      tyres: { type: Boolean, default: true },
      wheelsAlloy: { type: Boolean, default: true },
      chain: { type: Boolean, default: true },
      silencer: { type: Boolean, default: true },
      numberPlate: { type: Boolean, default: true },
      engineRunsProperly: { type: Boolean, default: true },
      keyReceived: { type: Boolean, default: true },
      documentsReceived: { type: Boolean, default: true },
      noUnrecordedDamage: { type: Boolean, default: true },
      photosTaken: { type: Boolean, default: true }
    },
    damageDetected: { type: Boolean, default: false },
    damageRemarks: { type: String, default: '' },
    damageChargeAmount: { type: Number, default: 0 },
    photos: [{ type: String }],
    customerSignature: { type: String, default: '' },
    representativeSignature: { type: String, default: '' },
    confirmed: { type: Boolean, default: false }
  },

  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

rentalSchema.index({ startDate: 1, expectedEndDate: 1, status: 1 });
rentalSchema.index({ createdAt: -1 });
rentalSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
