const express = require('express');
const { loginAdmin, setupAdmin } = require('../controllers/authController');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/setup', setupAdmin); // Run once to create admin account

module.exports = router;