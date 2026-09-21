const express = require('express');
const { getWeather } = require('../controllers/weatherController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWeather);

module.exports = router;
