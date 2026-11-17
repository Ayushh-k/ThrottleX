const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuelController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, fuelController.getFuelEntries);
router.post('/', authenticate, fuelController.addFuelEntry);

module.exports = router;
