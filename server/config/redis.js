
const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;

function connectRedis() {
  redisClient = new Redis(REDIS_URL);

  redisClient.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('❌ Redis connection error:', err);
    process.exit(1);
  });

  return redisClient;
}

function getRedis() {
  if (!redisClient) {
    throw new Error('Redis client not initialized—call connectRedis() first');
  }
  return redisClient;
}

module.exports = {
  connectRedis,
  getRedis,
};
