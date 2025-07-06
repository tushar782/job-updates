const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const logger = require('../utils/logger');

class JobImportService {
  async processJobs(jobs, importLogId) {
    const importLog = await ImportLog.findById(importLogId);
    if (!importLog) {
      throw new Error('Import log not found');
    }

    const results = {
      totalImported: 0,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      failedJobsDetails: []
    };

    logger.info(`🔄 Processing ${jobs.length} jobs for import log: ${importLogId}`);

    for (const jobData of jobs) {
      try {
        // Use externalId for finding existing jobs
        const existingJob = await Job.findOne({ externalId: jobData.externalId });

        if (existingJob) {
          // Update existing job
          const updatedJob = await Job.findOneAndUpdate(
            { externalId: jobData.externalId },
            {
              ...jobData,
              lastUpdated: new Date()
            },
            { new: true, runValidators: true }
          );

          if (updatedJob) {
            results.updatedJobs++;
            results.totalImported++;
            logger.debug(`✅ Updated job: ${jobData.title}`);
          }
        } else {
          // Create new job
          const newJob = new Job(jobData);
          await newJob.save();

          results.newJobs++;
          results.totalImported++;
          logger.debug(`✅ Created new job: ${jobData.title}`);
        }
      } catch (error) {
        results.failedJobs++;
        results.failedJobsDetails.push({
          jobId: jobData.externalId,
          reason: error.message,
          error: error.stack
        });

        logger.error(`❌ Failed to process job: ${jobData.title}`, {
          error: error.message,
          jobId: jobData.externalId
        });
      }
    }

    // Calculate duration
    const duration = Date.now() - importLog.startTime.getTime();

    // Update import log with results
    await ImportLog.findByIdAndUpdate(importLogId, {
      ...results,
      status: 'completed',
      endTime: new Date(),
      duration: duration
    });

    logger.info(`✅ Import completed for log: ${importLogId}`, results);
    return results;
  }

  async getImportHistory(page = 1, limit = 10, source = null) {
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (source) {
      filter.source = source;
    }

    const [logs, total] = await Promise.all([
      ImportLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ImportLog.countDocuments(filter)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getImportLogDetails(importLogId) {
    const importLog = await ImportLog.findById(importLogId);
    if (!importLog) {
      throw new Error('Import log not found');
    }
    return importLog;
  }
}

module.exports = new JobImportService();