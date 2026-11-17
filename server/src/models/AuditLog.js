const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'System' },
  details: { type: String, required: true },
  changes: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
