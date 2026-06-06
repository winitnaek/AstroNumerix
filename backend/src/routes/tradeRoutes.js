const express = require('express');
const { cleanAnalysis, stockOutlook } = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/clean-analysis', protect, cleanAnalysis);
router.post('/stock-outlook', protect, stockOutlook);

module.exports = router;
