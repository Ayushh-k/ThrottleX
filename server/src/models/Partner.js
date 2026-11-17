const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  sharePercentage: { type: Number, default: 50, min: 0, max: 100 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  initialCapital: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Partner', partnerSchema);
