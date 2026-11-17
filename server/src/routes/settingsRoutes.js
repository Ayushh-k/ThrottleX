const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, settingsController.getSettings);
router.put('/', authenticate, requireRole('owner'), settingsController.updateSettings);

module.exports = router;
