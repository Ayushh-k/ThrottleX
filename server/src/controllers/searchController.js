const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Partner = require('../models/Partner');

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ bikes: [], customers: [], rentals: [], expenses: [], partners: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [bikes, rawCustomers, rentals, expenses, partners] = await Promise.all([
      Bike.find({
        $or: [{ name: regex }, { brand: regex }, { model: regex }, { registrationNumber: regex }]
      })
        .limit(5)
        .lean(),

      Customer.find({
        $or: [{ name: regex }, { phone: regex }, { email: regex }, { dlNumber: regex }]
      })
        .limit(5)
        .lean(),

      Rental.find({
        $or: [{ rentalNumber: regex }]
      })
        .populate('bike', 'name registrationNumber')
        .populate('customer', 'name phone')
        .limit(5)
        .lean(),

      Expense.find({
        $or: [{ description: regex }, { category: regex }, { expenseNumber: regex }]
      })
        .populate('bike', 'name')
        .populate('paidByPartner', 'name')
        .limit(5)
        .lean(),

      Partner.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }]
      })
        .limit(5)
        .lean()
    ]);

    // Enrich customers with rental count and spend
    const customers = await Promise.all(
      rawCustomers.map(async (c) => {
        const cRentals = await Rental.find({ customer: c._id, status: { $ne: 'cancelled' } }).lean();
        const totalSpent = cRentals.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
        return {
          ...c,
          totalRentals: cRentals.length,
          totalSpent
        };
      })
    );

    return res.json({
      bikes,
      customers,
      rentals,
      expenses,
      partners
    });
  } catch (err) {
    console.error('globalSearch error:', err);
    return res.status(500).json({ message: 'Error performing global search.' });
  }
};
