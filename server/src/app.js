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

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Middleware to ensure DB connection before handling request (crucial for Vercel Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    res.status(500).json({
      message: 'Failed to connect to database. Please check your MONGODB_URI environment variable.',
      error: err.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'THROTTLEX',
    tagline: 'OWN THE ROAD.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// System check to see if database has an owner registered
const User = require('./models/User');
app.get('/api/auth/setup-status', async (req, res) => {
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

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Static frontend serving (for local and VPS production)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexFile = path.join(clientDistPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send('THROTTLEX API Server is running. Client build in progress.');
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
