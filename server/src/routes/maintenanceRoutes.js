const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, maintenanceController.getAllMaintenance);
router.post('/', authenticate, maintenanceController.addMaintenanceRecord);

module.exports = router;
