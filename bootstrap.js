require('dotenv').config();
process.env.__ALREADY_BOOTSTRAPPED_ENVS = true;

// Re-export for Vercel (when used as serverless entry point)
module.exports = require('./app');
