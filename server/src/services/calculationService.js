const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');

class CalculationService {
  /**
   * Get financial metrics with optional date range filter
   */
  async getFinancialOverview(startDate = null, endDate = null) {
    const rentalFilter = { status: { $ne: 'cancelled' } };
    const expenseFilter = {};
    const paymentFilter = {};

    if (startDate || endDate) {
      rentalFilter.startDate = {};
      expenseFilter.expenseDate = {};
      paymentFilter.paymentDate = {};

      if (startDate) {
        rentalFilter.startDate.$gte = new Date(startDate);
        expenseFilter.expenseDate.$gte = new Date(startDate);
        paymentFilter.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        rentalFilter.startDate.$lte = end;
        expenseFilter.expenseDate.$lte = end;
        paymentFilter.paymentDate.$lte = end;
      }
    }

    // 1. Total Rental Revenue (agreed total value of completed/active rentals)
    const rentals = await Rental.find(rentalFilter).lean();
    const totalRentalRevenue = rentals.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const totalAmountCollected = rentals.reduce((acc, r) => acc + (r.amountPaid || 0), 0);
    const totalAmountReceivable = rentals.reduce((acc, r) => acc + (r.remainingAmount || 0), 0);

    // 2. Total Expenses
    const expenses = await Expense.find(expenseFilter).lean();
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // 3. Net Profit
    const netProfit = totalRentalRevenue - totalExpenses;
    const profitMargin = totalRentalRevenue > 0 ? ((netProfit / totalRentalRevenue) * 100).toFixed(1) : 0;

    // 4. Bikes counts
    const totalBikes = await Bike.countDocuments({ status: { $ne: 'inactive' } });
    const activeRentals = await Rental.countDocuments({ status: 'active' });
    const availableBikes = await Bike.countDocuments({ status: 'available' });
    const maintenanceBikes = await Bike.countDocuments({ status: 'maintenance' });

    // 5. Expense breakdown by category
    const expenseByCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'miscellaneous';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
    });

    return {
      totalRevenue: totalRentalRevenue,
      totalAmountCollected,
      totalExpenses,
      netProfit,
      profitMargin: Number(profitMargin),
      totalReceivable: totalAmountReceivable,
      totalBikes,
      activeRentals,
      availableBikes,
      maintenanceBikes,
      expenseByCategory,
      totalRentalCount: rentals.length
    };
  }

  /**
   * Get bike-specific financial metrics
   */
  async getBikeFinancials(bikeId) {
    const rentals = await Rental.find({ bike: bikeId, status: { $ne: 'cancelled' } }).lean();
    const expenses = await Expense.find({ bike: bikeId }).lean();

    const totalRevenue = rentals.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const amountCollected = rentals.reduce((acc, r) => acc + (r.amountPaid || 0), 0);
    const outstanding = rentals.reduce((acc, r) => acc + (r.remainingAmount || 0), 0);
    const totalRentalDays = rentals.reduce((acc, r) => acc + (r.totalDays || 0), 0);

    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Fuel expenses for this bike
    const fuelExpenses = expenses
      .filter((e) => e.category === 'petrol')
      .reduce((acc, e) => acc + e.amount, 0);

    // Service & maintenance expenses
    const maintenanceExpenses = expenses
      .filter((e) => ['service', 'repair', 'engine_oil', 'tyres'].includes(e.category))
      .reduce((acc, e) => acc + e.amount, 0);

    return {
      totalRevenue,
      amountCollected,
      outstanding,
      totalRentalDays,
      totalRentals: rentals.length,
      totalExpenses,
      netProfit,
      profitMargin: Number(profitMargin),
      fuelExpenses,
      maintenanceExpenses,
      otherExpenses: totalExpenses - fuelExpenses - maintenanceExpenses
    };
  }

  /**
   * Get Time-series Analytics for Dashboard
   */
  async getAnalyticsData(timeframe = 'month') {
    const now = new Date();
    let startDate;

    if (timeframe === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // last 6 months
    }

    const rentals = await Rental.find({
      startDate: { $gte: startDate },
      status: { $ne: 'cancelled' }
    }).lean();

    const expenses = await Expense.find({
      expenseDate: { $gte: startDate }
    }).lean();

    // Group by date/month
    const grouped = {};

    rentals.forEach((r) => {
      const d = new Date(r.startDate).toISOString().slice(0, 10);
      if (!grouped[d]) grouped[d] = { date: d, revenue: 0, expenses: 0, profit: 0 };
      grouped[d].revenue += r.totalAmount || 0;
    });

    expenses.forEach((e) => {
      const d = new Date(e.expenseDate).toISOString().slice(0, 10);
      if (!grouped[d]) grouped[d] = { date: d, revenue: 0, expenses: 0, profit: 0 };
      grouped[d].expenses += e.amount || 0;
    });

    const timeSeries = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.forEach((pt) => {
      pt.profit = pt.revenue - pt.expenses;
    });

    // Revenue by Bike
    const bikes = await Bike.find().lean();
    const bikeRevenueMap = {};
    bikes.forEach((b) => {
      bikeRevenueMap[b._id.toString()] = { name: b.name, revenue: 0, expenses: 0 };
    });

    rentals.forEach((r) => {
      const bId = r.bike ? r.bike.toString() : null;
      if (bId && bikeRevenueMap[bId]) {
        bikeRevenueMap[bId].revenue += r.totalAmount || 0;
      }
    });

    expenses.forEach((e) => {
      const bId = e.bike ? e.bike.toString() : null;
      if (bId && bikeRevenueMap[bId]) {
        bikeRevenueMap[bId].expenses += e.amount || 0;
      }
    });

    const bikePerformance = Object.values(bikeRevenueMap).map((b) => ({
      name: b.name,
      revenue: b.revenue,
      expenses: b.expenses,
      profit: b.revenue - b.expenses
    }));

    return {
      timeSeries,
      bikePerformance
    };
  }
}

module.exports = new CalculationService();
