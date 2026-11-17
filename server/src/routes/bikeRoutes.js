const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, bikeController.getAllBikes);
router.get('/:id', authenticate, bikeController.getBikeById);
router.post('/', authenticate, bikeController.createBike);
router.put('/:id', authenticate, bikeController.updateBike);
router.delete('/:id', authenticate, bikeController.deleteBike);

module.exports = router;
