require('dotenv').config();

process.env.__ALREADY_BOOTSTRAPPED_ENVS = true;

const app = require('./app');

// Vercel expects the file to export the handler
module.exports = app;
