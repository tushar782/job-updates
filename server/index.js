// root file 

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const cronService = require('./services/cronService');
const logger = require('./utils/logger');

const importRoutes = require('./routes/importRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to databases
connectDB();
connectRedis();

// Start cron jobs
cronService.startAll();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: '✅ Job Import API up and running!',
    version: '1.0.0',
    features: [
      'Job Import from Multiple Sources',
      'Queue-based Processing with Redis',
      'Automatic Hourly Imports',
      'Import History Tracking',
      'RESTful API'
    ],
    cronJobs: cronService.getJobsStatus()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cronJobs: cronService.getJobsStatus()
  });
});

app.use('/api/import', importRoutes);
app.use('/api/jobs', jobRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  cronService.stopAllJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  cronService.stopAllJobs();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 Job Import API listening on http://localhost:${PORT}`);
  logger.info(`🌐 CORS enabled for: ${allowedOrigin}`);
  logger.info(`⏰ Cron jobs: ${cronService.getJobsStatus().length} active`);
});