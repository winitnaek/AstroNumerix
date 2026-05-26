const express = require('express');
const {
  clearHistory,
  compatibility,
  createProfile,
  forecast,
  history,
  loshu,
  nameScore
} = require('../controllers/numerologyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/history', history);
router.delete('/history', clearHistory);
router.post('/profile', createProfile);
router.post('/forecast', forecast);
router.post('/compatibility', compatibility);
router.post('/loshu', loshu);
router.post('/name-score', nameScore);

module.exports = router;
