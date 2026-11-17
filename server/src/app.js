require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const customerRoutes = require('./routes/customerRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const User = require('./models/User');
const Partner = require('./models/Partner');

// Ensure default owner exists on any connected database (local or Atlas)
let ownerEnsured = false;
async function ensureOwnerAccount() {
  if (ownerEnsured) return;
  try {
    const email = 'ayushkamboj9690@gmail.com';
    let user = await User.findOne({ email });
    let partner = await Partner.findOne({ email });

    if (!partner) {
      partner = await Partner.create({
        name: 'Ayush kamboj',
        email,
        phone: '9690259628',
        sharePercentage: 50,
        status: 'active',
        notes: 'Owner / Managing Partner'
      });
    }

    if (!user) {
      user = await User.create({
        name: 'Ayush kamboj',
        email,
        password: 'ayush@tx123',
        phone: '9690259628',
        role: 'owner',
        partnerId: partner._id
      });
      partner.userId = user._id;
      await partner.save();
      console.log('[THROTTLEX] Verified & initialized Owner Ayush kamboj.');
    }
    ownerEnsured = true;
  } catch (err) {
    console.error('Error ensuring owner account:', err.message);
  }
}

// Middleware to ensure DB connection before handling request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await ensureOwnerAccount();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    res.status(500).json({
      message: 'Failed to connect to database. Please check your MONGODB_URI environment variable.',
      error: err.message
    });
  }
});

// Centralized API Router
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'THROTTLEX',
    tagline: 'OWN THE ROAD.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Setup status check
apiRouter.get('/auth/setup-status', async (req, res) => {
  try {
    const ownerCount = await User.countDocuments({ role: 'owner' });
    const userCount = await User.countDocuments();
    return res.json({
      isSetup: ownerCount > 0,
      totalUsers: userCount
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error checking setup status' });
  }
});

// Mount routes on apiRouter
apiRouter.use('/auth', authRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/bikes', bikeRoutes);
apiRouter.use('/rentals', rentalRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/fuel', fuelRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/partners', partnerRoutes);
apiRouter.use('/settlements', settlementRoutes);
apiRouter.use('/ledger', ledgerRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/search', searchRoutes);

// Mount at both /api and root so it handles both direct and rewritten requests
app.use('/api', apiRouter);
app.use(apiRouter);

// Static frontend fallback for standalone local execution
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/bikes')) {
    return next();
  }
  const indexFile = path.join(clientDistPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send('THROTTLEX API Server is running.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[THROTTLEX API Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

module.exports = app;
