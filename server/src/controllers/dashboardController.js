const calculationService = require('../services/calculationService');
const settlementService = require('../services/settlementService');
const notificationService = require('../services/notificationService');
const Bike = require('../models/Bike');
const Rental = require('../models/Rental');
const Transaction = require('../models/Transaction');

exports.getDashboardData = async (req, res) => {
  try {
    const { timeframe = 'month', startDate, endDate } = req.query;

    // 1. Core Financial Overview
    const financialOverview = await calculationService.getFinancialOverview(startDate, endDate);

    // 2. Partner Settlement Status
    const partnerData = await settlementService.getPartnerBalances();
    const totalAmountPayable = partnerData.recommendations.reduce((sum, r) => sum + r.amount, 0);

    // 3. Analytics Charts
    const analytics = await calculationService.getAnalyticsData(timeframe);

    // 4. Bike Dashboard Cards (This Month metrics)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const bikes = await Bike.find({ status: { $ne: 'inactive' } }).lean();
    const bikeCards = await Promise.all(
      bikes.map(async (bike) => {
        const monthRentals = await Rental.find({
          bike: bike._id,
          startDate: { $gte: startOfCurrentMonth },
          status: { $ne: 'cancelled' }
        }).lean();

        const monthRevenue = monthRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const allTimeStats = await calculationService.getBikeFinancials(bike._id);

        return {
          id: bike._id,
          name: bike.name,
          brand: bike.brand,
          model: bike.model,
          variant: bike.variant,
          registrationNumber: bike.registrationNumber,
          status: bike.status,
          defaultDailyRate: bike.defaultDailyRate,
          defaultHourlyRate: bike.defaultHourlyRate || Math.round(bike.defaultDailyRate / 8) || 120,
          imageUrl: bike.imageUrl,
          currentOdometer: bike.currentOdometer,
          thisMonthRentals: monthRentals.length,
          thisMonthRevenue: monthRevenue,
          allTimeRevenue: allTimeStats.totalRevenue,
          allTimeExpenses: allTimeStats.totalExpenses,
          allTimeProfit: allTimeStats.netProfit,
          totalRentalDays: allTimeStats.totalRentalDays
        };
      })
    );

    // 5. Recent Financial Transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .populate('bike paidByPartner receivedByPartner customer')
      .lean();

    // 6. Refresh and get top alerts
    const alerts = await notificationService.refreshSystemAlerts();
    const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

    return res.json({
      summary: {
        ...financialOverview,
        amountPayable: totalAmountPayable
      },
      analytics,
      bikeCards,
      partnerSummary: {
        partners: partnerData.partners,
        realizedProfit: partnerData.realizedProfit,
        recommendations: partnerData.recommendations
      },
      recentTransactions,
      alerts: alerts.slice(0, 5),
      unreadAlertsCount
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Error retrieving dashboard analytics.' });
  }
};
