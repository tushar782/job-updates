const express = require('express');
const importController = require('../controllers/importController');
const router = express.Router();

// POST /api/import/start - Start import process
router.post('/start', importController.startImport);

// POST /api/import/auto - Start automatic import for all endpoints
router.post('/auto', importController.startAutoImport);

// GET /api/import/endpoints - Get available API endpoints
router.get('/endpoints', importController.getApiEndpoints);

// GET /api/import/queue/status - Get queue status (must come before /history/:id)
router.get('/queue/status', importController.getQueueStatus);

// GET /api/import/history - Get import history
router.get('/history', importController.getImportHistory);

// GET /api/import/history/:id - Get specific import log details
router.get('/history/:id', importController.getImportLogDetails);

module.exports = router;