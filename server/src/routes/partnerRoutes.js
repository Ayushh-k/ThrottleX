const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, partnerController.getAllPartners);
router.get('/:id', authenticate, partnerController.getPartnerById);
router.post('/', authenticate, requireRole('owner'), partnerController.createPartner);
router.post('/:id/login-access', authenticate, requireRole('owner'), partnerController.setPartnerLoginAccess);
router.put('/:id', authenticate, partnerController.updatePartner);

module.exports = router;
