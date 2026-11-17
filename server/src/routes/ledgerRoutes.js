const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ledgerController.getAllTransactions);
router.get('/audit-logs', authenticate, ledgerController.getAuditLogs);

module.exports = router;
