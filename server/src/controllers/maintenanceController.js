const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');
const ledgerService = require('../services/ledgerService');
const { getNextExpenseNumber } = require('../utils/idGenerator');

exports.getAllMaintenance = async (req, res) => {
  try {
    const { bikeId } = req.query;
    const filter = {};
    if (bikeId && bikeId !== 'all') filter.bike = bikeId;

    const records = await Maintenance.find(filter)
      .populate('bike', 'name brand model registrationNumber currentOdometer nextServiceOdo')
      .populate('paidByPartner', 'name avatar')
      .sort({ serviceDate: -1 })
      .lean();

    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching maintenance records.' });
  }
};

exports.addMaintenanceRecord = async (req, res) => {
  try {
    const {
      bikeId,
      serviceDate,
      serviceType = 'routine',
      odometer,
      cost,
      paidByPartnerId,
      garage = '',
      description = '',
      nextServiceDate,
      nextServiceOdo,
      invoiceNumber = ''
    } = req.body;

    if (!bikeId || cost === undefined || cost === null) {
      return res.status(400).json({ message: 'Bike and cost are required.' });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ message: 'Bike not found.' });

    let partner = null;
    if (paidByPartnerId) {
      partner = await Partner.findById(paidByPartnerId);
    }
    if (!partner) {
      partner = await Partner.findOne({ status: 'active' }) || await Partner.findOne();
    }

    // Determine expense category
    let expCategory = 'service';
    if (serviceType === 'oil_change') expCategory = 'engine_oil';
    else if (serviceType === 'repair' || serviceType === 'breakdown') expCategory = 'repair';
    else if (serviceType === 'tyre_replacement') expCategory = 'tyres';

    // Create Expense entry
    const expenseNumber = await getNextExpenseNumber();
    const expense = await Expense.create({
      expenseNumber,
      bike: bike._id,
      category: expCategory,
      amount: Number(cost),
      expenseDate: serviceDate ? new Date(serviceDate) : new Date(),
      paidByPartner: partner._id,
      paymentMethod: 'upi',
      description: `${serviceType.toUpperCase()} at ${garage || 'Workshop'}: ${description || 'Routine service'}`,
      odometer: odometer ? Number(odometer) : bike.currentOdometer,
      createdBy: req.user?._id
    });

    await ledgerService.recordExpense({
      expense,
      partner,
      bike,
      userId: req.user?._id,
      userName: req.user?.name
    });

    const maintenance = await Maintenance.create({
      bike: bike._id,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      serviceType,
      odometer: odometer ? Number(odometer) : bike.currentOdometer,
      cost: Number(cost),
      paidByPartner: partner._id,
      garage,
      description,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
      nextServiceOdo: nextServiceOdo ? Number(nextServiceOdo) : undefined,
      invoiceNumber,
      expenseId: expense._id
    });

    // Update bike's next service thresholds
    if (nextServiceOdo) bike.nextServiceOdo = Number(nextServiceOdo);
    if (nextServiceDate) bike.nextServiceDate = new Date(nextServiceDate);
    if (odometer && Number(odometer) > bike.currentOdometer) {
      bike.currentOdometer = Number(odometer);
    }
    await bike.save();

    return res.status(201).json({ message: 'Maintenance record saved.', maintenance, expense });
  } catch (err) {
    console.error('addMaintenanceRecord error:', err);
    return res.status(500).json({ message: 'Error adding maintenance record.' });
  }
};
