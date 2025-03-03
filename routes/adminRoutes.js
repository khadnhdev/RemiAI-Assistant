const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Login routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Dashboard route (protected)
router.get('/dashboard', isAuthenticated, adminController.getDashboard);
router.get('/', (req, res) => res.redirect('/dashboard'));

module.exports = router; 