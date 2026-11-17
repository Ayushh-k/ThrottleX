const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, customerController.getAllCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, customerController.createCustomer);
router.put('/:id', authenticate, customerController.updateCustomer);
router.delete('/:id', authenticate, customerController.deleteCustomer);

module.exports = router;
