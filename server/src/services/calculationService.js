const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');
const CapitalInvestment = require('../models/CapitalInvestment');

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
    const totalRentalDays = rentals.reduce((acc, r) => acc + (r.totalDays || (r.totalHours ? Number((r.totalHours / 24).toFixed(1)) : 0)), 0);
    const totalRentalHours = rentals.reduce((acc, r) => acc + (r.totalHours || (r.totalDays ? r.totalDays * 24 : 0)), 0);

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
      totalRentalHours,
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

  /**
   * Calculate true profit for a single rental with fuel and maintenance allocation
   * @param {Object} rental - Rental document or object
   * @param {Array} [directExpenses] - Optional array of expenses for that bike
   */
  async calculateRentalProfit(rental, directExpenses = null) {
    if (!rental) return null;
    const grossRevenue = Number(rental.totalAmount || 0);
    const bikeId = rental.bike?._id || rental.bike;

    // Check distance traveled
    const startOdo = Number(rental.startOdometer || 0);
    const endOdo = Number(rental.endOdometer || 0);
    const diffKm = (endOdo > startOdo && startOdo > 0) ? (endOdo - startOdo) : 0;

    // Duration in days and hours
    const days = Number(rental.totalDays || (rental.totalHours ? (rental.totalHours / 24).toFixed(1) : 1));
    const hours = Number(rental.totalHours || (rental.totalDays ? rental.totalDays * 24 : 24));
    const isHourly = rental.rentalType === 'hourly';

    // Find direct trip expenses if not passed in
    let tripExpenses = directExpenses;
    if (!tripExpenses && bikeId) {
      const sDate = new Date(rental.startDate);
      // Give a 2-hour grace buffer before start and after end
      const windowStart = new Date(sDate.getTime() - 2 * 60 * 60 * 1000);
      const eDate = new Date(rental.actualEndDate || rental.expectedEndDate);
      const windowEnd = new Date(eDate.getTime() + 2 * 60 * 60 * 1000);

      tripExpenses = await Expense.find({
        bike: bikeId,
        expenseDate: { $gte: windowStart, $lte: windowEnd }
      }).lean();
    }
    tripExpenses = tripExpenses || [];

    // Direct trip fuel
    const directFuel = tripExpenses
      .filter((e) => e.category === 'petrol')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Direct trip maintenance/service/repair
    const directMaint = tripExpenses
      .filter((e) => ['service', 'repair', 'engine_oil', 'tyres'].includes(e.category))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Direct other trip expenses (challans, punctures, cleaning)
    const directOther = tripExpenses
      .filter((e) => !['petrol', 'service', 'repair', 'engine_oil', 'tyres'].includes(e.category))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Determine allocations: Use direct if logged; otherwise calculate realistic pro-rata estimate
    let fuelAllocation = directFuel;
    let fuelSource = directFuel > 0 ? 'direct_logged' : 'estimated';
    if (directFuel === 0) {
      if (diffKm > 0) {
        // Assume avg motorcycle mileage of 35 km/l at ₹105/litre
        fuelAllocation = Math.round((diffKm / 35) * 105);
      } else if (isHourly) {
        fuelAllocation = Math.round(hours * 35);
      } else {
        fuelAllocation = Math.round(days * 150);
      }
    }

    let maintenanceAllocation = directMaint;
    let maintSource = directMaint > 0 ? 'direct_logged' : 'estimated';
    if (directMaint === 0) {
      if (diffKm > 0) {
        maintenanceAllocation = Math.round(diffKm * 0.80);
      } else if (isHourly) {
        maintenanceAllocation = Math.round(hours * 15);
      } else {
        maintenanceAllocation = Math.round(days * 75);
      }
    }

    const otherAllocation = directOther;
    const totalCost = fuelAllocation + maintenanceAllocation + otherAllocation;
    const netProfit = Math.round(grossRevenue - totalCost);
    const profitMargin = grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

    return {
      grossRevenue,
      fuelAllocation,
      fuelSource,
      maintenanceAllocation,
      maintSource,
      otherAllocation,
      totalCost,
      netProfit,
      profitMargin,
      diffKm,
      isDirectTripCost: directFuel > 0 || directMaint > 0 || directOther > 0
    };
  }

  /**
   * Cash Flow & Real-Time Liquidity Position
   * Calculates actual cash in hand, UPI, Bank balances, customer receivables, and partner payables
   */
  async getCashFlowOverview() {
    const validRentals = await Rental.find({ status: { $ne: 'cancelled' } }).distinct('_id');
    const payments = await Payment.find({ rental: { $in: validRentals } })
      .populate('receivedByPartner', 'name avatar')
      .lean();
    const expenses = await Expense.find()
      .populate('paidByPartner', 'name avatar')
      .lean();
    const capitalInvestments = await CapitalInvestment.find()
      .populate('partner', 'name avatar')
      .lean();
    const partners = await Partner.find({ status: 'active' }).lean();

    // 1. Inflow from customer payments
    let cashInflow = 0;
    let upiInflow = 0;
    let bankInflow = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      const m = (p.paymentMethod || '').toLowerCase();
      if (m === 'cash') cashInflow += amt;
      else if (m === 'bank_transfer' || m === 'bank') bankInflow += amt;
      else upiInflow += amt;
    });

    // 2. Capital Contributions inflow
    let cashCapital = 0;
    let upiCapital = 0;
    let bankCapital = 0;

    capitalInvestments.forEach((c) => {
      const amt = Number(c.amount || 0);
      const m = (c.paymentMethod || '').toLowerCase();
      if (m === 'cash') cashCapital += amt;
      else if (m === 'bank_transfer' || m === 'bank') bankCapital += amt;
      else upiCapital += amt;
    });

    // Add initialCapital from partners
    partners.forEach((p) => {
      bankCapital += Number(p.initialCapital || 0);
    });

    // 3. Outflows from expenses
    let cashOutflow = 0;
    let upiOutflow = 0;
    let bankOutflow = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      const m = (e.paymentMethod || '').toLowerCase();
      if (m === 'cash') cashOutflow += amt;
      else if (m === 'bank_transfer' || m === 'bank') bankOutflow += amt;
      else upiOutflow += amt;
    });

    // Net positions
    const cashInHand = Math.round((cashInflow + cashCapital - cashOutflow) * 100) / 100;
    const upi = Math.round((upiInflow + upiCapital - upiOutflow) * 100) / 100;
    const bank = Math.round((bankInflow + bankCapital - bankOutflow) * 100) / 100;
    const totalLiquidCash = Math.round((cashInHand + upi + bank) * 100) / 100;

    // 4. Customer Pending (Uncollected remaining balance on non-cancelled rentals)
    const unpaidRentals = await Rental.find({
      status: { $ne: 'cancelled' },
      remainingAmount: { $gt: 0 }
    }).populate('customer', 'name phone').populate('bike', 'name registrationNumber').lean();

    const customerPending = unpaidRentals.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

    // 5. Per-Partner Cash Holdings
    const partnerHoldings = {};
    partners.forEach((p) => {
      partnerHoldings[p._id.toString()] = {
        partnerId: p._id,
        name: p.name,
        avatar: p.avatar,
        cash: 0,
        upi: 0,
        bank: 0,
        total: 0
      };
    });

    payments.forEach((p) => {
      const pId = p.receivedByPartner?._id ? p.receivedByPartner._id.toString() : p.receivedByPartner ? p.receivedByPartner.toString() : null;
      if (pId && partnerHoldings[pId]) {
        const m = (p.paymentMethod || '').toLowerCase();
        const amt = Number(p.amount || 0);
        if (m === 'cash') partnerHoldings[pId].cash += amt;
        else if (m === 'bank_transfer' || m === 'bank') partnerHoldings[pId].bank += amt;
        else partnerHoldings[pId].upi += amt;
        partnerHoldings[pId].total += amt;
      }
    });

    expenses.forEach((e) => {
      const pId = e.paidByPartner?._id ? e.paidByPartner._id.toString() : e.paidByPartner ? e.paidByPartner.toString() : null;
      if (pId && partnerHoldings[pId]) {
        const m = (e.paymentMethod || '').toLowerCase();
        const amt = Number(e.amount || 0);
        if (m === 'cash') partnerHoldings[pId].cash -= amt;
        else if (m === 'bank_transfer' || m === 'bank') partnerHoldings[pId].bank -= amt;
        else partnerHoldings[pId].upi -= amt;
        partnerHoldings[pId].total -= amt;
      }
    });

    // 6. Partner Payable from Settlement Recommendations
    const settlementService = require('./settlementService');
    const settlementBalances = await settlementService.getPartnerBalances();
    const partnerPayable = settlementBalances.recommendations.reduce((sum, r) => sum + r.amount, 0);

    return {
      cashInHand,
      upi,
      bank,
      totalLiquidCash,
      customerPending,
      partnerPayable,
      breakdown: {
        inflows: {
          payments: { cash: cashInflow, upi: upiInflow, bank: bankInflow },
          capital: { cash: cashCapital, upi: upiCapital, bank: bankCapital }
        },
        outflows: {
          expenses: { cash: cashOutflow, upi: upiOutflow, bank: bankOutflow }
        }
      },
      partnerHoldings: Object.values(partnerHoldings),
      pendingCustomersList: unpaidRentals.slice(0, 5).map((r) => ({
        rentalId: r._id,
        rentalNumber: r.rentalNumber,
        customerName: r.customer?.name || 'Customer',
        customerPhone: r.customer?.phone || '',
        bikeName: r.bike?.name || 'Bike',
        remainingAmount: r.remainingAmount,
        expectedEndDate: r.expectedEndDate
      }))
    };
  }
}

module.exports = new CalculationService();
