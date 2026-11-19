const express = require('express');
const router = express.Router();
const capitalController = require('../controllers/capitalController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, capitalController.getCapitalOverview);
router.post('/', authenticate, requireRole('owner'), capitalController.createInvestment);
router.post('/sync-ownership', authenticate, requireRole('owner'), capitalController.syncOwnershipRatios);
router.delete('/:id', authenticate, requireRole('owner'), capitalController.deleteInvestment);

module.exports = router;
