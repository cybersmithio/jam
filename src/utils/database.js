const mongoose = require('mongoose');
const config = require('../config');

let isConnected = false;

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    await mongoose.connect(config.database.uri, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('Connected to MongoDB:', config.database.uri.replace(/\/\/.*@/, '//***@')); // Hide credentials in log

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Please check your MongoDB connection string in data/config.json');
    // Don't exit - allow server to start even if DB is unavailable
    // This allows testing without MongoDB running
  }
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  isDatabaseConnected
};
