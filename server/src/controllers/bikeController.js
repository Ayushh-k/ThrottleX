const Bike = require('../models/Bike');
const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const FuelEntry = require('../models/FuelEntry');
const Maintenance = require('../models/Maintenance');
const calculationService = require('../services/calculationService');
const ledgerService = require('../services/ledgerService');

// Get all bikes with financial & rental summary
exports.getAllBikes = async (req, res) => {
  try {
    const { status, brand, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (brand && brand !== 'all') {
      filter.brand = brand;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const bikes = await Bike.find(filter).sort({ createdAt: -1 }).lean();

    const enrichedBikes = await Promise.all(
      bikes.map(async (bike) => {
        const financials = await calculationService.getBikeFinancials(bike._id);
        return {
          ...bike,
          financials
        };
      })
    );

    return res.json({ bikes: enrichedBikes });
  } catch (err) {
    console.error('getAllBikes error:', err);
    return res.status(500).json({ message: 'Error fetching bikes.' });
  }
};

// Get single bike detailed profile
exports.getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found.' });
    }

    const financials = await calculationService.getBikeFinancials(bike._id);

    // Rental history
    const rentals = await Rental.find({ bike: bike._id })
      .populate('customer', 'name phone email')
      .sort({ startDate: -1 })
      .lean();

    // Expense history
    const expenses = await Expense.find({ bike: bike._id })
      .populate('paidByPartner', 'name avatar')
      .sort({ expenseDate: -1 })
      .lean();

    // Fuel entries & mileage analysis
    const fuelEntries = await FuelEntry.find({ bike: bike._id })
      .populate('paidByPartner', 'name')
      .sort({ odometer: 1 })
      .lean();

    let totalFuelAmount = 0;
    let totalLitres = 0;
    let approximateMileage = null;
    let fuelCostPerKm = null;

    if (fuelEntries.length > 0) {
      totalFuelAmount = fuelEntries.reduce((sum, f) => sum + f.amount, 0);
      totalLitres = fuelEntries.reduce((sum, f) => sum + f.litres, 0);

      if (fuelEntries.length >= 2) {
        const firstOdo = fuelEntries[0].odometer;
        const lastOdo = fuelEntries[fuelEntries.length - 1].odometer;
        const kmTravelled = lastOdo - firstOdo;

        if (kmTravelled > 0 && totalLitres > 0) {
          approximateMileage = Number((kmTravelled / totalLitres).toFixed(1)); // km per litre
          fuelCostPerKm = Number((totalFuelAmount / kmTravelled).toFixed(2)); // ₹ per km
        }
      }
    }

    // Maintenance records
    const maintenanceRecords = await Maintenance.find({ bike: bike._id })
      .populate('paidByPartner', 'name')
      .sort({ serviceDate: -1 })
      .lean();

    // Upcoming service alert
    let serviceAlert = null;
    if (bike.nextServiceOdo && bike.currentOdometer) {
      const remainingKm = bike.nextServiceOdo - bike.currentOdometer;
      serviceAlert = {
        remainingKm,
        isDue: remainingKm <= 500,
        message:
          remainingKm <= 0
            ? `Service overdue by ${Math.abs(remainingKm)} km!`
            : remainingKm <= 500
            ? `Next service due in ${remainingKm} km`
            : `Next service due at ${bike.nextServiceOdo} km (${remainingKm} km remaining)`
      };
    }

    return res.json({
      bike,
      financials,
      rentals,
      expenses,
      fuelAnalysis: {
        entries: fuelEntries.reverse(),
        totalFuelAmount,
        totalLitres: Number(totalLitres.toFixed(1)),
        approximateMileage,
        fuelCostPerKm,
        averagePricePerLitre: totalLitres > 0 ? Number((totalFuelAmount / totalLitres).toFixed(2)) : 0
      },
      maintenanceRecords,
      serviceAlert
    });
  } catch (err) {
    console.error('getBikeById error:', err);
    return res.status(500).json({ message: 'Error fetching bike details.' });
  }
};

