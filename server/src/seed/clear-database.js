const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const FuelEntry = require('../models/FuelEntry');
const Maintenance = require('../models/Maintenance');
const Settlement = require('../models/Settlement');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

async function clearAllData() {
  await connectDB();
  console.log('[THROTTLEX] Connected to database. Removing all demo records...');

  await Promise.all([
    User.deleteMany({}),
    Partner.deleteMany({}),
    Bike.deleteMany({}),
    Customer.deleteMany({}),
    Rental.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    FuelEntry.deleteMany({}),
    Maintenance.deleteMany({}),
    Settlement.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    Settings.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  // Create clean initial settings
  await Settings.create({
    businessName: 'THROTTLEX',
    tagline: 'OWN THE ROAD.',
    currency: '₹',
    defaultDailyRate: 900,
    gracePeriodHours: 2,
    hourlyLateFee: 100,
    extraDayFee: 1000,
    theme: 'dark'
  });

  console.log('[THROTTLEX] Database completely cleared! All demo information has been removed.');
  console.log('[THROTTLEX] System is ready for your fresh real owner credentials.');
  process.exit(0);
}

clearAllData().catch((err) => {
  console.error('[THROTTLEX] Error clearing database:', err);
  process.exit(1);
});
