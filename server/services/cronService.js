const cron = require('node-cron');
const { jobQueue } = require('../queues/jobQueue');
const ImportLog = require('../models/ImportLog');
const JobApiService = require('./jobApiService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class CronService {
  constructor() {
    this.jobs = [];
  }

  // Start hourly job import
  startHourlyJobImport() {
    // Run every hour at minute 0
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('🕐 Starting hourly job import...');
        await this.executeAutoImport();
      } catch (error) {
        logger.error('❌ Error in hourly job import:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.push({
      name: 'hourly-job-import',
      schedule: '0 * * * *',
      job: job
    });

    job.start();
    logger.info('✅ Hourly job import cron started');
  }

  // Start daily job import (as backup)
  startDailyJobImport() {
    // Run every day at 2 AM
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('🌅 Starting daily job import...');
        await this.executeAutoImport();
      } catch (error) {
        logger.error('❌ Error in daily job import:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.push({
      name: 'daily-job-import',
      schedule: '0 2 * * *',
      job: job
    });

    job.start();
    logger.info('✅ Daily job import cron started');
  }

  // Execute auto import for all endpoints
  async executeAutoImport() {
    try {
      const endpoints = JobApiService.getApiEndpoints();
      logger.info(`🚀 Auto importing from ${endpoints.length} endpoints`);

      for (const endpoint of endpoints) {
        // Create import log
        const importLog = new ImportLog({
          fileName: endpoint.url,
          source: endpoint.source,
          sourceUrl: endpoint.url,
          status: 'pending'
        });

        await importLog.save();

        // Add job to queue
        const job = await jobQueue.add('import-jobs', {
          url: endpoint.url,
          importLogId: importLog._id.toString()
        }, {
          jobId: uuidv4(),
          delay: Math.random() * 5000 // Random delay up to 5 seconds
        });

        logger.info(`📋 Auto import job queued: ${job.id} for ${endpoint.name}`);
      }

      logger.info('✅ Auto import jobs queued successfully');
    } catch (error) {
      logger.error('❌ Error executing auto import:', error);
      throw error;
    }
  }

  // Stop all cron jobs
  stopAllJobs() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`⏹️ Stopped cron job: ${name}`);
    });
    this.jobs = [];
  }

  // Get status of all cron jobs
  getJobsStatus() {
    return this.jobs.map(({ name, schedule, job }) => ({
      name,
      schedule,
      running: job.running
    }));
  }

  // Start all cron jobs
  startAll() {
    this.startHourlyJobImport();
    // Uncomment if you want daily backup as well
    // this.startDailyJobImport();
    
    logger.info('🚀 All cron jobs started');
  }
}

module.exports = new CronService();