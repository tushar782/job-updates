const { Queue, Worker } = require('bullmq');
const redis = require('../config/redis');
const JobApiService = require('../services/jobApiService');
const jobImportService = require('../services/jobImportService');
const ImportLog = require('../models/ImportLog');
const logger = require('../utils/logger');

// Create job queue
const jobQueue = new Queue('job-import', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Create worker
const worker = new Worker('job-import', async (job) => {
  const { url, importLogId } = job.data;
  
  try {
    logger.info(`🔄 Worker processing job: ${job.id} for URL: ${url}`);
    
    // Update import log status
    await ImportLog.findByIdAndUpdate(importLogId, {
      status: 'processing',
      startTime: new Date()
    });

    // Create API config from URL
    const apiConfig = {
      name: url.includes('jobicy.com') ? 'jobicy' : 'higheredjobs',
      url: url,
      source: url.includes('jobicy.com') ? 'jobicy' : 'higheredjobs'
    };

    // Create JobApiService instance
    const jobApiService = new JobApiService();
    
    // Fetch jobs from API
    const apiResponse = await jobApiService.fetchJobsFromApi(apiConfig);
    
    if (!apiResponse.success) {
      throw new Error(`API fetch failed: ${apiResponse.error}`);
    }
    
    // Update total fetched
    await ImportLog.findByIdAndUpdate(importLogId, {
      totalFetched: apiResponse.totalJobs
    });

    // Process jobs if any were fetched
    let results = {
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      failedJobsDetails: []
    };

    if (apiResponse.jobs && apiResponse.jobs.length > 0) {
      results = await jobImportService.processJobs(apiResponse.jobs, importLogId);
    }
    
    logger.info(`✅ Worker completed job: ${job.id}`, results);
    return results;
  } catch (error) {
    logger.error(`❌ Worker failed job: ${job.id}`, {
      error: error.message,
      stack: error.stack
    });
    
    // Update import log with error
    await ImportLog.findByIdAndUpdate(importLogId, {
      status: 'failed',
      errorMessage: error.message,
      endTime: new Date(),
      duration: Date.now() - new Date().getTime()
    });
    
    throw error;
  }
}, {
  connection: redis,
  concurrency: 2
});

// Worker event listeners
worker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} failed:`, err);
});

worker.on('error', (err) => {
  logger.error('❌ Worker error:', err);
});

module.exports = {
  jobQueue,
  worker
};