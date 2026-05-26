const express = require('express');
const { cleanAnalysis } = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/clean-analysis', protect, cleanAnalysis);

module.exports = router;
