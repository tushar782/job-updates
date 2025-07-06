const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // External ID from the job source (required for duplicate checking)
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
    default: 'full-time'
  },
  category: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  companyUrl: {
    type: String,
    trim: true
  },
  requirements: [String],
  benefits: [String],
  isActive: {
    type: Boolean,
    default: true
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
  sourceName: {
    type: String,
    trim: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
jobSchema.index({ category: 1, jobType: 1 });
jobSchema.index({ publishedDate: -1 });
jobSchema.index({ source: 1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);