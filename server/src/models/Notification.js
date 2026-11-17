const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['rental_due', 'payment_pending', 'service_due', 'insurance_due', 'settlement_due', 'system'],
    default: 'system'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'urgent'],
    default: 'info'
  },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
