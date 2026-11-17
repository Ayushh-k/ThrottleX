const Rental = require('../models/Rental');
const Bike = require('../models/Bike');
const Notification = require('../models/Notification');
const settlementService = require('./settlementService');

class NotificationService {
  async refreshSystemAlerts() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const alerts = [];

    // 1. Overdue Rentals
    const overdueRentals = await Rental.find({
      status: 'active',
      expectedEndDate: { $lt: now }
    }).populate('bike customer');

    overdueRentals.forEach((r) => {
      alerts.push({
        title: `Overdue Rental: #${r.rentalNumber}`,
        message: `${r.bike?.name || 'Bike'} rented to ${r.customer?.name || 'Customer'} was due on ${new Date(r.expectedEndDate).toLocaleDateString('en-IN')}.`,
        type: 'rental_due',
        severity: 'urgent',
        link: `/rentals/${r._id}`
      });
    });

    // 2. Rentals Ending Today
    const endingToday = await Rental.find({
      status: 'active',
      expectedEndDate: { $gte: startOfToday, $lte: endOfToday }
    }).populate('bike customer');

    endingToday.forEach((r) => {
      alerts.push({
        title: `Return Scheduled Today: #${r.rentalNumber}`,
        message: `${r.bike?.name || 'Bike'} is scheduled for return by ${r.customer?.name || 'Customer'} today.`,
        type: 'rental_due',
        severity: 'info',
        link: `/rentals/${r._id}`
      });
    });

    // 3. Maintenance and Service Due
    const bikes = await Bike.find({ status: { $ne: 'inactive' } });
    bikes.forEach((b) => {
      if (b.nextServiceOdo && b.currentOdometer && b.nextServiceOdo > 0) {
        const kmRemaining = b.nextServiceOdo - b.currentOdometer;
        if (kmRemaining <= 500 && kmRemaining > 0) {
          alerts.push({
            title: `Service Due Soon: ${b.name}`,
            message: `${b.name} (${b.registrationNumber}) is due for service in ${kmRemaining} km.`,
            type: 'service_due',
            severity: 'warning',
            link: `/bikes/${b._id}`
          });
        } else if (kmRemaining <= 0) {
          alerts.push({
            title: `Service Overdue: ${b.name}`,
            message: `${b.name} (${b.registrationNumber}) has crossed service threshold by ${Math.abs(kmRemaining)} km!`,
            type: 'service_due',
            severity: 'urgent',
            link: `/bikes/${b._id}`
          });
        }
      }

      if (b.insuranceExpiryDate && new Date(b.insuranceExpiryDate) <= in15Days) {
        alerts.push({
          title: `Insurance Expiry Alert: ${b.name}`,
          message: `Insurance for ${b.name} expires on ${new Date(b.insuranceExpiryDate).toLocaleDateString('en-IN')}.`,
          type: 'insurance_due',
          severity: 'warning',
          link: `/bikes/${b._id}`
        });
      }
    });

    // 4. Partner Settlements Pending
    try {
      const balanceData = await settlementService.getPartnerBalances();
      if (balanceData.recommendations && balanceData.recommendations.length > 0) {
        balanceData.recommendations.forEach((rec) => {
          alerts.push({
            title: 'Partner Settlement Pending',
            message: rec.label,
            type: 'settlement_due',
            severity: 'info',
            link: '/settlements'
          });
        });
      }
    } catch (e) {}

    // Synchronize alerts with Notification DB
    for (const alert of alerts) {
      const existing = await Notification.findOne({
        title: alert.title,
        message: alert.message,
        createdAt: { $gte: startOfToday }
      });
      if (!existing) {
        await Notification.create(alert);
      }
    }

    return Notification.find().sort({ createdAt: -1 }).limit(30);
  }
}

module.exports = new NotificationService();
