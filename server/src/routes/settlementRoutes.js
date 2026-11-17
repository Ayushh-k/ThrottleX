const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, settlementController.getSettlementOverview);
router.post('/', authenticate, settlementController.recordSettlement);

module.exports = router;
