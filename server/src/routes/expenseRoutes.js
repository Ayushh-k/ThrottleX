const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, expenseController.getAllExpenses);
router.post('/', authenticate, expenseController.createExpense);
router.delete('/:id', authenticate, expenseController.deleteExpense);

module.exports = router;
