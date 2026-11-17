const FuelEntry = require('../models/FuelEntry');
const Expense = require('../models/Expense');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');
const ledgerService = require('../services/ledgerService');

exports.getFuelEntries = async (req, res) => {
  try {
    const { bikeId } = req.query;
    const filter = {};
    if (bikeId && bikeId !== 'all') filter.bike = bikeId;

    const entries = await FuelEntry.find(filter)
      .populate('bike', 'name brand model registrationNumber')
      .populate('paidByPartner', 'name avatar')
      .sort({ date: -1 })
      .lean();

    return res.json({ entries });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching fuel records.' });
  }
};

exports.addFuelEntry = async (req, res) => {
  try {
    const {
      bikeId,
      date,
      litres,
      amount,
      pricePerLitre,
      odometer,
      paidByPartnerId,
      fuelStation = '',
      notes = ''
    } = req.body;

    if (!bikeId || !litres || !amount || !odometer) {
      return res.status(400).json({ message: 'Bike, litres, amount, and current odometer reading are required.' });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ message: 'Bike not found.' });

    let partner = null;
    if (paidByPartnerId) {
      partner = await Partner.findById(paidByPartnerId);
    }
    if (!partner) {
      partner = await Partner.findOne({ status: 'active' });
    }

    const calculatedPricePerLitre = Number(pricePerLitre) || (Number(amount) / Number(litres));

    // Create Expense entry for this fuel refill
    const expCount = await Expense.countDocuments();
    const expense = await Expense.create({
      expenseNumber: `TX-EXP-${1001 + expCount}`,
      bike: bike._id,
      category: 'petrol',
      amount: Number(amount),
      expenseDate: date ? new Date(date) : new Date(),
      paidByPartner: partner._id,
      paymentMethod: 'upi',
      description: `Fuel refill: ${litres} L @ ₹${calculatedPricePerLitre.toFixed(1)}/L (${fuelStation || 'Station'})`,
      odometer: Number(odometer),
      notes,
      createdBy: req.user?._id
    });

    await ledgerService.recordExpense({
      expense,
      partner,
      bike,
      userId: req.user?._id,
      userName: req.user?.name
    });

    // Create Fuel Entry
    const fuelEntry = await FuelEntry.create({
      bike: bike._id,
      date: date ? new Date(date) : new Date(),
      litres: Number(litres),
      amount: Number(amount),
      pricePerLitre: calculatedPricePerLitre,
      odometer: Number(odometer),
      paidByPartner: partner._id,
      fuelStation,
      notes,
      expenseId: expense._id
    });

    // Update bike's current odometer if this is higher
    if (Number(odometer) > bike.currentOdometer) {
      bike.currentOdometer = Number(odometer);
      await bike.save();
    }

    return res.status(201).json({ message: 'Fuel refill logged successfully.', fuelEntry, expense });
  } catch (err) {
    console.error('addFuelEntry error:', err);
    return res.status(500).json({ message: 'Error recording fuel refill.' });
  }
};
