const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { authenticate } = require('../middleware/auth');

router.get('/check-availability', authenticate, rentalController.checkAvailability);
router.get('/', authenticate, rentalController.getAllRentals);
router.get('/:id', authenticate, rentalController.getRentalById);
router.post('/', authenticate, rentalController.createRental);
router.post('/:id/return', authenticate, rentalController.returnBike);
router.post('/:id/payment', authenticate, rentalController.recordRentalPayment);
router.post('/:id/cancel', authenticate, rentalController.cancelRental);

module.exports = router;
