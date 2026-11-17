const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, reportController.getReports);

module.exports = router;
