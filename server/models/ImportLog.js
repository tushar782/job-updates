const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['jobicy', 'higheredjobs']
  },
  sourceUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  totalFetched: {
    type: Number,
    default: 0
  },
  totalImported: {
    type: Number,
    default: 0
  },
  newJobs: {
    type: Number,
    default: 0
  },
  updatedJobs: {
    type: Number,
    default: 0
  },
  failedJobs: {
    type: Number,
    default: 0
  },
  failedJobsDetails: [{
    jobId: String,
    reason: String,
    error: String
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes
importLogSchema.index({ createdAt: -1 });
importLogSchema.index({ source: 1 });
importLogSchema.index({ status: 1 });

module.exports = mongoose.model('ImportLog', importLogSchema);