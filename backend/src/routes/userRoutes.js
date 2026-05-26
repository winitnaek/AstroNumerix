const express = require('express');
const { updateMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.patch('/me', protect, updateMe);

module.exports = router;
