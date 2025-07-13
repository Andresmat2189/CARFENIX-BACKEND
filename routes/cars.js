

const express = require('express');
const router = express.Router();
const CarController = require('../controllers/CarController');

// Rutas del catálogo
router.get('/', CarController.getCars);
router.post('/', CarController.createCar);

module.exports = router;

