const express = require('express');
const router = express.Router();
const aiConfigController = require('../controllers/aiConfigController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// All AI config routes require authentication
router.use(isAuthenticated);

// Main list
router.get('/', aiConfigController.getAIConfigs);

// Create
router.get('/create', aiConfigController.getCreateAIConfig);
router.post('/create', aiConfigController.postCreateAIConfig);

// Edit
router.get('/edit/:id', aiConfigController.getEditAIConfig);
router.post('/edit/:id', aiConfigController.postUpdateAIConfig);

// Delete
router.delete('/:id', aiConfigController.deleteAIConfig);
router.post('/delete/:id', (req, res) => {
  aiConfigController.deleteAIConfig(req, res);
});

module.exports = router; 