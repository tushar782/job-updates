const express = require('express');
const jobController = require('../controllers/jobController');
const router = express.Router();

// GET /api/jobs/stats - Get job statistics (must come before /:id)
router.get('/stats', jobController.getJobStats);

// GET /api/jobs/search - Search jobs
router.get('/search', jobController.searchJobs);

// GET /api/jobs - Get all jobs with filters
router.get('/', jobController.getJobs);

// GET /api/jobs/:id - Get job by ID
router.get('/:id', jobController.getJob);

module.exports = router;