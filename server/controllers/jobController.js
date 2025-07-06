const Job = require('../models/Job');
const logger = require('../utils/logger');

class JobController {
  // Get all jobs with pagination and filters
  async getJobs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category;
      const jobType = req.query.jobType;
      const source = req.query.source;
      const search = req.query.search;

      // Build filter object
      let filter = { isActive: true };

      if (category && category !== 'all') {
        filter.category = new RegExp(category, 'i');
      }

      if (jobType && jobType !== 'all') {
        filter.jobType = jobType;
      }

      if (source && source !== 'all') {
        filter.source = source;
      }

      if (search && search.trim()) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      logger.info(`Fetching jobs with filter:`, filter);

      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ publishedDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Job.countDocuments(filter)
      ]);

      logger.info(`Found ${jobs.length} jobs out of ${total} total`);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('❌ Error getting jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get jobs',
        error: error.message
      });
    }
  }

  // Get job statistics
  async getJobStats(req, res) {
    try {
      const [
        totalJobs,
        activeJobs,
        jobsBySource,
        jobsByCategory,
        jobsByType,
        recentJobs
      ] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ isActive: true }),
        Job.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$source', count: { $sum: 1 } } }
        ]),
        Job.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Job.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$jobType', count: { $sum: 1 } } }
        ]),
        Job.countDocuments({
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalJobs,
          activeJobs,
          recentJobs,
          jobsBySource,
          jobsByCategory,
          jobsByType
        }
      });
    } catch (error) {
      logger.error('❌ Error getting job stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job statistics',
        error: error.message
      });
    }
  }

  // Get single job
  async getJob(req, res) {
    try {
      const { id } = req.params;

      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid job ID format'
        });
      }

      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      logger.error('❌ Error getting job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job',
        error: error.message
      });
    }
  }

  // Search jobs
  async searchJobs(req, res) {
    try {
      const { q: query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const skip = (page - 1) * limit;

      const searchFilter = {
        isActive: true,
        $text: { $search: query }
      };

      const [jobs, total] = await Promise.all([
        Job.find(searchFilter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit)
          .lean(),
        Job.countDocuments(searchFilter)
      ]);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          query
        }
      });
    } catch (error) {
      logger.error('❌ Error searching jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search jobs',
        error: error.message
      });
    }
  }
}

module.exports = new JobController();