const { jobQueue } = require('../queues/jobQueue');
const ImportLog = require('../models/ImportLog');
const JobApiService = require('../services/jobApiService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ImportController {
  // Start import process
  async startImport(req, res) {
    try {
      const { urls } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'URLs array is required'
        });
      }

      const importJobs = [];

      for (const url of urls) {
        // Create import log
        const importLog = new ImportLog({
          fileName: url,
          source: url.includes('jobicy.com') ? 'jobicy' : 'higheredjobs',
          sourceUrl: url,
          status: 'pending'
        });

        await importLog.save();

        // Add job to queue
        const job = await jobQueue.add('import-jobs', {
          url: url,
          importLogId: importLog._id.toString()
        }, {
          jobId: uuidv4(),
          delay: 0
        });

        importJobs.push({
          jobId: job.id,
          importLogId: importLog._id,
          url: url
        });

        logger.info(`📋 Import job queued: ${job.id} for URL: ${url}`);
      }

      res.json({
        success: true,
        message: `${importJobs.length} import jobs queued successfully`,
        data: importJobs
      });
    } catch (error) {
      logger.error('❌ Error starting import:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start import',
        error: error.message
      });
    }
  }

  // Start automatic import for all configured APIs
  async startAutoImport(req, res) {
    try {
      const jobApiService = new JobApiService();
      const endpoints = JobApiService.getApiEndpoints();
      
      const importJobs = [];

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
          delay: 0
        });

        importJobs.push({
          jobId: job.id,
          importLogId: importLog._id,
          url: endpoint.url,
          source: endpoint.source
        });

        logger.info(`📋 Auto import job queued: ${job.id} for ${endpoint.name}`);
      }

      res.json({
        success: true,
        message: `${importJobs.length} auto import jobs queued successfully`,
        data: importJobs
      });
    } catch (error) {
      logger.error('❌ Error starting auto import:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start auto import',
        error: error.message
      });
    }
  }

  // Get import history
  async getImportHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const source = req.query.source;

      let filter = {};
      if (source) {
        filter.source = source;
      }

      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        ImportLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ImportLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('❌ Error getting import history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get import history',
        error: error.message
      });
    }
  }

  // Get specific import log details
  async getImportLogDetails(req, res) {
    try {
      const { id } = req.params;
      
      const importLog = await ImportLog.findById(id);
      if (!importLog) {
        return res.status(404).json({
          success: false,
          message: 'Import log not found'
        });
      }

      res.json({
        success: true,
        data: importLog
      });
    } catch (error) {
      logger.error('❌ Error getting import log details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get import log details',
        error: error.message
      });
    }
  }

  // Get queue status
  async getQueueStatus(req, res) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        jobQueue.getWaiting(),
        jobQueue.getActive(),
        jobQueue.getCompleted(),
        jobQueue.getFailed()
      ]);

      res.json({
        success: true,
        data: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          total: waiting.length + active.length + completed.length + failed.length
        }
      });
    } catch (error) {
      logger.error('❌ Error getting queue status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get queue status',
        error: error.message
      });
    }
  }

  // Get available API endpoints
  async getApiEndpoints(req, res) {
    try {
      const jobApiService = new JobApiService();
      const endpoints = JobApiService.getApiEndpoints();
      const sources = jobApiService.getAvailableSources();

      res.json({
        success: true,
        data: {
          endpoints,
          sources
        }
      });
    } catch (error) {
      logger.error('❌ Error getting API endpoints:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get API endpoints',
        error: error.message
      });
    }
  }
}

module.exports = new ImportController();