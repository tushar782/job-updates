
const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://tusharpimple017:kRr9emXgFfCTymxM@job-system.fbjsaie.mongodb.net/job-system?retryWrites=true&w=majority';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (err) {
    logger.error('Error disconnecting MongoDB:', err);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
