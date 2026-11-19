const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');
const Customer = require('../models/Customer');
const calculationService = require('../services/calculationService');
const settlementService = require('../services/settlementService');

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    let filterStart = startDate ? new Date(startDate) : null;
    let filterEnd = endDate ? new Date(endDate) : null;

    if (month && year) {
      filterStart = new Date(Number(year), Number(month) - 1, 1);
      filterEnd = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    }

    const overview = await calculationService.getFinancialOverview(filterStart, filterEnd);
    const partnerData = await settlementService.getPartnerBalances();
    const cashFlow = await calculationService.getCashFlowOverview();

    // Bike-wise Performance
    const bikes = await Bike.find({ status: { $ne: 'inactive' } }).lean();
    const bikeWiseReports = await Promise.all(
      bikes.map(async (b) => {
        const stats = await calculationService.getBikeFinancials(b._id);
        return {
          id: b._id,
          name: b.name,
          registrationNumber: b.registrationNumber,
          revenue: stats.totalRevenue,
          expenses: stats.totalExpenses,
          profit: stats.netProfit,
          profitMargin: stats.profitMargin,
          totalRentals: stats.totalRentals,
          totalRentalDays: stats.totalRentalDays,
          fuelSpent: stats.fuelExpenses,
          maintenanceSpent: stats.maintenanceExpenses
        };
      })
    );

    // Sort to find top performing bike
    const topBike = [...bikeWiseReports].sort((a, b) => b.profit - a.profit)[0] || null;

    // Highest Expense Category
    let highestExpenseCategory = { category: 'None', amount: 0 };
    Object.entries(overview.expenseByCategory || {}).forEach(([cat, amt]) => {
      if (amt > highestExpenseCategory.amount) {
        highestExpenseCategory = { category: cat, amount: amt };
      }
    });

    // Customer-wise breakdown
    const customers = await Customer.find().limit(20).lean();
    const customerReports = await Promise.all(
      customers.map(async (c) => {
        const rList = await Rental.find({ customer: c._id, status: { $ne: 'cancelled' } }).lean();
        const totalSpent = rList.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
        const outstanding = rList.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);
        return {
          id: c._id,
          name: c.name,
          phone: c.phone,
          rentalsCount: rList.length,
          totalSpent,
          outstanding
        };
      })
    );

    // Monthly business summary calculation
    const totalRentalDays = bikeWiseReports.reduce((sum, b) => sum + b.totalRentalDays, 0);

    return res.json({
      overview,
      cashFlow,
      monthlySummary: {
        period: month && year ? `${month}/${year}` : 'Current Period',
        totalRentals: overview.totalRentalCount,
        totalRentalDays,
        totalRevenue: overview.totalRevenue,
        totalExpenses: overview.totalExpenses,
        netProfit: overview.netProfit,
        topPerformingBike: topBike ? topBike.name : 'N/A',
        highestExpenseCategory: highestExpenseCategory.category,
        highestExpenseAmount: highestExpenseCategory.amount,
        partnerBalances: partnerData.partners,
        settlementRecommendation: partnerData.recommendations[0]?.label || 'Balances Settled'
      },
      bikeWiseReports,
      partnerReports: partnerData.partners,
      customerReports: customerReports.sort((a, b) => b.totalSpent - a.totalSpent)
    });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ message: 'Error generating reports.' });
  }
};