// Create bike
exports.createBike = async (req, res) => {
  try {
    const {
      name,
      brand,
      model,
      variant,
      registrationNumber,
      chassisNumber,
      engineNumber,
      purchaseDate,
      purchasePrice,
      defaultDailyRate,
      defaultHourlyRate,
      currentOdometer,
      fuelType,
      color,
      imageUrl,
      status,
      insuranceExpiryDate,
      nextServiceOdo,
      nextServiceDate,
      notes
    } = req.body;

    if (!name || !registrationNumber || !defaultDailyRate) {
      return res.status(400).json({ message: 'Bike name, registration number, and default daily rate are required.' });
    }

    const regUpper = registrationNumber.toUpperCase().trim();
    const existing = await Bike.findOne({ registrationNumber: regUpper });
    if (existing) {
      return res.status(400).json({ message: `Bike with registration ${regUpper} already exists.` });
    }

    const bike = await Bike.create({
      name,
      brand: brand || name.split(' ')[0],
      model: model || name,
      variant: variant || '',
      registrationNumber: regUpper,
      chassisNumber: chassisNumber || '',
      engineNumber: engineNumber || '',
      purchaseDate: purchaseDate || new Date(),
      purchasePrice: Number(purchasePrice) || 0,
      defaultDailyRate: Number(defaultDailyRate),
      defaultHourlyRate: Number(defaultHourlyRate) || Math.round(Number(defaultDailyRate) / 8) || 120,
      currentOdometer: Number(currentOdometer) || 0,
      fuelType: fuelType || 'Petrol',
      color: color || 'Black',
      imageUrl: imageUrl || '',
      status: status || 'available',
      insuranceExpiryDate: insuranceExpiryDate || null,
      nextServiceOdo: Number(nextServiceOdo) || 0,
      nextServiceDate: nextServiceDate || null,
      notes: notes || ''
    });

    await ledgerService.recordAudit({
      action: 'BIKE_CREATED',
      entityType: 'Bike',
      entityId: bike._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Added new bike: ${bike.name} (${bike.registrationNumber}) with default rate ₹${bike.defaultDailyRate}/day, ₹${bike.defaultHourlyRate}/hr.`
    });

    return res.status(201).json({ message: 'Bike added successfully.', bike });
  } catch (err) {
    console.error('createBike error:', err);
    return res.status(500).json({ message: 'Error adding bike.' });
  }
};

// Update bike
exports.updateBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found.' });
    }

    const updates = req.body;
    if (updates.registrationNumber) {
      updates.registrationNumber = updates.registrationNumber.toUpperCase().trim();
      const existing = await Bike.findOne({
        registrationNumber: updates.registrationNumber,
        _id: { $ne: bike._id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Another bike already has this registration number.' });
      }
    }

    Object.assign(bike, updates);
    await bike.save();

    await ledgerService.recordAudit({
      action: 'BIKE_UPDATED',
      entityType: 'Bike',
      entityId: bike._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Updated bike details for ${bike.name} (${bike.registrationNumber}).`
    });

    return res.json({ message: 'Bike updated successfully.', bike });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating bike.' });
  }
};

// Delete bike (Soft delete by setting status inactive or checking active rentals)
exports.deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found.' });
    }

    const activeRental = await Rental.findOne({ bike: bike._id, status: 'active' });
    if (activeRental) {
      return res.status(400).json({
        message: 'Cannot delete bike with an active rental. Please return or cancel the active rental first.'
      });
    }

    bike.status = 'inactive';
    await bike.save();

    await ledgerService.recordAudit({
      action: 'BIKE_DEACTIVATED',
      entityType: 'Bike',
      entityId: bike._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      details: `Deactivated bike ${bike.name} (${bike.registrationNumber}).`
    });

    return res.json({ message: 'Bike successfully archived/deactivated.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting bike.' });
  }
};
