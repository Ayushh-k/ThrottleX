const Expense = require('../models/Expense');
const Bike = require('../models/Bike');
const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const ledgerService = require('../services/ledgerService');
const { getNextExpenseNumber } = require('../utils/idGenerator');

exports.getAllExpenses = async (req, res) => {
  try {
    const { category, bikeId, partnerId, startDate, endDate, search } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (bikeId && bikeId !== 'all') filter.bike = bikeId;
    if (partnerId && partnerId !== 'all') filter.paidByPartner = partnerId;

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.expenseDate.$lte = end;
      }
    }

    const expenses = await Expense.find(filter)
      .populate('bike', 'name brand model registrationNumber')
      .populate('paidByPartner', 'name avatar')
      .populate('createdBy', 'name')
      .sort({ expenseDate: -1, createdAt: -1 })
      .lean();

    if (search) {
      const q = search.toLowerCase();
      const filtered = expenses.filter((e) => {
        return (
          e.description?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.bike?.name?.toLowerCase().includes(q) ||
          e.paidByPartner?.name?.toLowerCase().includes(q)
        );
      });
      return res.json({ expenses: filtered });
    }

    return res.json({ expenses });
  } catch (err) {
    console.error('getAllExpenses error:', err);
    return res.status(500).json({ message: 'Error fetching expenses.' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const {
      bikeId,
      category,
      amount,
      expenseDate,
      paidByPartnerId,
      paymentMethod = 'upi',
      description,
      odometer,
      receiptImage = '',
      notes = ''
    } = req.body;

    if (!category || !amount || !description) {
      return res.status(400).json({ message: 'Category, amount, and description are required.' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than ₹0.' });
    }

    let partner = null;
    if (paidByPartnerId) {
      partner = await Partner.findById(paidByPartnerId);
    }
    if (!partner) {
      partner = await Partner.findOne({ status: 'active' });
    }
    if (!partner) {
      partner = await Partner.findOne();
    }
    if (!partner) {
      partner = await Partner.create({
        name: req.user?.name || 'Managing Partner',
        email: req.user?.email || 'owner@throttlex.com',
        phone: req.user?.phone || '',
        sharePercentage: 100,
        status: 'active'
      });
    }

    let bike = null;
    if (bikeId && bikeId !== 'general') {
      bike = await Bike.findById(bikeId);
    }

    const expenseNumber = await getNextExpenseNumber();

    const expense = await Expense.create({
      expenseNumber,
      bike: bike ? bike._id : null,
      category,
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paidByPartner: partner._id,
      paymentMethod,
      description,
      odometer: odometer ? Number(odometer) : undefined,
      receiptImage,
      notes,
      createdBy: req.user?._id
    });

    // Record into Ledger
    await ledgerService.recordExpense({
      expense,
      partner,
      bike,
      userId: req.user?._id,
      userName: req.user?.name
    });

    return res.status(201).json({ message: 'Expense added successfully.', expense });
  } catch (err) {
    console.error('createExpense error:', err);
    return res.status(500).json({ message: err.message || 'Error adding expense.' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });

    // Remove matching ledger transaction
    await Transaction.deleteMany({ relatedId: expense._id, relatedModel: 'Expense' });

    await ledgerService.recordAudit({
      action: 'EXPENSE_DELETED',
      entityType: 'Expense',
      entityId: expense._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Partner',
      details: `Deleted expense #${expense.expenseNumber} of ₹${expense.amount} (${expense.category}).`
    });

    await Expense.findByIdAndDelete(expense._id);

    return res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ message: err.message || 'Error deleting expense.' });
  }
};
